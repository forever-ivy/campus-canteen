import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import {
  endOfDay,
  parseDateParam,
  toCurrency,
  toNumber,
} from "../../_utils/transform";

type DishAnalyticsRow = {
  DishID: number;
  dishName: string;
  price: unknown;
  merchantName: string;
  totalQty: number;
  totalSales: unknown;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const merchantIdParam = url.searchParams.get("merchantId");
    const orderBy = (url.searchParams.get("order") || "sales").toLowerCase();
    const from = parseDateParam(url.searchParams.get("from"));
    const toInput = parseDateParam(url.searchParams.get("to"));
    const to = toInput ? endOfDay(toInput) : null;
    const merchantId = merchantIdParam ? Number(merchantIdParam) : null;

    const conditions: Prisma.Sql[] = [];
    if (from) conditions.push(Prisma.sql`o.[OrderTime] >= ${from}`);
    if (to) conditions.push(Prisma.sql`o.[OrderTime] < ${to}`);
    if (merchantId && Number.isFinite(merchantId)) {
      conditions.push(Prisma.sql`o.[MerchantID] = ${merchantId}`);
    }

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<DishAnalyticsRow[]>(
      Prisma.sql`
        SELECT
          d.[DishID] AS DishID,
          d.[Name] AS dishName,
          d.[Price] AS price,
          m.[Name] AS merchantName,
          SUM(od.[Quantity]) AS totalQty,
          SUM(od.[Subtotal]) AS totalSales
        FROM [OrderDetail] od
        INNER JOIN [Dish] d ON d.[DishID] = od.[DishID]
        INNER JOIN [Order] o ON o.[OrderID] = od.[OrderID]
        INNER JOIN [Merchant] m ON m.[MerchantID] = o.[MerchantID]
        ${whereClause}
        GROUP BY d.[DishID], d.[Name], d.[Price], m.[Name]
      `,
    );

    const items = rows
      .map((row) => {
        const price = toCurrency(row.price);
        const totalSales = toNumber(row.totalSales);
        const totalQty = Number(row.totalQty ?? 0);
        return {
          dishId: row.DishID,
          name: row.dishName,
          merchant: row.merchantName,
          price,
          totalQty,
          totalSales: toCurrency(totalSales),
        };
      })
      .sort((a, b) =>
        orderBy === "qty"
          ? b.totalQty - a.totalQty
          : b.totalSales - a.totalSales,
      );

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
