import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import {
  endOfDay,
  parseDateParam,
  toCurrency,
  toNumber,
} from "../../_utils/transform";

type MerchantAnalyticsRow = {
  MerchantID: number;
  merchantName: string;
  totalSales: unknown;
  orderCount: number;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderBy = (url.searchParams.get("order") || "sales").toLowerCase();
    const from = parseDateParam(url.searchParams.get("from"));
    const toInput = parseDateParam(url.searchParams.get("to"));
    const to = toInput ? endOfDay(toInput) : null;

    const conditions: Prisma.Sql[] = [];
    if (from) conditions.push(Prisma.sql`o.[OrderTime] >= ${from}`);
    if (to) conditions.push(Prisma.sql`o.[OrderTime] < ${to}`);

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<MerchantAnalyticsRow[]>(
      Prisma.sql`
        SELECT
          o.[MerchantID] AS MerchantID,
          m.[Name] AS merchantName,
          SUM(o.[TotalAmount]) AS totalSales,
          COUNT(*) AS orderCount
        FROM [Order] o
        INNER JOIN [Merchant] m ON m.[MerchantID] = o.[MerchantID]
        ${whereClause}
        GROUP BY o.[MerchantID], m.[Name]
      `,
    );

    const items = rows
      .map((row) => {
        const sales = toNumber(row.totalSales);
        const orderCount = Number(row.orderCount ?? 0);
        const avg = orderCount > 0 ? sales / orderCount : 0;
        return {
          merchantId: row.MerchantID,
          name: row.merchantName,
          totalSales: toCurrency(sales),
          orderCount,
          avgOrderAmount: toCurrency(avg),
        };
      })
      .sort((a, b) =>
        orderBy === "orders"
          ? b.orderCount - a.orderCount
          : b.totalSales - a.totalSales,
      );

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
