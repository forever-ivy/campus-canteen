/**
 * @file /api/orders/[id]/route.ts
 * @description 该路由用于根据订单ID获取单个订单的详细信息。
 */
import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { toBigIntString, toCurrency } from "../../_utils/transform";

/**
 * @summary 获取单个订单详情 (GET /api/orders/{id})
 * @description 根据提供的订单ID, 查询并返回该订单的完整信息, 包括关联的学生、商户、支付方式和订单项。
 * @param {Request} _request - Next.js 的请求对象 (未使用)。
 * @param {{ params: { id: string } }} { params } - 包含动态路由参数的对象, `id` 是订单的唯一标识。
 * @returns {Promise<NextResponse>}
 * - 成功时: 返回一个包含订单详细信息的 JSON 对象。
 *   { order: { ... } }
 * - 找不到订单时: 返回 404 状态码和错误信息。
 * - ID 格式错误时: 返回 400 状态码和错误信息。
 * - 服务器内部错误时: 返回 500 状态码和错误信息。
 *
 * @example
 * // 获取订单号为 12345678901234567890 的订单详情
 * fetch("/api/orders/12345678901234567890");
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const rawId = params.id ?? "";
    const normalized = rawId.trim();
    if (!normalized) {
      return NextResponse.json(
        { error: "缺少订单编号" },
        { status: 400 },
      );
    }

    // --- ID 安全转换 ---
    // 将传入的 ID 字符串转换为 BigInt, 忽略非数字字符
    let orderId: bigint | null = null;
    try {
      orderId = BigInt(normalized.replace(/\D/g, ""));
    } catch {
      orderId = null;
    }

    if (orderId == null) {
      return NextResponse.json(
        { error: "订单编号格式不正确" },
        { status: 400 },
      );
    }

    // --- 数据库查询 ---
    // 使用 Prisma 查询唯一的订单记录, 并包含所有关联数据
    const order = await prisma.order.findUnique({
      where: { OrderID: orderId },
      include: {
        Student: true, // 关联学生信息
        Merchant: true, // 关联商户信息
        PaymentMethod: true, // 关联支付方式
        OrderDetail: { // 关联订单项
          include: {
            Dish: true, // 在订单项中再关联菜品信息
          },
        },
        PointRecord: true, // 关联积分记录
      },
    });

    // 如果未找到订单, 返回 404
    if (!order) {
      return NextResponse.json(
        { error: "未找到对应订单" },
        { status: 404 },
      );
    }

    // --- 数据格式化 ---
    // 将从数据库获取的原始数据转换为前端友好的格式
    const payload = {
      orderId: toBigIntString(order.OrderID),
      status: order.Status,
      orderTime: order.OrderTime.toISOString(),
      merchant: {
        id: order.MerchantID,
        name: order.Merchant?.Name ?? null,
        location: order.Merchant?.Location ?? null,
      },
      student: {
        id: order.StudentID,
        name: order.Student?.Name ?? null,
        major: order.Student?.Major ?? null,
      },
      payments: (order.PaymentMethod || []).map((payment) => ({
        payId: toBigIntString(payment.PayID),
        method: payment.PayMethod,
        amount: toCurrency(payment.Amount),
        payTime: payment.PayTime ? payment.PayTime.toISOString() : null,
      })),
      items: (order.OrderDetail || []).map((detail) => ({
        dishId: detail.DishID,
        dishName: detail.Dish?.Name ?? null,
        price: toCurrency(detail.Dish?.Price),
        quantity: detail.Quantity,
        subtotal: toCurrency(detail.Subtotal),
      })),
      totals: {
        amount: toCurrency(order.TotalAmount),
        paymentCount: order.PaymentMethod?.length ?? 0,
        pointReward: order.PointRecord?.Points ?? 0,
      },
    };

    // 返回格式化后的订单数据
    return NextResponse.json({ order: payload });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}