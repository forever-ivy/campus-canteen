import prisma from "../../../lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";
import { NextResponse } from "next/server";
import {
  endOfDay,
  parseDateParam,
  toBigIntString,
  toCurrency,
} from "../_utils/transform";
import type { OrderListItem, OrderListResponse } from "../../../types/orders";

/**
 * @summary 获取订单列表 (GET /api/orders)
 * @description
 * - 支持通过URL查询参数进行分页 (`page`, `pageSize`)。
 * - 支持通过 `q` 和 `qBy` (查询内容和查询字段) 进行搜索。
 * - 支持通过 `status` (订单状态) 和 `from`/`to` (日期范围) 进行筛选。
 * @param {Request} request - Next.js 的请求对象, 包含 URL 查询参数。
 * @returns {Promise<NextResponse>}
 * - 成功时: 返回一个包含分页信息和订单列表的 JSON 对象。
 *   { page, pageSize, total, items: [...] }
 * - 失败时: 返回一个包含错误信息的 JSON 对象。
 *
 * @example
 * // 获取第 2 页, 每页 10 条数据
 * fetch("/api/orders?page=2&pageSize=10");
 *
 * @example
 * // 搜索学生姓名为 "张三" 的订单
 * fetch("/api/orders?q=张三");
 *
 * @example
 * // 搜索订单号
 * fetch("/api/orders?q=123456&qBy=orderId");
 *
 * @example
 * // 筛选2023年10月27日之后已完成的订单
 * fetch("/api/orders?status=Completed&from=2023-10-27");
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // --- 分页参数 ---
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("pageSize") || 20))
    );

    // --- 搜索与筛选参数 ---
    const q = (url.searchParams.get("q") || "").trim(); // 搜索关键词
    const qBy = (url.searchParams.get("qBy") || "").toLowerCase(); // 搜索字段 (orderId, studentId)
    const status = (url.searchParams.get("status") || "").trim(); // 订单状态
    const from = parseDateParam(url.searchParams.get("from")); // 开始日期
    const toInput = parseDateParam(url.searchParams.get("to")); // 结束日期
    const to = toInput ? endOfDay(toInput) : null; // 结束日期调整为当天 23:59:59

    // 构建 Prisma 查询条件
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.Status = status;
    }

    if (from || to) {
      where.OrderTime = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lt: to } : {}),
      };
    }

    // 处理搜索逻辑
    if (q) {
      if (qBy === "orderid") {
        const numeric = q.replace(/\D/g, "");
        if (!numeric) {
          return NextResponse.json({
            page,
            pageSize,
            total: 0,
            items: [],
          });
        }
        where.OrderID = BigInt(numeric);
      } else if (qBy === "studentid") {
        const sid = Number(q);
        if (Number.isNaN(sid)) {
          return NextResponse.json({
            page,
            pageSize,
            total: 0,
            items: [],
          });
        }
        where.StudentID = sid;
      } else {
        // 默认模糊搜索 (学生姓名, 商户名称, 订单号)
        const normalized = q.replace(/\s+/g, " ").trim();
        const numeric = normalized.replace(/\D/g, "");
        const orFilters: Prisma.OrderWhereInput[] = [
          { Student: { Name: { contains: normalized } } },
          { Merchant: { Name: { contains: normalized } } },
        ];
        if (numeric) {
          try {
            orFilters.push({ OrderID: BigInt(numeric) });
          } catch {
            // 忽略 BigInt 解析错误
          }
        }
        where.OR = orFilters;
      }
    }

    // 并行执行 count 和 findMany 查询以提高效率
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { OrderTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
    ]);

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
      page,
      pageSize,
      total,
      items,
    };
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
