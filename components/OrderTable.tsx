"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { SearchIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

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
    cell: ({ row }) => (
      <div className="capitalize truncate">{row.getValue("id")}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "student",
    header: "学生姓名",
    cell: ({ row }) => (
      <div className="font-sans lowercase truncate">
        {row.getValue("student")}
      </div>
    ),
    size: 100,
  },
  {
    accessorKey: "store",
    header: "所属商家",
    cell: ({ row }) => (
      <div className="lowercase truncate">{row.getValue("store")}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "amount",
    header: "订单金额",
    cell: ({ row }) => (
      <div className="lowercase">¥ {row.getValue("amount")}</div>
    ),
    size: 100,
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
        .replace(/\//g, "-");
      return <div className="text-sm">{formatted}</div>;
    },
    size: 180,
  },
  {
    id: "actions",
    header: () => <span className="text-muted-foreground">操作</span>,
    cell: ({ row }) => (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="rounded-full gap-1 whitespace-nowrap"
      >
        <Link href={`/order/${row.original.id}`}>
          查看详情
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    ),
    size: 120,
  },
];
export default function OrderTable() {
  const { 
    fetchOrders, 
    orders, 
    pageIndex, 
    pageSize, 
    globalFilter,
    setPageIndex,
    setPageSize,
    setGlobalFilter
  } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: orders,
    columns,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange",
    state: {
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex, pageSize });
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    // 在"订单号"或"学生姓名"任意字段匹配到输入内容即通过
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").toLowerCase();
      const id = String(row.original.id ?? "").toLowerCase();
      const student = String(row.original.student ?? "").toLowerCase();
      return id.includes(query) || student.includes(query);
    },
  });

  return (
    <Card className="w-15/16 p-6">
      <div>
        <div className="flex items-center py-4 space-x-4">
          <div className="relative w-full px-0.5 max-w-dvw">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="输入订单号或学生姓名"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table className="table-fixed p-4">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width: header.getSize() || "auto",
                          minWidth: header.getSize() || "auto",
                        }}
                      >
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
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cell.column.getSize() || "auto",
                          minWidth: cell.column.getSize() || "auto",
                        }}
                      >
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
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-sans">每页行数</p>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
            >
              {[5, 10, 20, 30, 40].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2 font-sans">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                首页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(pageIndex - 1)}
                disabled={!table.getCanPreviousPage()}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(pageIndex + 1)}
                disabled={!table.getCanNextPage()}
              >
                下一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                尾页
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
