"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { Utensils } from "lucide-react";
import DishesPic from "../components/DishesPic";
import { Pill, PillIndicator } from "@/components/ui/shadcn-io/pill";

interface ComponentProps {
  order: {
    id: string;
  };
}

export default function Component({ order }: ComponentProps) {
  return (
    <React.Fragment>
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-amber-100 w-12 h-12 flex items-center justify-center">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-sans font-bold">订单详情</h1>
        </div>
        <div>
          <Pill className="px-4 py-2 text-sm font-bold font-sans md:text-base gap-3">
            <span className="scale-125">
              <PillIndicator pulse variant="success" />
            </span>
            Success
          </Pill>
        </div>
      </header>
      <main className="p-6">
        <Card>
          {/* <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader> */}
          <CardContent className="gap-5 grid grid-cols-3 grid-rows-2">
            <div>
              <p className="font-bold font-sans text-zinc-400">订单号</p>
              <p className="font-sans ">{order.id}</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">学生ID</p>
              <p className="font-sans ">202411040508</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">下单时间</p>
              <p className="font-sans ">2025/8/24/14:30</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">档口号</p>
              <p className="font-sans ">1号档</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">总金额</p>
              <p className="font-sans ">100元</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">支付方式</p>
              <p className="font-sans ">微信支付</p>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <DishesPic />
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>菜品</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>菜品编号</TableHead>
                  <TableHead>档口号</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>积分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>1001</TableCell>
                  <TableCell>1号档</TableCell>
                  <TableCell>$100</TableCell>
                  <TableCell>100分</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>1002</TableCell>
                  <TableCell>2号档</TableCell>
                  <TableCell>$150</TableCell>
                  <TableCell>150分</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <footer className="p-6">
        {/* <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center">
              <div>Subtotal</div>
              <div className="ml-auto">$350.00</div>
            </div>
            <div className="flex items-center">
              <div>Taxes (10%)</div>
              <div className="ml-auto">$35.00</div>
            </div>
            <Separator />
            <div className="flex items-center font-medium">
              <div>Total</div>
              <div className="ml-auto">$385.00</div>
            </div>
          </CardContent>
        </Card> */}
      </footer>
    </React.Fragment>
  );
}
