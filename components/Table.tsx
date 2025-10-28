"use client";

import { useEffect, useState } from "react";
import type { ColumnDef } from "@/components/ui/shadcn-io/table";
import {
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from "@/components/ui/shadcn-io/table";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const Table = () => {
  type Order = {
    id: string;
    student: string;
    store: string;
    amount: number;
    orderedAt: string | null;
  };

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await axios.get("/api/orders");
        const normalized: Order[] = (response.data?.items ?? []).map(
          (item: Record<string, unknown>) => {
            const orderId =
              typeof item.orderId === "string" ? item.orderId : "";
            const studentName =
              typeof item.studentName === "string" ? item.studentName : null;
            const merchantName =
              typeof item.merchantName === "string" ? item.merchantName : null;
            const amountSource = item.totalAmount;
            const parsedAmount =
              typeof amountSource === "string"
                ? Number(amountSource.replace(/[^\d.-]/g, ""))
                : Number(amountSource ?? 0);
            const totalAmount = Number.isFinite(parsedAmount)
              ? parsedAmount
              : 0;

            const studentId =
              typeof item.studentId === "number" ||
              typeof item.studentId === "string"
                ? item.studentId
                : "--";
            const merchantId =
              typeof item.merchantId === "number" ||
              typeof item.merchantId === "string"
                ? item.merchantId
                : "--";

            return {
              id: orderId || String(studentId) || "",
              student: studentName ?? `学号 ${studentId}`,
              store: merchantName ?? `商户 ${merchantId}`,
              amount: Number.isFinite(totalAmount) ? totalAmount : 0,
              orderedAt:
                typeof item.orderTime === "string" ? item.orderTime : null,
            };
          }
        );

        setOrders(normalized);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    }
    fetchOrders();
  }, []);

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="订单号" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "student",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="下单学生" />
      ),
      cell: ({ row }) => row.original.student,
    },

    {
      accessorKey: "store",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="所属商家" />
      ),
      cell: ({ row }) => row.original.store,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="订单金额" />
      ),
      cell: ({ row }) => {
        const amount = Number(row.original.amount ?? 0);
        return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : "¥--";
      },
    },
    {
      accessorKey: "orderedAt",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="下单时间" />
      ),
      cell: ({ row }) => {
        const orderedAt = row.original.orderedAt;
        if (!orderedAt) return "--";
        const date = new Date(orderedAt);
        if (Number.isNaN(date.getTime())) return "--";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${d} ${hh}:${mm}`;
      },
    },
    {
      id: "actions",
      header: () => <span className="text-muted-foreground">操作</span>,
      cell: ({ row }) => (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full gap-1"
        >
          <Link href={`/order/${row.original.id}`}>
            查看详情
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <Card className="w-full h-full p-7  text-sm font-sans">
      <TableProvider columns={columns} data={orders}>
        <TableHeader>
          {({ headerGroup }) => (
            <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id}>
              {({ header }) => <TableHead header={header} key={header.id} />}
            </TableHeaderGroup>
          )}
        </TableHeader>
        <TableBody>
          {({ row }) => (
            <TableRow key={row.id} row={row}>
              {({ cell }) => <TableCell cell={cell} key={cell.id} />}
            </TableRow>
          )}
        </TableBody>
      </TableProvider>
    </Card>
  );
};
export default Table;
