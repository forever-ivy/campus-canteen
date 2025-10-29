import { NextRequest, NextResponse } from "next/server";

// 这个接口模拟数据库触发器，用于测试 Socket.io 功能
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log("模拟数据库触发器:", { type, data });

    // 这里应该连接实际的 WebSocket 服务器来广播消息
    // 由于我们在 Next.js 中，需要通过其他方式来触发 Socket.io 广播

    // 方案1: 通过 HTTP API 触发（简化版）
    // 实际项目中，你可能需要使用数据库触发器或消息队列

    // 方案2: 返回触发信息，让客户端处理
    const triggerInfo = {
      type,
      payload: data,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "数据库变更触发成功",
      trigger: triggerInfo,
    });

  } catch (error) {
    console.error("触发器错误:", error);
    return NextResponse.json(
      { success: false, error: "触发器失败" },
      { status: 500 }
    );
  }
}

// GET 接口用于测试连接
export async function GET() {
  return NextResponse.json({
    message: "数据库触发器 API 正常运行",
    usage: "POST /api/trigger 来模拟数据库变更",
    example: {
      type: "new_order",
      data: {
        orderId: "202410001",
        studentId: "1001",
        amount: 22,
        createdAt: "2024-10-28 07:35:00",
      },
    },
  });
}