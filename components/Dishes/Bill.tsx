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
import React, { useState, useEffect } from "react";
import { Utensils } from "lucide-react";
import DishesPic from "./DishesPic";
import { Pill, PillIndicator } from "@/components/ui/shadcn-io/pill";
import axios from "axios";
import type { OrderDetailResponse, OrderListItem } from "../../types/orders";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import PaymethodIcom from "../PaymethodIcon";
import PaymethodIcon from "../PaymethodIcon";

interface ComponentProps {
  order: {
    id: string;
  };
}

export default function Component({ order }: ComponentProps) {
  // 只存储订单对象，方便直接访问属性
  const [detailOrder, setDetailOrder] = useState<OrderListItem>();

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        // 指定响应类型，并取 order 对象
        const response = await axios.get<OrderDetailResponse>(
          `/api/orders/${order.id}`
        );
        setDetailOrder(response.data.order);
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    }
    fetchOrderDetails();
  }, [order.id]);

  const router = useRouter();
  return (
    <React.Fragment>
      <header className="flex items-center justify-between w-full p-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
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
            {detailOrder?.status}
          </Pill>
        </div>
      </header>
      <main className="p-6">
        <Card>
          <CardContent className="gap-5 grid grid-cols-3 grid-rows-2">
            <div>
              <p className="font-bold font-sans text-zinc-400">订单号</p>
              <p className="font-sans ">{detailOrder?.orderId}</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">学生编号</p>
              <p className="font-sans ">{detailOrder?.studentId}</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">下单时间</p>
              <p className="font-sans ">{detailOrder?.orderTime}</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">档口号</p>
              <p className="font-sans ">{detailOrder?.merchantId}</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">总金额</p>
              <p className="font-sans ">{detailOrder?.totalAmount}</p>
            </div>
            <div>
              <p className="font-bold font-sans text-zinc-400">支付方式</p>
              <div className="flex">
                <p className="font-sans ">
                  {detailOrder?.payment?.[0]?.payMethod ?? "--"}
                </p>
                <PaymethodIcon
                  method={detailOrder?.payment?.[0]?.payMethod ?? "--"}
                />
              </div>
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
                  <TableHead>菜品名称</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>积分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailOrder?.details && detailOrder.details.length ? (
                  detailOrder.details.map((detail) => (
                    <TableRow key={detail.dishId}>
                      <TableCell>{detail.dishName ?? "--"}</TableCell>
                      <TableCell>{detail.quantity}</TableCell>
                      <TableCell>{detail.price}</TableCell>
                      <TableCell>{detail.subtotal}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      暂无菜品信息
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <footer className="p-6"></footer>
    </React.Fragment>
  );
}
