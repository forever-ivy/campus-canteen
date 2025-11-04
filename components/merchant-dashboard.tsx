"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import { ArrowLeft, Store, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Merchant {
  merchantId: string;
  name: string;
  location: string | null;
  manager: string | null;
  phone: string | null;
}

interface Dish {
  dishName: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  studentId: string;
  orderTime: string | null;
  totalAmount: number;
  status: "待支付" | "已完成";
  dishes: Dish[];
}

interface StockItem {
  stockId: string;
  dishId: string;
  dishName: string;
  inQuantity: number;
  outQuantity: number;
  remainingQuantity: number;
  updateTime: string | null;
}

export default function MerchantDashboard({ merchantId }: { merchantId: string }) {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取商家信息
        const merchantRes = await fetch(`/api/merchant/${merchantId}`);
        if (merchantRes.ok) {
          const merchantData = await merchantRes.json();
          setMerchant(merchantData.merchant);
        } else {
          toast.error("获取商家信息失败");
        }

        // 获取订单列表
        const statusParam = activeTab === "all" ? "" : `?status=${activeTab === "unpaid" ? "待支付" : "已完成"}`;
        const ordersRes = await fetch(`/api/merchant/${merchantId}/orders${statusParam}`);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders);
        } else {
          toast.error("获取订单列表失败");
        }

        // 获取库存信息
        const stockRes = await fetch(`/api/merchant/${merchantId}/stock`);
        if (stockRes.ok) {
          const stockData = await stockRes.json();
          setStockItems(stockData.stockItems);
        } else {
          toast.error("获取库存信息失败");
        }
      } catch (err) {
        console.error("加载数据失败:", err);
        toast.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchantId, activeTab, refreshKey]);

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "无";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/merchant")}>
            <ArrowLeft className="h-4 w-4" />
            返回登录
          </Button>
          <h1 className="text-2xl font-bold">商家管理系统</h1>
        </div>
      </div>

      {/* 商家信息卡片 */}
      {merchant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              档口信息
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">档口编号</p>
              <p className="text-lg font-semibold">{merchant.merchantId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">档口名称</p>
              <p className="text-lg font-semibold">{merchant.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">所在位置</p>
              <p className="text-lg font-semibold">{merchant.location || "无"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">负责人</p>
              <p className="text-lg font-semibold">{merchant.manager || "无"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 订单和库存标签页 */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            订单管理
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            库存管理
          </TabsTrigger>
        </TabsList>

        {/* 订单管理 */}
        <TabsContent value="orders" className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">全部订单</TabsTrigger>
              <TabsTrigger value="unpaid">待支付</TabsTrigger>
              <TabsTrigger value="paid">已完成</TabsTrigger>
            </TabsList>
          </Tabs>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无订单
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.orderId}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            订单号: {order.orderId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            学号: {order.studentId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            下单时间: {formatDateTime(order.orderTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm ${
                              order.status === "待支付"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {order.dishes && order.dishes.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">订单详情</p>
                          <div className="space-y-1">
                            {order.dishes.map((dish, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {dish.dishName} × {dish.quantity}
                                </span>
                                <span>¥{(dish.price * dish.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="font-semibold">总金额</span>
                        <span className="text-xl font-bold text-primary">
                          ¥{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 库存管理 */}
        <TabsContent value="stock" className="space-y-4">
          {stockItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无库存信息
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {stockItems.map((item) => (
                <Card key={item.stockId}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{item.dishName}</p>
                          <p className="text-sm text-muted-foreground">
                            菜品编号: {item.dishId}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          更新时间: {formatDateTime(item.updateTime)}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">入库量</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {item.inQuantity}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">出库量</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {item.outQuantity}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">剩余量</p>
                          <p className={`text-lg font-semibold ${
                            item.remainingQuantity < 20 ? "text-red-600" : "text-green-600"
                          }`}>
                            {item.remainingQuantity}
                          </p>
                        </div>
                      </div>

                      {item.remainingQuantity < 20 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <span>⚠️</span>
                            库存不足，建议及时补货
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
