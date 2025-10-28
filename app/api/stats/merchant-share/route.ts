import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import {
  endOfDay,
  parseDateParam,
  toCurrency,
  toNumber,
} from "../../_utils/transform";

type MerchantShareRow = {
  MerchantID: number;
  merchantName: string;
  totalSales: unknown;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = parseDateParam(url.searchParams.get("from"));
    const toInput = parseDateParam(url.searchParams.get("to"));
    const to = toInput ? endOfDay(toInput) : null;

    const conditions: Prisma.Sql[] = [];
    if (from) conditions.push(Prisma.sql`o.[OrderTime] >= ${from}`);
    if (to) conditions.push(Prisma.sql`o.[OrderTime] < ${to}`);

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<MerchantShareRow[]>(
      Prisma.sql`
        SELECT
          o.[MerchantID] AS MerchantID,
          m.[Name] AS merchantName,
          SUM(o.[TotalAmount]) AS totalSales
        FROM [Order] o
        INNER JOIN [Merchant] m ON m.[MerchantID] = o.[MerchantID]
        ${whereClause}
        GROUP BY o.[MerchantID], m.[Name]
        ORDER BY totalSales DESC
      `,
    );

    const totals = rows.map((row) => toNumber(row.totalSales));
    const grandTotal = totals.reduce((acc, value) => acc + value, 0);

    const items = rows.map((row) => {
      const sales = toNumber(row.totalSales);
      const sharePct =
        grandTotal === 0 ? 0 : Number(((sales / grandTotal) * 100).toFixed(2));
      return {
        merchantId: row.MerchantID,
        name: row.merchantName,
        totalSales: toCurrency(sales),
        sharePct,
      };
    });

    return NextResponse.json({
      total: toCurrency(grandTotal),
      items,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
