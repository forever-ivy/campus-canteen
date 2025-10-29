"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/shadcn-io/icon-button";
import { Bell, BellRing, RefreshCw } from "lucide-react";
import useInfoStore from "../stores/infoStore";
import { useOrderStore } from "../stores/orderStore";
import { useSocket } from "../hooks/useSocket";

export default function RightDrawer() {
  const { bellState, setBellState } = useInfoStore();
  const { newOrdersCount, resetNewOrderCount, refetchOrders } = useOrderStore();
  const { connected, lastMessage } = useSocket();

  // 监听 Socket 消息，当收到新订单时自动刷新数据
  useEffect(() => {
    if (lastMessage?.type === "new_order") {
      console.log("检测到新订单，刷新数据...");
      refetchOrders();
    }
  }, [lastMessage, refetchOrders]);

  const handleDrawerOpen = () => {
    setBellState(true);
    resetNewOrderCount(); // 打开抽屉时重置新订单计数
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Right drawer */}
      <Drawer direction="right" open={bellState} onOpenChange={setBellState}>
        <DrawerTrigger asChild>
          <div className="relative">
            <IconButton
              icon={Bell}
              color={[239, 68, 68]}
              size="lg"
              onClick={handleDrawerOpen}
            />
            {newOrdersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {newOrdersCount}
              </span>
            )}
            {connected && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <div className="h-full w-full">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                实时订单通知
                {connected && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    已连接
                  </span>
                )}
              </DrawerTitle>
              <DrawerDescription>
                {lastMessage
                  ? `最新更新: ${new Date(lastMessage.timestamp).toLocaleTimeString()}`
                  : "实时监控新订单和积分记录"
                }
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 space-y-4">
              {/* 连接状态 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">WebSocket 连接状态</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  connected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {connected ? "已连接" : "未连接"}
                </span>
              </div>

              {/* 新订单计数 */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">新订单数量</span>
                <span className="text-sm font-bold text-blue-600">
                  {newOrdersCount} 个
                </span>
              </div>

              {/* 最新消息 */}
              {lastMessage && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">最新通知</p>
                  <p className="text-xs text-muted-foreground">
                    类型: {lastMessage.type === "new_order" ? "新订单" : "其他"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    时间: {new Date(lastMessage.timestamp).toLocaleString()}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchOrders()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  刷新数据
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetNewOrderCount()}
                >
                  重置计数
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                💡 提示：当数据库有新订单或积分记录时，这里会实时显示通知。
              </p>
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button>关闭</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
