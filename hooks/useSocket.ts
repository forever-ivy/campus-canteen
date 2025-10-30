/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";

interface SocketData {
  type: "new_order" | "new_points" | "order_updated";
  payload: any;
  timestamp: string;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SocketData | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [newPointsCount, setNewPointsCount] = useState(0);
  // 在浏览器环境中，setTimeout 返回 number；在 Node 中返回 NodeJS.Timeout
  // 使用 ReturnType<typeof setTimeout> 提升跨环境兼容性，并提供初始值 null
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    // 仅在客户端运行
    if (typeof window === "undefined") return;
    // 先触发服务端初始化（pages/api/socket.ts），完成后再连接
    void (async () => {
      try {
        await axios.get("/api/socket");
      } catch {
        // 初始化接口失败时忽略，Socket.IO 会继续尝试连接
      }

      const socketInstance = io(window.location.origin, {
        path: "/api/socket",
        transports: ["websocket", "polling"], // 确保支持多种传输方式
        forceNew: true, // 强制新连接
        reconnection: true, // 启用自动重连
        reconnectionAttempts: 5, // 最大重连次数
        reconnectionDelay: 1000, // 重连延迟
      });

      socketInstance.on("connect", () => {
        console.log("Socket 连接成功");
        setConnected(true);

        // 加入房间
        socketInstance.emit("join-orders");
        socketInstance.emit("join-points");
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket 连接断开");
        setConnected(false);

        // Socket.io 会自动重连，不需要手动处理
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket 连接错误:", error);
        setConnected(false);
      });

      // 监听新订单
      socketInstance.on("new-order", (data) => {
        console.log("收到新订单通知:", data);
        setLastMessage({
          type: "new_order",
          payload: data,
          timestamp: new Date().toISOString(),
        });
        setNewOrderCount((prev) => prev + 1);
      });

      // 监听新积分记录
      socketInstance.on("new-points", (data) => {
        console.log("收到新积分记录通知:", data);
        setLastMessage({
          type: "new_points",
          payload: data,
          timestamp: new Date().toISOString(),
        });
        setNewPointsCount((prev) => prev + 1);
      });

      // 监听订单更新
      socketInstance.on("order-updated", (data) => {
        console.log("收到订单更新通知:", data);
        setLastMessage({
          type: "order_updated",
          payload: data,
          timestamp: new Date().toISOString(),
        });
      });

      setSocket(socketInstance);

      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    })();
  }, []);

  // 手动发送消息
  const sendMessage = (type: string, data: any) => {
    if (socket && connected) {
      socket.emit("database-changed", { type, payload: data });
    }
  };

  // 重置计数器
  const resetNewOrderCount = () => setNewOrderCount(0);
  const resetNewPointsCount = () => setNewPointsCount(0);

  return {
    socket,
    connected,
    lastMessage,
    newOrderCount,
    newPointsCount,
    sendMessage,
    resetNewOrderCount,
    resetNewPointsCount,
  };
}
