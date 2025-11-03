"use client";

/** 订单表格，支持从后端 API 拉取数据并根据地点筛选 */

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocationStore } from "@/store/useLocationStore";
import type { OrderTableRow } from "@/types/database";

const formatDate = (value: string | null) => {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai",
    })
      .format(new Date(value))
      .replace(/\//g, "-");
  } catch {
    return value;
  }
};

export default function DataTablePagination() {
  const [orders, setOrders] = useState<OrderTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLocation = useLocationStore((state) => state.currentLocation);
  const fetchLocations = useLocationStore((state) => state.fetchLocations);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (currentLocation) {
          params.set("location", currentLocation);
        }
        const query = params.size ? `?${params.toString()}` : "";
        const response = await fetch(`/api/orders${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`获取订单失败: ${response.status}`);
        }
        const payload = (await response.json()) as {
          orders?: OrderTableRow[];
        };
        if (cancelled) return;
        const normalized = (payload.orders ?? []).map((order) => ({
          ...order,
          location: order.location ?? null,
          orderedAt: order.orderedAt ?? null,
          amount: Number(order.amount),
        }));
        setOrders(normalized);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : `未知错误: ${String(err)}`;
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentLocation]);

  const columns = useMemo<ColumnDef<OrderTableRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: "订单号",
        cell: ({ row }) => (
          <div className="truncate font-mono uppercase">
            {row.getValue("id")}
          </div>
        ),
        size: 140,
      },
      {
        accessorKey: "student",
        header: "学生姓名",
        cell: ({ row }) => (
          <div className="truncate font-sans">{row.getValue("student")}</div>
        ),
        size: 120,
      },
      {
        accessorKey: "store",
        header: "所属商家",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("store")}</div>
        ),
        size: 160,
      },
      {
        accessorKey: "amount",
        header: "订单金额",
        cell: ({ row }) => {
          const amount = Number(row.getValue("amount"));
          return <div className="font-semibold">¥ {amount.toFixed(2)}</div>;
        },
        size: 120,
      },
      {
        accessorKey: "orderedAt",
        header: "下单时间",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.getValue("orderedAt") as string | null)}
          </div>
        ),
        size: 200,
      },
      {
        id: "actions",
        header: () => <span className="text-muted-foreground">操作</span>,
        cell: ({ row }) => (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1 rounded-full whitespace-nowrap"
          >
            <Link href={`/order/${row.original.id}`}>
              查看详情
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        ),
        size: 120,
      },
    ],
    []
  );


  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = searchParams.get("page") ?? "1";
  const pageSize = searchParams.get("pageSize") ?? "5";

  const pagination = useMemo(() => ({
    pageIndex: Number(page) - 1,
    pageSize: Number(pageSize),
  }), [page, pageSize]);

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      return newSearchParams.toString();
    },
    [searchParams]
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
    },
    onPaginationChange: (updater) => {
      if (typeof updater !== "function") return;
      const newPagination = updater(pagination);
      router.push(
        `${pathname}?${createQueryString({
          page: newPagination.pageIndex + 1,
          pageSize: newPagination.pageSize,
        })}`
      );
    },
    manualPagination: false,
    autoResetPageIndex: false,
  });

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get('page') ?? 1);
    const pageIndexFromUrl = pageFromUrl - 1;

    if (table.getState().pagination.pageIndex !== pageIndexFromUrl) {
      table.setPageIndex(pageIndexFromUrl);
    }
  }, [orders, searchParams, table]);

  return (
    <div className="w-full space-y-6">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  正在加载数据...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
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
                  暂无数据。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">每页行数</p>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(event) => {
              table.setPageSize(Number(event.target.value));
            }}
            className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
          >
            {[5, 10, 20, 30, 40].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[120px] items-center justify-center text-sm font-medium">
            第 {table.getState().pagination.pageIndex + 1} 页 / 共{" "}
            {table.getPageCount()} 页
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              首页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              下一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              尾页
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
