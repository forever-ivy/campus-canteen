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
      requestBuilder.input("q", sql.NVarChar, `%${trimmed}%`);
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
