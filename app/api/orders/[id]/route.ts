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
    const result = await buildRequest().query<PaymentRow>(`
        SELECT
          PayID,
          PayMethod,
          Amount,
          PayTime
        FROM PaymentMethod
        WHERE OrderID = @orderId
        ORDER BY PayTime DESC
      `);
    return result.recordset;
  } catch (err) {
    if (!isMissingTableError(err)) {
      throw err;
    }
  }

  const fallbackResult = await buildRequest().query<PaymentRow>(`
      SELECT
        PayID,
        PayMethod,
        Amount,
        PayTime
      FROM Payment
      WHERE OrderID = @orderId
      ORDER BY PayTime DESC
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
    await buildRequest().query(
      "DELETE FROM PaymentMethod WHERE OrderID = @orderId"
    );
  } catch (err) {
    if (!isMissingTableError(err)) {
      throw err;
    }
    await buildRequest().query("DELETE FROM Payment WHERE OrderID = @orderId");
  }
}

async function fetchOrderDetail(
  pool: sql.ConnectionPool,
  orderId: string
): Promise<OrderDetailData | null> {
  const orderRequest = pool.request();
  orderRequest.input("orderId", orderId);
  const orderResult = await orderRequest.query<OrderRow>(`
      SELECT
        o.OrderID,
        o.StudentID,
        s.SName AS StudentName,
        o.MerchantID,
        m.MName AS MerchantName,
        m.Location,
        o.TotalAmount,
        o.[Status],
        o.OrderTime
      FROM [Order] AS o
      INNER JOIN Student AS s ON s.StudentID = o.StudentID
      INNER JOIN Merchant AS m ON m.MerchantID = o.MerchantID
      WHERE o.OrderID = @orderId
    `);

  if (orderResult.recordset.length === 0) {
    return null;
  }

  const orderRow = orderResult.recordset[0];

  const paymentsResult = await queryPaymentRows(pool, orderId);

  const detailsRequest = pool.request();
  detailsRequest.input("orderId", orderId);
  const detailsResult = await detailsRequest.query<DetailRow>(`
      SELECT
        od.OrderID,
        od.DishID,
        d.DName AS DishName,
        d.Price,
        od.Quantity
      FROM OrderDetail AS od
      LEFT JOIN Dish AS d ON d.DishID = od.DishID
      WHERE od.OrderID = @orderId
      ORDER BY d.DName
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

    const result = await requestBuilder.query(`
        UPDATE [Order]
        SET ${updates.join(", ")}
        WHERE OrderID = @orderId
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

    await deletePayments(transaction, orderId);

    const deleteDetailsRequest = new sql.Request(transaction);
    deleteDetailsRequest.input("orderId", orderId);
    await deleteDetailsRequest.query(
      "DELETE FROM OrderDetail WHERE OrderID = @orderId"
    );

    const deleteOrderRequest = new sql.Request(transaction);
    deleteOrderRequest.input("orderId", orderId);
    const deleteOrderResult = await deleteOrderRequest.query(
      "DELETE FROM [Order] WHERE OrderID = @orderId"
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
