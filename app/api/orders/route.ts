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
    const q = searchParams.get("q");

    // 构建 SQL 查询语句：查询订单列表，包含学生和档口信息
    const sqlParts: string[] = [
      `
      -- 查询功能：获取订单列表，联表查询学生姓名和档口信息
      -- 涉及表：[Order](订单表)、Student(学生表)、Merchant(档口表）
      SELECT
        [Order].OrderID,           -- 订单编号
        [Order].OrderTime,         -- 下单时间
        [Order].TotalAmount,       -- 订单总金额
        [Order].[Status],          -- 订单状态（待支付/已完成）
        Student.SName AS StudentName,    -- 学生姓名
        Merchant.MName AS MerchantName,  -- 档口名称
        Merchant.Location          -- 档口位置
      FROM [Order]
      INNER JOIN Student ON Student.StudentID = [Order].StudentID
      INNER JOIN Merchant ON Merchant.MerchantID = [Order].MerchantID
    `,
    ];

    const requestBuilder = pool.request();

    // 条件过滤：全局搜索功能，支持订单号、学生ID、档口名称、档口ID的模糊匹配
    if (q && q.trim().length > 0) {
      const trimmed = q.trim();
      // 如果已有 WHERE 子句，需要加 AND；如果没有，先添加 WHERE 1=1
      if (!sqlParts.some((part) => part.trim().startsWith("WHERE"))) {
        sqlParts.push("WHERE 1=1");
      }
      sqlParts.push(
        "-- 搜索条件:支持订单号、学生ID、档口名称、档口ID的模糊查询(LIKE %关键词%)",
        "AND (CAST([Order].OrderID AS NVARCHAR(15)) LIKE @q OR CAST(Student.StudentID AS NVARCHAR(12)) LIKE @q OR LTRIM(RTRIM(Merchant.MName)) LIKE @q OR CAST(Merchant.MerchantID AS NVARCHAR(5)) LIKE @q)"
      );
      requestBuilder.input("q", `%${trimmed}%`);
    }

    // 排序：按下单时间倒序排列（最新订单在最前面）
    sqlParts.push(
      "-- 排序：按下单时间降序排列",
      "ORDER BY [Order].OrderTime DESC"
    );

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

    const { studentId, merchantId, totalAmount, status, orderTime, details } =
      payload as {
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

    const normalizedStatus = (
      typeof status === "string" ? status : "待支付"
    ) as OrderTableRow["status"];
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

      const { dishId, quantity } = detail as {
        dishId?: unknown;
        quantity?: unknown;
      };
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

      // 生成订单ID（格式：档口ID(5位) + 年月日(6位YYMMDD) + 序号(4位)）
      const dateStr = normalizedOrderTime
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, "");
      const sequenceRequest = new sql.Request(transaction);
      sequenceRequest.input("merchantId", sql.Char(5), merchantId.trim());
      sequenceRequest.input(
        "datePattern",
        sql.NVarChar(50),
        `${merchantId.trim()}${dateStr}%`
      );

      // 查询功能：获取当天该档口的最大订单序号，用于生成新的订单编号
      // 涉及表：[Order]（订单表）
      // 作用：找到今天该档口最后一个订单的序号，新订单序号在此基础上 +1
      const sequenceResult = await sequenceRequest.query<{
        MaxSeq: number | null;
      }>(`
        -- 查询当天该档口的最大订单序号
        SELECT MAX(CAST(RIGHT([Order].OrderID, 4) AS INT)) AS MaxSeq
        FROM [Order]
        WHERE [Order].OrderID LIKE @datePattern
      `);

      const nextSeq = (sequenceResult.recordset[0]?.MaxSeq ?? 0) + 1;
      const orderId = `${merchantId.trim()}${dateStr}${String(nextSeq).padStart(
        4,
        "0"
      )}`;

      // 插入功能：向订单表中插入新订单记录
      // 涉及表：[Order]（订单表）
      // 作用：创建新订单，记录订单编号、学生ID、档口ID、下单时间、总金额、订单状态
      const orderRequest = new sql.Request(transaction);
      orderRequest.input("orderId", sql.Char(15), orderId);
      orderRequest.input("studentId", sql.Char(12), studentId.trim());
      orderRequest.input("merchantId", sql.Char(5), merchantId.trim());
      orderRequest.input("orderTime", sql.DateTime, normalizedOrderTime);
      orderRequest.input(
        "totalAmount",
        sql.Decimal(10, 2),
        Math.round(totalAmount * 100) / 100
      );
      orderRequest.input("status", sql.NVarChar(10), normalizedStatus);

      await orderRequest.query(`
        -- 增加操作：插入新订单到 [Order] 表
        INSERT INTO [Order] (OrderID, StudentID, MerchantID, OrderTime, TotalAmount, Status)
        VALUES (@orderId, @studentId, @merchantId, @orderTime, @totalAmount, @status)
      `);

      // 插入功能：循环插入订单明细（订单中的每个菜品）
      // 涉及表：OrderDetail（订单明细表）
      // 作用：记录订单中购买的每个菜品及其数量
      for (const detail of details) {
        const { dishId, quantity } = detail as {
          dishId: string;
          quantity: number;
        };
        const detailRequest = new sql.Request(transaction);
        detailRequest.input("orderId", sql.Char(15), orderId);
        detailRequest.input("dishId", sql.Char(8), dishId.trim());
        detailRequest.input("quantity", sql.Int, quantity);

        await detailRequest.query(`
          -- 增加操作：插入订单明细到 OrderDetail 表
          -- 记录订单编号、菜品ID、购买数量
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
