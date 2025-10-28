"use client";

import { ChartAreaInteractive } from "@/components/ui/shadcn-io/area-chart-01";
import { Chart } from "../../components/Chart/Chart";
import KpiChart from "../../components/Chart/KpiChart";
import StoreLogo from "../../components/Navigation/StoreLogo";

export default function DashBoard() {
  return (
    <>
      <div className="w-full">
        <div className="w-full">
          <div className="mx-auto max-w-[1230px] px-4 sm:px-6">
            <div className="my-6 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <KpiChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 min-h-0">
                  <ChartAreaInteractive />
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-8">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 min-h-0">
                  <StoreLogo />
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 min-h-0">
                  <Chart />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
