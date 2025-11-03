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
  OrderTime: Date | null;
  Status: string;
};

export async function GET(request: Request) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");

    const sqlParts: string[] = [
      `
      SELECT
        [Order].OrderID,
        [Order].OrderTime,
        [Order].TotalAmount,
        [Order].[Status],
        Student.Name AS StudentName,
        Merchant.Name AS MerchantName,
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

    sqlParts.push("ORDER BY [Order].OrderTime DESC");

    const result = await requestBuilder.query<OrderQueryRow>(
      sqlParts.join("\n")
    );

    const orders: OrderTableRow[] = result.recordset.map((row) => ({
      id: row.OrderID,
      student: row.StudentName,
      store: row.MerchantName,
      location: row.Location ? row.Location.trim() : null,
      amount:
        typeof row.TotalAmount === "number"
          ? row.TotalAmount
          : Number(row.TotalAmount),
      orderedAt: row.OrderTime ? new Date(row.OrderTime).toISOString() : null,
      status: row.Status as OrderTableRow["status"],
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("获取订单数据失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
