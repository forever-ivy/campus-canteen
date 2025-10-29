import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { toBigIntString, toCurrency } from "../_utils/transform";
import type { OrderListItem, OrderListResponse } from "../../../types/orders";

/**
 * @summary 获取全部订单列表 (GET /api/orders)
 * @returns {Promise<NextResponse>}
 * - 成功时: 返回一个包含全部订单数据的 JSON 对象。
 *   { total, items: [...] }
 * - 失败时: 返回一个包含错误信息的 JSON 对象。
 */
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { OrderTime: "desc" },
      include: {
        Student: true,
        Merchant: true,
        OrderDetail: {
          include: {
            Dish: true,
          },
        },
        PaymentMethod: true,
      },
    });

    // 格式化返回的订单数据
    const items: OrderListItem[] = orders.map((order) => ({
      // 保证是 string，避免 string | null
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
    }));

    // 返回最终结果
    const result: OrderListResponse = {
      total: items.length,
      items,
    };
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
