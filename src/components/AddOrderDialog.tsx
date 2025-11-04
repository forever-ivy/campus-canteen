"use client";

import * as React from "react";
import { PlusIcon, Loader2, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OrderDetail {
  dishId: string;
  quantity: number;
}

const AddOrderDialog: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [studentId, setStudentId] = React.useState("");
  const [merchantId, setMerchantId] = React.useState("");
  const [totalAmount, setTotalAmount] = React.useState("");
  const [status, setStatus] = React.useState<"待支付" | "已完成">("待支付");
  const [orderTime, setOrderTime] = React.useState("");
  const [details, setDetails] = React.useState<OrderDetail[]>([
    { dishId: "", quantity: 1 },
  ]);

  const resetForm = React.useCallback(() => {
    setStudentId("");
    setMerchantId("");
    setTotalAmount("");
    setStatus("待支付");
    setOrderTime("");
    setDetails([{ dishId: "", quantity: 1 }]);
    setError(null);
  }, []);

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    },
    [resetForm]
  );

  const addDetail = () => {
    setDetails([...details, { dishId: "", quantity: 1 }]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const updateDetail = (index: number, field: keyof OrderDetail, value: string | number) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const amount = Number(totalAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        setError("请输入有效的订单金额");
        return;
      }

      // 验证订单明细
      for (const detail of details) {
        if (!detail.dishId.trim()) {
          setError("请填写所有菜品ID");
          return;
        }
        if (detail.quantity <= 0) {
          setError("菜品数量必须大于0");
          return;
        }
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: studentId.trim(),
          merchantId: merchantId.trim(),
          totalAmount: amount,
          status,
          orderTime: orderTime || undefined,
          details: details.map((d) => ({
            dishId: d.dishId.trim(),
            quantity: d.quantity,
          })),
        }),
      });

      let result: { orderId?: string; error?: string; success?: boolean } | undefined;
      try {
        result = await response.json();
      } catch {
        result = undefined;
      }

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "创建订单失败");
        return;
      }

      // 成功后关闭对话框并刷新页面
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : `未知错误：${String(err)}`;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="添加订单"
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新订单</DialogTitle>
          <DialogDescription>填写订单信息以创建新订单</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="studentId">
                学生ID <span className="text-destructive">*</span>
              </label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="例如: 202411040101"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="merchantId">
                档口ID <span className="text-destructive">*</span>
              </label>
              <Input
                id="merchantId"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="例如: 01101"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="totalAmount">
                总金额（元）<span className="text-destructive">*</span>
              </label>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">订单状态</label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "待支付" | "已完成")}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="待支付">待支付</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="orderTime">
              下单时间（可选）
            </label>
            <Input
              id="orderTime"
              type="datetime-local"
              value={orderTime}
              onChange={(e) => setOrderTime(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">留空则使用当前时间</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                订单明细 <span className="text-destructive">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDetail}
                disabled={isSubmitting}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                添加菜品
              </Button>
            </div>
            {details.map((detail, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">菜品ID</label>
                  <Input
                    value={detail.dishId}
                    onChange={(e) => updateDetail(index, "dishId", e.target.value)}
                    placeholder="例如: 01101001"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs text-muted-foreground">数量</label>
                  <Input
                    type="number"
                    min="1"
                    value={detail.quantity}
                    onChange={(e) => updateDetail(index, "quantity", parseInt(e.target.value) || 1)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDetail(index)}
                  disabled={details.length === 1 || isSubmitting}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                "创建订单"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
