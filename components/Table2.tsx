"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrderStore } from "../stores/orderStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";

type Order = {
  id: string;
  student: string;
  store: string;
  amount: number;
  orderedAt: string | null;
};

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "订单号",
    cell: ({ row }) => <div className="capitalize">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "student",
    header: "学生姓名",
    cell: ({ row }) => (
      <div className="font-sans lowercase">{row.getValue("student")}</div>
    ),
  },
  {
    accessorKey: "store",
    header: "所属商家",
    cell: ({ row }) => <div className="lowercase">{row.getValue("store")}</div>,
  },
  {
    accessorKey: "amount",
    header: "订单金额",
    cell: ({ row }) => (
      <div className="lowercase">¥ {row.getValue("amount")}</div>
    ),
  },
  {
    accessorKey: "orderedAt",
    header: "下单时间",
    cell: ({ row }) => {
      const iso = row.getValue("orderedAt") as string | null;
      if (!iso) return <div>-</div>;
      const date = new Date(iso);
      const formatted = new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Shanghai",
      })
        .format(date)
        .replace(/\//g, "-"); // 把默认的 2024/12/02 改为 2024-12-02
      return <div>{formatted}</div>;
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
export default function Table2() {
  const { fetchOrders, orders } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const table = useReactTable({
    data: orders,
    columns,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
      globalFilter,
    },
    // 在“订单号”或“学生姓名”任意字段匹配到输入内容即通过
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").toLowerCase();
      const id = String(row.original.id ?? "").toLowerCase();
      const student = String(row.original.student ?? "").toLowerCase();
      return id.includes(query) || student.includes(query);
    },
  });

  return (
    <div className="w-full p-6">
      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="输入订单号或学生姓名"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} of {data.length} row(s)
          showing.
        </div>
      </div> */}
    </div>
  );
}
