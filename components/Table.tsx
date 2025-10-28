"use client";

import { useEffect } from "react";
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
import { useOrderStore } from "../stores/orderStore";

type Order = {
  id: string;
  student: string;
  store: string;
  amount: number;
  orderedAt: string | null;
};

const Table = () => {
  const { fetchOrders, orders, loading, error } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <Card className="w-full h-full p-7 text-sm font-sans flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full p-7 text-sm font-sans flex items-center justify-center">
        <div className="text-destructive">加载失败: {error}</div>
      </Card>
    );
  }

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
