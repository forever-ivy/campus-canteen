import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import { addDays, endOfDay, startOfDay, toCurrency } from "../../_utils/transform";

const SUPPORTED_PERIODS = ["today", "week", "month"] as const;
type Period = (typeof SUPPORTED_PERIODS)[number];

const isPeriod = (value: string): value is Period =>
  SUPPORTED_PERIODS.includes(value as Period);

type HourRow = {
  hour: number;
  total: unknown;
};

type DayRow = {
  day: string;
  total: unknown;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const periodParam = (url.searchParams.get("period") || "today").toLowerCase();

    if (!isPeriod(periodParam)) {
      return NextResponse.json(
        { error: "period 参数仅支持 today|week|month" },
        { status: 400 },
      );
    }

    const now = new Date();

    if (periodParam === "today") {
      const start = startOfDay(now);
      const end = endOfDay(now);
      const rows = await prisma.$queryRaw<HourRow[]>(
        Prisma.sql`
          SELECT DATEPART(HOUR, [OrderTime]) AS hour,
                 SUM([TotalAmount]) AS total
          FROM [Order]
          WHERE [OrderTime] >= ${start} AND [OrderTime] < ${end}
          GROUP BY DATEPART(HOUR, [OrderTime])
          ORDER BY hour
        `,
      );

      const data = Array.from({ length: 24 }, (_, hour) => {
        const row = rows.find((item) => Number(item.hour) === hour);
        return {
          x: hour,
          y: toCurrency(row?.total ?? 0),
        };
      });

      return NextResponse.json({
        period: periodParam,
        unit: "hour",
        points: data,
      });
    }

    const days = periodParam === "week" ? 7 : 30;
    const end = endOfDay(now);
    const start = addDays(startOfDay(now), -(days - 1));

    const rows = await prisma.$queryRaw<DayRow[]>(
      Prisma.sql`
        SELECT CONVERT(VARCHAR(10), CAST([OrderTime] AS DATE), 120) AS day,
               SUM([TotalAmount]) AS total
        FROM [Order]
        WHERE [OrderTime] >= ${start} AND [OrderTime] < ${end}
        GROUP BY CAST([OrderTime] AS DATE)
        ORDER BY day
      `,
    );

    const points = [];
    for (let i = 0; i < days; i += 1) {
      const day = addDays(start, i);
      const key = day.toISOString().slice(0, 10);
      const row = rows.find((item) => item.day === key);
      points.push({
        x: key,
        y: toCurrency(row?.total ?? 0),
      });
    }

    return NextResponse.json({
      period: periodParam,
      unit: "day",
      points,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
