import { NextRequest, NextResponse } from "next/server";

// 简单的测试接口，用于测试 WebSocket 连接
export async function GET() {
  return NextResponse.json({
    message: "Socket.io 测试接口",
    status: "ok",
    time: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("收到测试请求:", body);

    return NextResponse.json({
      success: true,
      message: "测试成功",
      received: body,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "测试失败",
    }, { status: 500 });
  }
}