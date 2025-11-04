"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContents,
} from "@/components/ui/shadcn-io/tabs";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Student {
  studentId: string;
  name: string;
  sex: string;
  major: string;
  balance: number;
  points: number;
}

interface Dish {
  dishName: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  orderTime: string | null;
  totalAmount: number;
  status: "待支付" | "已完成";
  merchantName: string;
  location: string | null;
  dishes: Dish[];
}

export default function Category({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // 初始加载
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/student/${studentId}`);
        if (!res.ok) {
          throw new Error("获取学生信息失败");
        }
        const data = await res.json();
        setStudent(data.student);
      } catch (err) {
        console.error("获取学生信息错误:", err);
        setError("无法加载学生信息");
      }
    };

    const fetchOrders = async () => {
      try {
        // 获取全部订单
        const allRes = await fetch(`/api/student/${studentId}/orders`);
        if (!allRes.ok) throw new Error("获取订单失败");
        const allData = await allRes.json();
        setAllOrders(allData.orders);

        // 获取待支付订单
        const unpaidRes = await fetch(`/api/student/${studentId}/orders?status=待支付`);
        if (!unpaidRes.ok) throw new Error("获取待支付订单失败");
        const unpaidData = await unpaidRes.json();
        setUnpaidOrders(unpaidData.orders);

        // 获取已支付订单
        const paidRes = await fetch(`/api/student/${studentId}/orders?status=已完成`);
        if (!paidRes.ok) throw new Error("获取已支付订单失败");
        const paidData = await paidRes.json();
        setPaidOrders(paidData.orders);
      } catch (err) {
        console.error("获取订单错误:", err);
        setError("无法加载订单信息");
      }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStudent(), fetchOrders()]);
      setLoading(false);
    };
    loadData();
  }, [studentId, refreshKey]);

  // 支付订单
  const handlePay = async (orderId: string) => {
    setPaying(orderId);
    try {
      const res = await fetch("/api/student/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          studentId,
          payMethod: "校园卡",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "支付失败");
        setPaying(null);
        return;
      }

      toast.success("支付成功！", {
        description: `新余额: ¥${data.newBalance?.toFixed(2) || "0.00"}`,
      });
      // 重新加载数据
      setRefreshKey((prev) => prev + 1);
      setPaying(null);
    } catch (err) {
      console.error("支付错误:", err);
      toast.error("网络错误，请稍后重试");
      setPaying(null);
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 订单卡片组件
  const OrderCard = ({ order }: { order: Order }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{order.merchantName}</CardTitle>
            <CardDescription className="text-xs">
              {order.location || "位置未知"} • {formatDate(order.orderTime)}
            </CardDescription>
          </div>
          <div className={`text-sm font-semibold ${
            order.status === "待支付" ? "text-orange-600" : "text-green-600"
          }`}>
            {order.status}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">订单号</p>
          <p className="text-sm font-mono">{order.orderId}</p>
        </div>

        {/* 菜品列表 */}
        {order.dishes && order.dishes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">订单详情</p>
            <div className="space-y-1">
              {order.dishes.map((dish, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dish.dishName} × {dish.quantity}
                  </span>
                  <span className="font-medium">
                    ¥{(dish.price * dish.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-semibold">总计</span>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              ¥{order.totalAmount.toFixed(2)}
            </p>
            {order.status === "待支付" && (
              <Button
                size="sm"
                onClick={() => handlePay(order.orderId)}
                disabled={paying === order.orderId}
                className="mt-2"
              >
                {paying === order.orderId ? "支付中..." : "立即支付"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 返回按钮 */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/student")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登录
        </Button>
      </div>

      {/* 学生信息卡片 */}
      {student && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
            <CardDescription>学号：{student.studentId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">姓名</p>
                <p className="text-sm font-semibold">{student.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">专业</p>
                <p className="text-sm font-semibold">{student.major}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">账户余额</p>
                <p className="text-lg font-bold text-green-600">
                  ¥{student.balance.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">消费积分</p>
                <p className="text-lg font-bold text-blue-600">
                  {student.points}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 订单列表 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            全部订单 ({allOrders.length})
          </TabsTrigger>
          <TabsTrigger value="unpaid">
            待支付 ({unpaidOrders.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            已支付 ({paidOrders.length})
          </TabsTrigger>
        </TabsList>
        <TabsContents>
          <TabsContent value="all" className="space-y-4 mt-4">
            {allOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                暂无订单
              </p>
            ) : (
              allOrders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))
            )}
          </TabsContent>
          <TabsContent value="unpaid" className="space-y-4 mt-4">
            {unpaidOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                暂无待支付订单
              </p>
            ) : (
              unpaidOrders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))
            )}
          </TabsContent>
          <TabsContent value="paid" className="space-y-4 mt-4">
            {paidOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                暂无已支付订单
              </p>
            ) : (
              paidOrders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))
            )}
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
