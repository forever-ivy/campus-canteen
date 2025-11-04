"use client";

import { LabelList, Pie, PieChart } from "recharts";
import { Card } from "../../card";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A pie chart with a label list";

const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function ChartPieLabelList() {
  return (
    <Card className="w-full h-full">
      <div className="w-full h-full flex flex-col p-0">
        <div className="flex items-baseline justify-center gap-2">
          <h3 className="text-lg font-semibold">Pie Chart - Label List</h3>
          <p className="text-sm text-muted-foreground">January - June 2024</p>
        </div>
        <div className="flex-1 flex items-start justify-center min-h-0">
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-text]:fill-background aspect-square w-60 h-60"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="visitors" hideLabel />}
              />
              <Pie data={chartData} dataKey="visitors">
                <LabelList
                  dataKey="browser"
                  className="fill-background"
                  stroke="none"
                  fontSize={12}
                  formatter={(value: string) =>
                    chartConfig[value as keyof typeof chartConfig]?.label
                  }
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </Card>
  );
}
