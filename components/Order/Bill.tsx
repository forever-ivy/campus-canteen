"use client";

import * as React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pill, PillIndicator } from "@/components/ui/shadcn-io/pill";
import ModalButton from "../ModalButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaymethodIcon from "../PaymethodIcon";
import DishesPic from "./DishesPic";
import type {
  OrderDetailData,
  OrderDetailItem,
  OrderStatus,
} from "@/types/database";

interface BillProps {
  orderId: string;
}

type FetchState =
  | { status: "idle" | "loading" }
  | { status: "success"; detail: OrderDetailData }
  | { status: "error"; message: string };

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "--";
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

const formatCurrency = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : "0.00";

const summariseQuantity = (details: OrderDetailItem[]) =>
  details.reduce((acc, item) => acc + item.quantity, 0);

const statusIndicator = (status: OrderDetailData["status"]) =>
  status === "已完成" ? ("success" as const) : ("warning" as const);

const ORDER_STATUS_OPTIONS: OrderStatus[] = ["待支付", "已完成"];

const toDatetimeLocalInput = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDatetimeLocalInput = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const Bill: React.FC<BillProps> = ({ orderId }) => {
  const router = useRouter();
  const [state, setState] = React.useState<FetchState>({ status: "idle" });

  React.useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const controller = new AbortController();

    async function loadDetail() {
      setState({ status: "loading" });
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`获取订单详情失败：${response.status}`);
        }
        const payload = (await response.json()) as {
          order?: OrderDetailData;
          error?: string;
        };
        if (cancelled) return;
        if (!payload.order) {
          throw new Error(payload.error ?? "未获取到订单详情");
        }
        setState({ status: "success", detail: payload.order });
      } catch (err) {
        if (controller.signal.aborted || cancelled) {
          return;
        }
        const message =
          err instanceof Error ? err.message : `未知错误：${String(err)}`;
        setState({ status: "error", message });
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [orderId]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleOrderUpdated = React.useCallback((detail: OrderDetailData) => {
    setState({ status: "success", detail });
  }, []);

  const handleOrderDeleted = React.useCallback(() => {
    setState({ status: "idle" });
    router.back();
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBack}
            aria-label="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold font-sans">订单详情</h1>
            {state.status === "success" && (
              <p className="text-sm text-muted-foreground">
                {state.detail.merchantName}
                {state.detail.location ? ` · ${state.detail.location}` : ""}
              </p>
            )}
          </div>
        </div>
        {state.status === "success" && (
          <div className="flex items-center gap-3">
            <EditOrderModal
              order={state.detail}
              onUpdated={handleOrderUpdated}
            />
            <DeleteOrderModal
              orderId={state.detail.orderId}
              onDeleted={handleOrderDeleted}
            />
            <Pill className="px-4 py-2 text-sm font-semibold gap-3">
              <span className="scale-125">
                <PillIndicator
                  key={state.detail.status}
                  pulse
                  variant={statusIndicator(state.detail.status)}
                />
              </span>
              {state.detail.status}
            </Pill>
          </div>
        )}
      </header>

      <main className="space-y-6 px-6 pb-6">
        {state.status === "loading" && (
          <Card>
            <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              正在加载订单详情...
            </CardContent>
          </Card>
        )}

        {state.status === "error" && (
          <Card>
            <CardContent className="py-10 text-center text-destructive">
              {state.message}
            </CardContent>
          </Card>
        )}

        {state.status === "success" && (
          <>
            <Card>
              <CardContent className="grid gap-4 py-6 md:grid-cols-3 md:grid-rows-2">
                <DetailField label="订单号" value={state.detail.orderId} />
                <DetailField label="学生编号" value={state.detail.studentId} />
                <DetailField
                  label="学生姓名"
                  value={state.detail.studentName}
                />
                <DetailField
                  label="档口"
                  value={`${state.detail.merchantName}（${state.detail.merchantId}）`}
                />
                <DetailField
                  label="下单时间"
                  value={formatDateTime(state.detail.orderTime)}
                />
                <DetailField
                  label="总金额"
                  value={`¥ ${formatCurrency(state.detail.totalAmount)}`}
                />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">
                    支付方式
                  </p>
                  {state.detail.payment.length ? (
                    <ul className="mt-2 space-y-2 w-[140px]">
                      {state.detail.payment.map((payment) => (
                        <li
                          key={payment.payId}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <PaymethodIcon method={payment.payMethod} />
                            {payment.payMethod}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      暂无支付记录
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>菜品推荐</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                <DishesPic />
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>菜品明细</CardTitle>
                <p className="text-sm text-muted-foreground">
                  共 {summariseQuantity(state.detail.details)} 份，合计 ¥{" "}
                  {formatCurrency(state.detail.totalAmount)}
                </p>
              </CardHeader>
              <CardContent className="py-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>菜品名称</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead>小计</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.detail.details.length ? (
                      state.detail.details.map((item) => (
                        <TableRow key={item.dishId}>
                          <TableCell>{item.dishName ?? "--"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>¥ {formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            ¥ {formatCurrency(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          暂无菜品信息
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

interface EditOrderModalProps {
  order: OrderDetailData;
  onUpdated: (detail: OrderDetailData) => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  onUpdated,
}) => {
  const [status, setStatus] = React.useState<OrderStatus>(order.status);
  const [totalAmount, setTotalAmount] = React.useState(
    order.totalAmount.toFixed(2)
  );
  const [orderTime, setOrderTime] = React.useState(
    toDatetimeLocalInput(order.orderTime)
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setStatus(order.status);
    setTotalAmount(order.totalAmount.toFixed(2));
    setOrderTime(toDatetimeLocalInput(order.orderTime));
    setError(null);
  }, [order]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setError(null);
    }
  }, []);

  React.useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    resetForm();
  }, [isModalOpen, order, resetForm]);

  const handleConfirm = React.useCallback(async () => {
    setError(null);
    const amount = Number(totalAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("请输入有效的订单金额");
      return false;
    }
    const isoTime = orderTime ? fromDatetimeLocalInput(orderTime) : undefined;
    if (orderTime && !isoTime) {
      setError("请输入有效的下单时间");
      return false;
    }

    const response = await fetch(`/api/orders/${order.orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        totalAmount: amount,
        ...(isoTime !== undefined ? { orderTime: isoTime } : {}),
      }),
    });

    let payload: { order?: OrderDetailData; error?: string } | undefined;
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      payload = undefined;
    }

    if (!response.ok || !payload?.order) {
      setError(payload?.error ?? "更新订单失败");
      return false;
    }

    // 关键修改：用表单选择的 status 合并后端返回，确保 UI 立即正确显示
    const merged = { ...payload.order, status };
    onUpdated(merged);
    return true;
  }, [order.orderId, orderTime, onUpdated, status, totalAmount]);

  return (
    <ModalButton
      triggerText="修改订单"
      title={`修改订单 ${order.orderId}`}
      description="调整订单状态、金额或下单时间。"
      confirmText="保存"
      triggerProps={{ variant: "secondary" }}
      onConfirm={handleConfirm}
      onOpenChange={handleOpenChange}
    >
      <>
        <div className="space-y-2">
          <label className="text-sm font-medium">订单状态</label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as OrderStatus)}
          >
            <SelectTrigger className="w-full justify-between">
              <SelectValue placeholder="选择订单状态" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor="edit-order-total-amount"
          >
            总金额（元）
          </label>
          <Input
            id="edit-order-total-amount"
            type="number"
            min="0"
            step="0.01"
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            placeholder="请输入订单金额"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="edit-order-time">
            下单时间
          </label>
          <Input
            id="edit-order-time"
            type="datetime-local"
            value={orderTime}
            onChange={(event) => setOrderTime(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">为空则保持现有时间。</p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </>
    </ModalButton>
  );
};

interface DeleteOrderModalProps {
  orderId: string;
  onDeleted: () => void;
}

const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  orderId,
  onDeleted,
}) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = React.useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "DELETE",
    });

    let payload: { error?: string } | undefined;
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      payload = undefined;
    }

    if (!response.ok) {
      setError(payload?.error ?? "删除订单失败");
      return false;
    }

    onDeleted();
    return true;
  }, [onDeleted, orderId]);

  return (
    <ModalButton
      triggerText="删除订单"
      title="确认删除订单"
      description={`此操作将永久删除订单 ${orderId} 及其明细。`}
      confirmText="删除"
      triggerProps={{ variant: "destructive" }}
      confirmProps={{ variant: "destructive" }}
      onConfirm={handleConfirm}
      onOpenChange={(open) => {
        if (open) {
          setError(null);
        }
      }}
    >
      <>
        <p className="text-sm text-muted-foreground">
          删除后不可恢复，请确认是否继续。
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </>
    </ModalButton>
  );
};

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    <p className="mt-1 font-medium">{value ?? "--"}</p>
  </div>
);

export default Bill;
