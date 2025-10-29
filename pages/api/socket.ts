/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import prisma from "../../lib/prisma";

declare global {
  // 防止开发模式下重复创建轮询器
  // eslint-disable-next-line no-var
  var __orderPoller__: NodeJS.Timer | undefined;
  // eslint-disable-next-line no-var
  var __lastOrderId__: bigint | undefined;
  // eslint-disable-next-line no-var
  var __pointsPoller__: NodeJS.Timer | undefined;
  // eslint-disable-next-line no-var
  var __lastPointRecordId__: bigint | undefined;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (
  req: NextApiRequest,
  res: NextApiResponse & { socket: any }
) => {
  console.log("[pages/api/socket] handler invoked");
  if (res.socket.server.io) {
    console.log("Socket.io 已初始化");
    res.end();
    return;
  }

  console.log("正在初始化 Socket.io...");
  const httpServer = res.socket.server;
  const io = new Server(httpServer, {
    path: "/api/socket",
    transports: ["websocket", "polling"],
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false,
    },
  });

  io.on("connection", (socket) => {
    console.log(`用户连接: ${socket.id}`);

    socket.on("join-orders", () => {
      socket.join("orders");
      console.log(`用户 ${socket.id} 加入订单房间`);
    });

    socket.on("join-points", () => {
      socket.join("points");
      console.log(`用户 ${socket.id} 加入积分记录房间`);
    });

    socket.on("database-changed", (data: any) => {
      console.log("数据库发生变化:", data);
      if (data.type === "new_order") {
        io.to("orders").emit("new-order", data.payload);
      } else if (data.type === "new_points") {
        io.to("points").emit("new-points", data.payload);
      } else if (data.type === "order_updated") {
        io.to("orders").emit("order-updated", data.payload);
      }
    });

    socket.on("disconnect", () => {
      console.log(`用户断开连接: ${socket.id}`);
    });
  });

  res.socket.server.io = io;
  res.end();

  // 启动数据库轮询，检测新订单与积分记录并广播
  if (!global.__orderPoller__) {
    console.log("启动订单轮询广播...");
    global.__orderPoller__ = setInterval(async () => {
      try {
        const latest = await prisma.order.findMany({
          orderBy: { OrderTime: "desc" },
          take: 1,
          include: { Student: true, Merchant: true },
        });
        const newest = latest[0];
        if (!newest) return;

        if (!global.__lastOrderId__) {
          global.__lastOrderId__ = newest.OrderID;
          return;
        }

        // 发现新订单（OrderID 变更）
        if (newest.OrderID > global.__lastOrderId__!) {
          global.__lastOrderId__ = newest.OrderID;
          const payload = {
            orderId: newest.OrderID.toString(),
            studentId: newest.StudentID,
            studentName: newest.Student?.Name ?? null,
            merchantId: newest.MerchantID,
            merchantName: newest.Merchant?.Name ?? null,
            orderTime: newest.OrderTime.toISOString(),
            totalAmount: newest.TotalAmount.toString(),
            status: newest.Status,
          };
          console.log("检测到新订单，广播 new-order:", payload);
          io.to("orders").emit("new-order", payload);
        }
      } catch (err) {
        console.error("订单轮询错误:", err);
      }
    }, 3000);
  }

  if (!global.__pointsPoller__) {
    console.log("启动积分记录轮询广播...");
    global.__pointsPoller__ = setInterval(async () => {
      try {
        const latest = await prisma.pointRecord.findMany({
          orderBy: { RecordID: "desc" },
          take: 1,
          include: { Student: true, Order: true },
        });
        const newest = latest[0];
        if (!newest) return;

        if (!global.__lastPointRecordId__) {
          global.__lastPointRecordId__ = newest.RecordID;
          return;
        }

        // 发现新积分记录（RecordID 变更）
        if (newest.RecordID > global.__lastPointRecordId__!) {
          global.__lastPointRecordId__ = newest.RecordID;
          const payload = {
            recordId: newest.RecordID.toString(),
            studentId: newest.StudentID,
            studentName: newest.Student?.Name ?? null,
            orderId: newest.OrderID.toString(),
            points: newest.Points,
            createdAt: newest.CreatedAt.toISOString(),
          };
          console.log("检测到新积分记录，广播 new-points:", payload);
          io.to("points").emit("new-points", payload);
        }
      } catch (err) {
        console.error("积分轮询错误:", err);
      }
    }, 3000);
  }
};

export default SocketHandler;

// 可选的广播方法占位（实际项目中可从后端任务中调用）
export function broadcastNewOrder(orderData: any) {
  console.log("广播新订单:", orderData);
}

export function broadcastNewPoints(pointsData: any) {
  console.log("广播新积分记录:", pointsData);
}
