import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import { endOfDay, parseDateParam, toCurrency } from "../../_utils/transform";

type DishRankingRow = {
  DishID: number;
  dishName: string;
  totalQty: number;
  totalSales: unknown;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 10)));
    const from = parseDateParam(url.searchParams.get("from"));
    const toInput = parseDateParam(url.searchParams.get("to"));
    const to = toInput ? endOfDay(toInput) : null;

    const conditions: Prisma.Sql[] = [];
    if (from) conditions.push(Prisma.sql`o.[OrderTime] >= ${from}`);
    if (to) conditions.push(Prisma.sql`o.[OrderTime] < ${to}`);

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<DishRankingRow[]>(
      Prisma.sql`
        SELECT TOP (${Prisma.raw(String(limit))})
          od.[DishID] AS DishID,
          d.[Name] AS dishName,
          SUM(od.[Quantity]) AS totalQty,
          SUM(od.[Subtotal]) AS totalSales
        FROM [OrderDetail] od
        INNER JOIN [Dish] d ON d.[DishID] = od.[DishID]
        INNER JOIN [Order] o ON o.[OrderID] = od.[OrderID]
        ${whereClause}
        GROUP BY od.[DishID], d.[Name]
        ORDER BY totalQty DESC
      `,
    );

    const items = rows.map((row) => ({
      dishId: row.DishID,
      name: row.dishName,
      totalQty: Number(row.totalQty ?? 0),
      totalSales: toCurrency(row.totalSales),
    }));

    return NextResponse.json({ limit, items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
