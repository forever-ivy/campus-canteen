import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPool, sql } from "@/lib/db";
import type {
  OrderDetailData,
  OrderDetailItem,
  OrderPaymentEntry,
  OrderStatus,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = {
  OrderID: string;
  StudentID: string;
  StudentName: string;
  MerchantID: string;
  MerchantName: string;
  Location: string | null;
  TotalAmount: number | string;
  Status: string;
  OrderTime: Date | string | null;
};

type PaymentRow = {
  PayID: string;
  PayMethod: string;
  Amount: number | string;
  PayTime: Date | string | null;
};

type DetailRow = {
  OrderID: string;
  DishID: string;
  DishName: string | null;
  Price: number | string | null;
  Quantity: number | null;
};

const ORDER_STATUS_SET = new Set<OrderStatus>(["待支付", "已完成"]);

const trimOrNull = (value: string | null | undefined) =>
  value ? value.trim() : null;

const isMissingTableError = (err: unknown) => {
  if (!(err instanceof Error)) return false;
  const message = err.message;
  return (
    /Invalid object name/i.test(message) ||
    /对象名.*无效/.test(message) ||
    /invalid object name/i.test(message)
  );
};

async function queryPaymentRows(
  pool: sql.ConnectionPool,
  orderId: string
): Promise<PaymentRow[]> {
  const buildRequest = () => {
    const request = pool.request();
    request.input("orderId", orderId);
    return request;
  };

  try {
    // 查询功能：获取指定订单的所有支付记录
    // 涉及表：PaymentMethod（支付方式表）
    // 作用：查询该订单的支付ID、支付方式、支付金额、支付时间
    const result = await buildRequest().query<PaymentRow>(`
        -- 查询指定订单的支付记录
        SELECT
          PaymentMethod.PayID,       -- 支付记录ID
          PaymentMethod.PayMethod,   -- 支付方式（微信/支付宝/校园卡）
          PaymentMethod.Amount,      -- 支付金额
          PaymentMethod.PayTime      -- 支付时间
        FROM PaymentMethod
        WHERE PaymentMethod.OrderID = @orderId
        ORDER BY PaymentMethod.PayTime DESC  -- 按支付时间降序排列
      `);
    return result.recordset;
  } catch (err) {
    if (!isMissingTableError(err)) {
      throw err;
    }
  }

  // 备用查询：如果 PaymentMethod 表不存在，尝试查询 Payment 表
  const fallbackResult = await buildRequest().query<PaymentRow>(`
      -- 备用查询：从 Payment 表获取支付记录
      SELECT
        Payment.PayID,
        Payment.PayMethod,
        Payment.Amount,
        Payment.PayTime
      FROM Payment
      WHERE Payment.OrderID = @orderId
      ORDER BY Payment.PayTime DESC
    `);

  return fallbackResult.recordset;
}

async function deletePayments(
  transaction: sql.Transaction,
  orderId: string
): Promise<void> {
  const buildRequest = () => {
    const request = new sql.Request(transaction);
    request.input("orderId", orderId);
    return request;
  };

  try {
    // 删除功能：删除指定订单的所有支付记录
    // 涉及表：PaymentMethod（支付方式表）
    // 作用：在删除订单之前，先删除该订单关联的所有支付记录
    await buildRequest().query(
      "-- 删除操作：删除指定订单的支付记录\nDELETE FROM PaymentMethod WHERE PaymentMethod.OrderID = @orderId"
    );
  } catch (err) {
    if (!isMissingTableError(err)) {
      throw err;
    }
    // 备用删除：如果 PaymentMethod 表不存在，尝试从 Payment 表删除
    await buildRequest().query("DELETE FROM Payment WHERE Payment.OrderID = @orderId");
  }
}

async function fetchOrderDetail(
  pool: sql.ConnectionPool,
  orderId: string
): Promise<OrderDetailData | null> {
  // 查询功能：获取订单基本信息，包含学生和档口信息
  // 涉及表：[Order]（订单表）、Student（学生表）、Merchant（档口表）
  // 作用：通过订单ID查询订单详细信息，联表获取学生姓名和档口信息
  const orderRequest = pool.request();
  orderRequest.input("orderId", orderId);
  const orderResult = await orderRequest.query<OrderRow>(`
      -- 查询订单基本信息，联表查询学生和档口信息
      SELECT
        [Order].OrderID,                      -- 订单编号
        [Order].StudentID,                    -- 学生ID
        Student.SName AS StudentName,         -- 学生姓名
        [Order].MerchantID,                   -- 档口ID
        Merchant.MName AS MerchantName,       -- 档口名称
        Merchant.Location,                    -- 档口位置
        [Order].TotalAmount,                  -- 订单总金额
        [Order].[Status],                     -- 订单状态（待支付/已完成）
        [Order].OrderTime                     -- 下单时间
      FROM [Order]
      INNER JOIN Student ON Student.StudentID = [Order].StudentID
      INNER JOIN Merchant ON Merchant.MerchantID = [Order].MerchantID
      WHERE [Order].OrderID = @orderId
    `);

  if (orderResult.recordset.length === 0) {
    return null;
  }

  const orderRow = orderResult.recordset[0];

  const paymentsResult = await queryPaymentRows(pool, orderId);

  // 查询功能：获取订单明细（订单中的所有菜品）
  // 涉及表：OrderDetail（订单明细表）、Dish（菜品表）
  // 作用：查询该订单包含的所有菜品信息（菜品ID、名称、价格、数量）
  const detailsRequest = pool.request();
  detailsRequest.input("orderId", orderId);
  const detailsResult = await detailsRequest.query<DetailRow>(`
      -- 查询订单明细，联表查询菜品信息
      SELECT
        OrderDetail.OrderID,              -- 订单编号
        OrderDetail.DishID,               -- 菜品ID
        Dish.DName AS DishName,           -- 菜品名称
        Dish.Price,                       -- 菜品单价
        OrderDetail.Quantity              -- 购买数量
      FROM OrderDetail
      LEFT JOIN Dish ON Dish.DishID = OrderDetail.DishID
      WHERE OrderDetail.OrderID = @orderId
      ORDER BY Dish.DName  -- 按菜品名称排序
    `);

  const payments: OrderPaymentEntry[] = paymentsResult.map(
    (payment) => ({
      payId: payment.PayID.trim(),
      payMethod: payment.PayMethod.trim(),
      amount:
        typeof payment.Amount === "number"
          ? payment.Amount
          : Number(payment.Amount ?? 0),
      payTime: payment.PayTime
        ? new Date(payment.PayTime).toISOString()
        : null,
    })
  );

  const details: OrderDetailItem[] = detailsResult.recordset.map((detail) => {
    const price =
      typeof detail.Price === "number"
        ? detail.Price
        : Number(detail.Price ?? 0);
    const quantity = typeof detail.Quantity === "number" ? detail.Quantity : 0;
    const subtotal = price * quantity;
    return {
      orderId: detail.OrderID.trim(),
      dishId: detail.DishID.trim(),
      dishName: trimOrNull(detail.DishName),
      price,
      quantity,
      subtotal,
    };
  });

  const statusRaw = (trimOrNull(orderRow.Status) as OrderStatus | null) ?? null;
  const normalizedStatus: OrderStatus = statusRaw && ORDER_STATUS_SET.has(statusRaw)
    ? statusRaw
    : "待支付";

  return {
    orderId: orderRow.OrderID.trim(),
    studentId: orderRow.StudentID.trim(),
    studentName: orderRow.StudentName.trim(),
    merchantId: orderRow.MerchantID.trim(),
    merchantName: orderRow.MerchantName.trim(),
    location: trimOrNull(orderRow.Location),
    totalAmount:
      typeof orderRow.TotalAmount === "number"
        ? orderRow.TotalAmount
        : Number(orderRow.TotalAmount ?? 0),
    status: normalizedStatus,
    orderTime: orderRow.OrderTime
      ? new Date(orderRow.OrderTime).toISOString()
      : null,
    payment: payments,
    details,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = id?.trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "缺少订单编号" },
      { status: 400, statusText: "Bad Request" }
    );
  }

  try {
    const pool = await getPool();

    const order = await fetchOrderDetail(pool, orderId);
    if (!order) {
      return NextResponse.json(
        { error: "未找到对应订单" },
        { status: 404, statusText: "Not Found" }
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("获取订单详情失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = id?.trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "缺少订单编号" },
      { status: 400, statusText: "Bad Request" }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (err) {
    console.error("解析订单更新请求失败:", err);
    return NextResponse.json(
      { error: "请求体格式错误" },
      { status: 400, statusText: "Bad Request" }
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json(
      { error: "请求体格式错误" },
      { status: 400, statusText: "Bad Request" }
    );
  }

  const { status, totalAmount, orderTime } = payload as {
    status?: unknown;
    totalAmount?: unknown;
    orderTime?: unknown;
  };

  const updates: string[] = [];

  let normalizedStatus: OrderStatus | undefined;
  if (status !== undefined) {
    if (typeof status !== "string" || !ORDER_STATUS_SET.has(status as OrderStatus)) {
      return NextResponse.json(
        { error: "订单状态无效" },
        { status: 400, statusText: "Bad Request" }
      );
    }
    normalizedStatus = status as OrderStatus;
    updates.push("[Status] = @status");
  }

  let normalizedAmount: number | undefined;
  if (totalAmount !== undefined) {
    if (
      typeof totalAmount !== "number" ||
      Number.isNaN(totalAmount) ||
      !Number.isFinite(totalAmount) ||
      totalAmount < 0
    ) {
      return NextResponse.json(
        { error: "订单金额无效" },
        { status: 400, statusText: "Bad Request" }
      );
    }
    normalizedAmount = Math.round(totalAmount * 100) / 100;
    updates.push("TotalAmount = @totalAmount");
  }

  let normalizedOrderTime: Date | undefined;
  if (orderTime !== undefined) {
    if (typeof orderTime !== "string" || !orderTime.trim()) {
      return NextResponse.json(
        { error: "下单时间无效" },
        { status: 400, statusText: "Bad Request" }
      );
    }
    const parsed = new Date(orderTime);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "下单时间无效" },
        { status: 400, statusText: "Bad Request" }
      );
    }
    normalizedOrderTime = parsed;
    updates.push("OrderTime = @orderTime");
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: "未提供需要更新的字段" },
      { status: 400, statusText: "Bad Request" }
    );
  }

  try {
    const pool = await getPool();
    const requestBuilder = pool.request();
    requestBuilder.input("orderId", orderId);

    if (normalizedStatus !== undefined) {
      requestBuilder.input("status", normalizedStatus);
    }

    if (normalizedAmount !== undefined) {
      requestBuilder.input("totalAmount", normalizedAmount);
    }

    if (normalizedOrderTime) {
      requestBuilder.input("orderTime", normalizedOrderTime);
    }

    // 更新功能：修改订单信息（状态、金额或下单时间）
    // 涉及表：[Order]（订单表）
    // 作用：根据订单ID更新订单的状态、总金额或下单时间
    const result = await requestBuilder.query(`
        -- 改操作：更新订单信息
        UPDATE [Order]
        SET ${updates.join(", ")}
        WHERE [Order].OrderID = @orderId
      `);

    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return NextResponse.json(
        { error: "未找到对应订单" },
        { status: 404, statusText: "Not Found" }
      );
    }

    const order = await fetchOrderDetail(pool, orderId);
    if (!order) {
      return NextResponse.json(
        { error: "未找到对应订单" },
        { status: 404, statusText: "Not Found" }
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("更新订单失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = id?.trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "缺少订单编号" },
      { status: 400, statusText: "Bad Request" }
    );
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 删除功能步骤1：删除订单的支付记录
    await deletePayments(transaction, orderId);

    // 删除功能步骤2：删除订单明细
    // 涉及表：OrderDetail（订单明细表）
    // 作用：删除该订单下的所有菜品明细记录
    const deleteDetailsRequest = new sql.Request(transaction);
    deleteDetailsRequest.input("orderId", orderId);
    await deleteDetailsRequest.query(
      "-- 删除操作：删除订单明细\nDELETE FROM OrderDetail WHERE OrderDetail.OrderID = @orderId"
    );

    // 删除功能步骤3：删除订单主记录
    // 涉及表：[Order]（订单表）
    // 作用：删除订单主表中的订单记录
    const deleteOrderRequest = new sql.Request(transaction);
    deleteOrderRequest.input("orderId", orderId);
    const deleteOrderResult = await deleteOrderRequest.query(
      "-- 删除操作：删除订单主记录\nDELETE FROM [Order] WHERE [Order].OrderID = @orderId"
    );

    if (!deleteOrderResult.rowsAffected || deleteOrderResult.rowsAffected[0] === 0) {
      await transaction.rollback();
      return NextResponse.json(
        { error: "未找到对应订单" },
        { status: 404, statusText: "Not Found" }
      );
    }

    await transaction.commit();
    return NextResponse.json({ success: true });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      console.error("删除订单回滚失败:", rollbackErr);
    }

    console.error("删除订单失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
