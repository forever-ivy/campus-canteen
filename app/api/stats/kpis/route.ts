import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import {
  addDays,
  endOfDay,
  startOfDay,
  toCurrency,
  toNumber,
} from "../../_utils/transform";

const SUPPORTED_PERIODS = ["today", "week", "month"] as const;
type SupportedPeriod = (typeof SUPPORTED_PERIODS)[number];

const isSupportedPeriod = (value: string): value is SupportedPeriod =>
  SUPPORTED_PERIODS.includes(value as SupportedPeriod);

const summarizeOrders = async (from: Date, to: Date) => {
  const aggregate = await prisma.order.aggregate({
    where: {
      OrderTime: {
        gte: from,
        lt: to,
      },
    },
    _sum: {
      TotalAmount: true,
    },
    _count: {
      OrderID: true,
    },
  });

  const totalSales = toNumber(aggregate._sum.TotalAmount);
  const orderCount = aggregate._count.OrderID ?? 0;
  return {
    totalSales,
    orderCount,
  };
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const periodParam = (url.searchParams.get("period") || "today").toLowerCase();

    if (!isSupportedPeriod(periodParam)) {
      return NextResponse.json(
        { error: "仅支持 period=today|week|month" },
        { status: 400 },
      );
    }

    const now = new Date();
    const todayStart = startOfDay(now);

    let rangeStart = todayStart;
    let rangeEnd: Date;

    if (periodParam === "today") {
      rangeEnd = now;
    } else if (periodParam === "week") {
      rangeStart = addDays(todayStart, -6);
      rangeEnd = endOfDay(now);
    } else {
      rangeStart = addDays(todayStart, -29);
      rangeEnd = endOfDay(now);
    }

    const summary = await summarizeOrders(rangeStart, rangeEnd);

    const totalSales = toCurrency(summary.totalSales);
    const orders = summary.orderCount;
    const avgOrderAmount = orders > 0 ? toCurrency(summary.totalSales / orders) : 0;

    let comparison: { deltaPct: number | null; fromLabel: string } | null = null;

    if (periodParam === "today") {
      const previousStart = addDays(rangeStart, -1);
      const previousEnd = addDays(rangeEnd, -1);
      const prevSummary = await summarizeOrders(previousStart, previousEnd);
      const deltaPct =
        prevSummary.totalSales === 0
          ? null
          : Number(
              (
                ((summary.totalSales - prevSummary.totalSales) /
                  prevSummary.totalSales) *
                100
              ).toFixed(2),
            );
      comparison = {
        deltaPct,
        fromLabel: "较昨日同期",
      };
    }

    return NextResponse.json({
      period: periodParam,
      kpis: {
        totalSales,
        orders,
        avgOrderAmount,
        comparison,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
