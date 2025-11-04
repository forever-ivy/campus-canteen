import { NextResponse } from "next/server";

import { getPool, sql } from "@/lib/db";
import type { OrderTableRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderQueryRow = {
  OrderID: string;
  StudentName: string;
  MerchantName: string;
  Location: string | null;
  TotalAmount: number | string;
  OrderTime: Date | string | null;
  Status: string;
};

export async function GET(request: Request) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const q = searchParams.get("q");

    const sqlParts: string[] = [
      `
      SELECT
        [Order].OrderID,
        [Order].OrderTime,
        [Order].TotalAmount,
        [Order].[Status],
        Student.SName AS StudentName,
        Merchant.MName AS MerchantName,
        Merchant.Location
      FROM [Order]
      INNER JOIN Student ON Student.StudentID = [Order].StudentID
      INNER JOIN Merchant ON Merchant.MerchantID = [Order].MerchantID
    `,
    ];

    const requestBuilder = pool.request();

    if (location) {
      sqlParts.push(
        "WHERE LTRIM(RTRIM(Merchant.Location)) = LTRIM(RTRIM(@location))",
      );
      requestBuilder.input("location", sql.NVarChar(50), location.trim());
    }

    // 搜索：订单号、学生ID、商家名称或商家ID（模糊匹配）
    if (q && q.trim().length > 0) {
      const trimmed = q.trim();
      // 如果已有 WHERE，需要加 AND；如果没有，先加 WHERE
      if (!sqlParts.some((part) => part.trim().startsWith("WHERE"))) {
        sqlParts.push("WHERE 1=1");
      }
      sqlParts.push(
        "AND (CAST([Order].OrderID AS NVARCHAR(15)) LIKE @q OR CAST(Student.StudentID AS NVARCHAR(12)) LIKE @q OR LTRIM(RTRIM(Merchant.MName)) LIKE @q OR CAST(Merchant.MerchantID AS NVARCHAR(5)) LIKE @q)"
      );
      requestBuilder.input("q", sql.NVarChar(100), `%${trimmed}%`);
    }

    sqlParts.push("ORDER BY [Order].OrderTime DESC");

    const result = await requestBuilder.query<OrderQueryRow>(
      sqlParts.join("\n")
    );

    const orders: OrderTableRow[] = result.recordset.map((row) => ({
      id: row.OrderID.trim(),
      student: row.StudentName.trim(),
      store: row.MerchantName.trim(),
      location: row.Location ? row.Location.trim() : null,
      amount:
        typeof row.TotalAmount === "number"
          ? row.TotalAmount
          : Number(row.TotalAmount),
      orderedAt: row.OrderTime ? new Date(row.OrderTime).toISOString() : null,
      status: (row.Status ?? "").trim() as OrderTableRow["status"],
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("获取订单数据失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (err) {
      console.error("解析创建订单请求失败:", err);
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

    const { studentId, merchantId, totalAmount, status, orderTime, details } = payload as {
      studentId?: unknown;
      merchantId?: unknown;
      totalAmount?: unknown;
      status?: unknown;
      orderTime?: unknown;
      details?: unknown;
    };

    // 验证必填字段
    if (typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json(
        { error: "学生ID不能为空" },
        { status: 400, statusText: "Bad Request" }
      );
    }

    if (typeof merchantId !== "string" || !merchantId.trim()) {
      return NextResponse.json(
        { error: "档口ID不能为空" },
        { status: 400, statusText: "Bad Request" }
      );
    }

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

    const normalizedStatus = (typeof status === "string" ? status : "待支付") as OrderTableRow["status"];
    if (!["待支付", "已完成"].includes(normalizedStatus)) {
      return NextResponse.json(
        { error: "订单状态无效" },
        { status: 400, statusText: "Bad Request" }
      );
    }

    let normalizedOrderTime: Date;
    if (orderTime && typeof orderTime === "string") {
      const parsed = new Date(orderTime);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "下单时间无效" },
          { status: 400, statusText: "Bad Request" }
        );
      }
      normalizedOrderTime = parsed;
    } else {
      normalizedOrderTime = new Date();
    }

    // 验证订单明细
    if (!Array.isArray(details) || details.length === 0) {
      return NextResponse.json(
        { error: "订单明细不能为空" },
        { status: 400, statusText: "Bad Request" }
      );
    }

    for (const detail of details) {
      if (typeof detail !== "object" || detail === null) {
        return NextResponse.json(
          { error: "订单明细格式错误" },
          { status: 400, statusText: "Bad Request" }
        );
      }

      const { dishId, quantity } = detail as { dishId?: unknown; quantity?: unknown };
      if (typeof dishId !== "string" || !dishId.trim()) {
        return NextResponse.json(
          { error: "菜品ID不能为空" },
          { status: 400, statusText: "Bad Request" }
        );
      }

      if (
        typeof quantity !== "number" ||
        Number.isNaN(quantity) ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          { error: "菜品数量必须为正整数" },
          { status: 400, statusText: "Bad Request" }
        );
      }
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // 生成订单ID（格式：MerchantID + YYMMDD + 序号）
      const dateStr = normalizedOrderTime
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, "");
      const sequenceRequest = new sql.Request(transaction);
      sequenceRequest.input("merchantId", sql.Char(5), merchantId.trim());
      sequenceRequest.input("datePattern", sql.NVarChar(50), `${merchantId.trim()}${dateStr}%`);

      const sequenceResult = await sequenceRequest.query<{ MaxSeq: number | null }>(`
        SELECT MAX(CAST(RIGHT(OrderID, 4) AS INT)) AS MaxSeq
        FROM [Order]
        WHERE OrderID LIKE @datePattern
      `);

      const nextSeq = (sequenceResult.recordset[0]?.MaxSeq ?? 0) + 1;
      const orderId = `${merchantId.trim()}${dateStr}${String(nextSeq).padStart(4, "0")}`;

      // 插入订单
      const orderRequest = new sql.Request(transaction);
      orderRequest.input("orderId", sql.Char(15), orderId);
      orderRequest.input("studentId", sql.Char(12), studentId.trim());
      orderRequest.input("merchantId", sql.Char(5), merchantId.trim());
      orderRequest.input("orderTime", sql.DateTime, normalizedOrderTime);
      orderRequest.input("totalAmount", sql.Decimal(10, 2), Math.round(totalAmount * 100) / 100);
      orderRequest.input("status", sql.NVarChar(10), normalizedStatus);

      await orderRequest.query(`
        INSERT INTO [Order] (OrderID, StudentID, MerchantID, OrderTime, TotalAmount, Status)
        VALUES (@orderId, @studentId, @merchantId, @orderTime, @totalAmount, @status)
      `);

      // 插入订单明细
      for (const detail of details) {
        const { dishId, quantity } = detail as { dishId: string; quantity: number };
        const detailRequest = new sql.Request(transaction);
        detailRequest.input("orderId", sql.Char(15), orderId);
        detailRequest.input("dishId", sql.Char(8), dishId.trim());
        detailRequest.input("quantity", sql.Int, quantity);

        await detailRequest.query(`
          INSERT INTO OrderDetail (OrderID, DishID, Quantity)
          VALUES (@orderId, @dishId, @quantity)
        `);
      }

      await transaction.commit();

      return NextResponse.json({ orderId, success: true }, { status: 201 });
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("创建订单回滚失败:", rollbackErr);
      }
      throw err;
    }
  } catch (err) {
    console.error("创建订单失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
