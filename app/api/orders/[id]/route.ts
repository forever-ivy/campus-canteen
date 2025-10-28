/**
 * @file /api/orders/[id]/route.ts
 * @description 该路由用于根据订单ID获取单个订单的详细信息。
 */
import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { toBigIntString, toCurrency } from "../../_utils/transform";
import type {
  OrderDetailResponse,
  OrderListItem,
} from "../../../../types/orders";

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
 * @usage
 * ```ts
 * // 前端示例: 获取订单详情后渲染页面
 * const res = await fetch(`/api/orders/${orderId}`);
 * if (!res.ok) throw new Error("订单不存在或接口异常");
 * const { order } = await res.json();
 * // order 对象结构:
 * // {
 * //   orderId: string;
 * //   studentId: number;
 * //   studentName: string | null;
 * //   merchantId: number;
 * //   merchantName: string | null;
 * //   orderTime: string; // ISO 时间
 * //   status: string; // 订单状态
 * //   totalAmount: string; // 已格式化的金额 "¥88.00"
 * //   payment: Array<{ payId: string; amount: string; payMethod: string; payTime: string | null; }>;
 * //   details: Array<{ dishId: number; dishName: string | null; price: string; quantity: number; subtotal: string; }>;
 * // }
 * ```
 * @example
 * // 获取订单号为 12345678901234567890 的订单详情
 * fetch("/api/orders/12345678901234567890");
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id ?? "";
    const normalized = rawId.trim();
    if (!normalized) {
      return NextResponse.json({ error: "缺少订单编号" }, { status: 400 });
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
        { status: 400 }
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
        OrderDetail: {
          // 关联订单项
          include: {
            Dish: true, // 在订单项中再关联菜品信息
          },
        },
        PointRecord: true, // 关联积分记录
      },
    });

    // 如果未找到订单, 返回 404
    if (!order) {
      return NextResponse.json({ error: "未找到对应订单" }, { status: 404 });
    }

    // --- 数据格式化 ---
    // 将从数据库获取的原始数据转换为前端友好的格式
    const orderItem: OrderListItem = {
      // 将可能返回 string | null 的 toBigIntString 改为稳定的 string
      orderId: order.OrderID.toString(),
      studentId: order.StudentID,
      studentName: order.Student?.Name ?? null,
      merchantId: order.MerchantID,
      merchantName: order.Merchant?.Name ?? null,
      orderTime: order.OrderTime.toISOString(),
      status: order.Status,
      totalAmount: toCurrency(order.TotalAmount),
      payment: (order.PaymentMethod || []).map((payment, index) => ({
        payId: `${toBigIntString(payment.PayID) ?? order.OrderID}-${index + 1}`,
        amount: toCurrency(payment.Amount),
        payMethod: payment.PayMethod,
        payTime: payment.PayTime ? payment.PayTime.toISOString() : null,
      })),
      details: (order.OrderDetail || []).map((detail) => ({
        dishId: detail.DishID,
        dishName: detail.Dish?.Name ?? null,
        price: toCurrency(detail.Dish?.Price),
        quantity: detail.Quantity,
        subtotal: toCurrency(detail.Subtotal),
      })),
    };

    // 返回统一后的订单数据
    const result: OrderDetailResponse = { order: orderItem };
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器繁忙，请稍后再试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
