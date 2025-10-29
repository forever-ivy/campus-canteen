import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (res.socket.server.io) {
    console.log("Socket.io 已初始化");
    res.end();
    return;
  }

  console.log("正在初始化 Socket.io...");
  const httpServer = res.socket.server;
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    transports: ["websocket", "polling"], // 确保支持多种传输方式
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false
    }
  });

  // Socket.io 事件处理
  io.on("connection", (socket) => {
    console.log(`用户连接: ${socket.id}`);

    // 加入订单房间
    socket.on("join-orders", () => {
      socket.join("orders");
      console.log(`用户 ${socket.id} 加入订单房间`);
    });

    // 加入积分记录房间
    socket.on("join-points", () => {
      socket.join("points");
      console.log(`用户 ${socket.id} 加入积分记录房间`);
    });

    // 模拟数据库变化通知（实际项目中，数据库触发器会调用这个接口）
    socket.on("database-changed", (data: any) => {
      console.log("数据库发生变化:", data);

      // 根据变化类型广播到相应房间
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
};

export default SocketHandler;

// 导出一个函数，用于在其他地方发送消息
export function broadcastNewOrder(orderData: any) {
  // 这个函数可以从数据库触发器或定时任务中调用
  console.log("广播新订单:", orderData);
}

export function broadcastNewPoints(pointsData: any) {
  // 这个函数可以从数据库触发器或定时任务中调用
  console.log("广播新积分记录:", pointsData);
}