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

  // const orders: Order[] = [
  //   {
  //     id: "12345",
  //     student: "张三",
  //     store: "第一食堂",
  //     amount: 25.5,
  //     orderedAt: new Date("2023-10-27T12:30:00"),
  //   },
  //   {
  //     id: "12346",
  //     student: "李四",
  //     store: "第二食堂",
  //     amount: 18.0,
  //     orderedAt: new Date("2023-10-27T12:32:00"),
  //   },
  //   {
  //     id: "12347",
  //     student: "王五",
  //     store: "第二食堂",
  //     amount: 32.1,
  //     orderedAt: new Date("2023-10-27T12:35:00"),
  //   },
  //   {
  //     id: "12348",
  //     student: "赵六",
  //     store: "第一食堂",
  //     amount: 15.8,
  //     orderedAt: new Date("2023-10-27T12:38:00"),
  //   },
  //   {
  //     id: "12349",
  //     student: "孙七",
  //     store: "第二食堂",
  //     amount: 21.4,
  //     orderedAt: new Date("2023-10-27T12:40:00"),
  //   },
  //   {
  //     id: "12350",
  //     student: "周八",
  //     store: "第一食堂",
  //     amount: 28.9,
  //     orderedAt: new Date("2023-10-27T12:42:00"),
  //   },
  //   {
  //     id: "12351",
  //     student: "吴九",
  //     store: "第二食堂",
  //     amount: 12.5,
  //     orderedAt: new Date("2023-10-27T12:45:00"),
  //   },
  //   {
  //     id: "12352",
  //     student: "郑十",
  //     store: "第一食堂",
  //     amount: 24.0,
  //     orderedAt: new Date("2023-10-27T12:48:00"),
  //   },
  //   {
  //     id: "12353",
  //     student: "王十一",
  //     store: "第二食堂",
  //     amount: 19.6,
  //     orderedAt: new Date("2023-10-27T12:50:00"),
  //   },
  //   {
  //     id: "12354",
  //     student: "李十二",
  //     store: "第一食堂",
  //     amount: 26.3,
  //     orderedAt: new Date("2023-10-27T12:52:00"),
  //   },
  //   {
  //     id: "12355",
  //     student: "周十三",
  //     store: "第三食堂",
  //     amount: 22.8,
  //     orderedAt: new Date("2023-10-27T12:54:00"),
  //   },
  //   {
  //     id: "12356",
  //     student: "钱十四",
  //     store: "第二食堂",
  //     amount: 17.2,
  //     orderedAt: new Date("2023-10-27T12:56:00"),
  //   },
  //   {
  //     id: "12357",
  //     student: "吴十五",
  //     store: "第一食堂",
  //     amount: 29.5,
  //     orderedAt: new Date("2023-10-27T12:58:00"),
  //   },
  //   {
  //     id: "12358",
  //     student: "郑十六",
  //     store: "第二食堂",
  //     amount: 30.7,
  //     orderedAt: new Date("2023-10-27T13:00:00"),
  //   },
  //   {
  //     id: "12359",
  //     student: "王十七",
  //     store: "第三食堂",
  //     amount: 16.9,
  //     orderedAt: new Date("2023-10-27T13:02:00"),
  //   },
  //   {
  //     id: "12360",
  //     student: "李十八",
  //     store: "第一食堂",
  //     amount: 27.4,
  //     orderedAt: new Date("2023-10-27T13:04:00"),
  //   },
  //   {
  //     id: "12361",
  //     student: "张十九",
  //     store: "第二食堂",
  //     amount: 20.0,
  //     orderedAt: new Date("2023-10-27T13:06:00"),
  //   },
  //   {
  //     id: "12362",
  //     student: "陈二十",
  //     store: "第三食堂",
  //     amount: 23.3,
  //     orderedAt: new Date("2023-10-27T13:08:00"),
  //   },
  //   {
  //     id: "12363",
  //     student: "刘二一",
  //     store: "第一食堂",
  //     amount: 14.8,
  //     orderedAt: new Date("2023-10-27T13:10:00"),
  //   },
  //   {
  //     id: "12364",
  //     student: "杨二二",
  //     store: "第二食堂",
  //     amount: 33.2,
  //     orderedAt: new Date("2023-10-27T13:12:00"),
  //   },
  //   {
  //     id: "12365",
  //     student: "何二三",
  //     store: "第三食堂",
  //     amount: 19.1,
  //     orderedAt: new Date("2023-10-27T13:14:00"),
  //   },
  //   {
  //     id: "12366",
  //     student: "黄二四",
  //     store: "第一食堂",
  //     amount: 26.7,
  //     orderedAt: new Date("2023-10-27T13:16:00"),
  //   },
  //   {
  //     id: "12367",
  //     student: "高二五",
  //     store: "第二食堂",
  //     amount: 18.6,
  //     orderedAt: new Date("2023-10-27T13:18:00"),
  //   },
  //   {
  //     id: "12368",
  //     student: "郭二六",
  //     store: "第三食堂",
  //     amount: 31.4,
  //     orderedAt: new Date("2023-10-27T13:20:00"),
  //   },
  //   {
  //     id: "12369",
  //     student: "孔二七",
  //     store: "第一食堂",
  //     amount: 22.1,
  //     orderedAt: new Date("2023-10-27T13:22:00"),
  //   },
  //   {
  //     id: "12370",
  //     student: "曹二八",
  //     store: "第二食堂",
  //     amount: 24.9,
  //     orderedAt: new Date("2023-10-27T13:24:00"),
  //   },
  //   {
  //     id: "12371",
  //     student: "严二九",
  //     store: "第三食堂",
  //     amount: 27.6,
  //     orderedAt: new Date("2023-10-27T13:26:00"),
  //   },
  //   {
  //     id: "12372",
  //     student: "华三十",
  //     store: "第一食堂",
  //     amount: 16.5,
  //     orderedAt: new Date("2023-10-27T13:28:00"),
  //   },
  //   {
  //     id: "12373",
  //     student: "魏三一",
  //     store: "第二食堂",
  //     amount: 28.3,
  //     orderedAt: new Date("2023-10-27T13:30:00"),
  //   },
  //   {
  //     id: "12374",
  //     student: "陶三二",
  //     store: "第三食堂",
  //     amount: 20.7,
  //     orderedAt: new Date("2023-10-27T13:32:00"),
  //   },
  // ];

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
            const totalAmount = Number(item.totalAmount ?? 0);

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
    <Card className="w-full h-full p-7 text-sm font-sans">
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
