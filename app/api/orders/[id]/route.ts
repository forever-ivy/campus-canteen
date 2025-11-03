import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPool } from "@/lib/db";
import type {
  OrderDetailData,
  OrderDetailItem,
  OrderPaymentEntry,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = {
  OrderID: string;
  StudentID: string;
  StudentName: string;
  MerchantID: string;
  MerchantName: string;
  Location: string | null;
  TotalAmount: number | string;
  Status: string;
  OrderTime: Date | string | null;
};

type PaymentRow = {
  PayID: string;
  PayMethod: string;
  Amount: number | string;
  PayTime: Date | string | null;
};

type DetailRow = {
  OrderID: string;
  DishID: string;
  DishName: string | null;
  Price: number | string | null;
  Quantity: number;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id?.trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "缺少订单编号" },
      { status: 400, statusText: "Bad Request" }
    );
  }

  try {
    const pool = await getPool();

    const orderRequest = pool.request();
    orderRequest.input("orderId", orderId);
    const orderResult = await orderRequest.query<OrderRow>(`
        SELECT
          o.OrderID,
          o.StudentID,
          s.Name AS StudentName,
          o.MerchantID,
          m.Name AS MerchantName,
          m.Location,
          o.TotalAmount,
          o.[Status],
          o.OrderTime
        FROM [Order] AS o
        INNER JOIN Student AS s ON s.StudentID = o.StudentID
        INNER JOIN Merchant AS m ON m.MerchantID = o.MerchantID
        WHERE o.OrderID = @orderId
      `);

    if (orderResult.recordset.length === 0) {
      return NextResponse.json(
        { error: "未找到对应订单" },
        { status: 404, statusText: "Not Found" }
      );
    }

    const orderRow = orderResult.recordset[0];

    const paymentsRequest = pool.request();
    paymentsRequest.input("orderId", orderId);
    const paymentsResult = await paymentsRequest.query<PaymentRow>(`
        SELECT
          PayID,
          PayMethod,
          Amount,
          PayTime
        FROM Payment
        WHERE OrderID = @orderId
        ORDER BY PayTime DESC
      `);

    const detailsRequest = pool.request();
    detailsRequest.input("orderId", orderId);
    const detailsResult = await detailsRequest.query<DetailRow>(`
        SELECT
          od.OrderID,
          od.DishID,
          d.Name AS DishName,
          d.Price,
          od.Quantity
        FROM OrderDetail AS od
        LEFT JOIN Dish AS d ON d.DishID = od.DishID
        WHERE od.OrderID = @orderId
        ORDER BY d.Name
      `);

    const payments: OrderPaymentEntry[] = paymentsResult.recordset.map(
      (payment) => ({
        payId: payment.PayID,
        payMethod: payment.PayMethod,
        amount:
          typeof payment.Amount === "number"
            ? payment.Amount
            : Number(payment.Amount ?? 0),
        payTime: payment.PayTime
          ? new Date(payment.PayTime).toISOString()
          : null,
      })
    );

    const details: OrderDetailItem[] = detailsResult.recordset.map((detail) => {
      const price =
        typeof detail.Price === "number"
          ? detail.Price
          : Number(detail.Price ?? 0);
      const subtotal = price * detail.Quantity;
      return {
        orderId: detail.OrderID,
        dishId: detail.DishID,
        dishName: detail.DishName,
        price,
        quantity: detail.Quantity,
        subtotal,
      };
    });

    const order: OrderDetailData = {
      orderId: orderRow.OrderID,
      studentId: orderRow.StudentID,
      studentName: orderRow.StudentName,
      merchantId: orderRow.MerchantID,
      merchantName: orderRow.MerchantName,
      location: orderRow.Location ? orderRow.Location.trim() : null,
      totalAmount:
        typeof orderRow.TotalAmount === "number"
          ? orderRow.TotalAmount
          : Number(orderRow.TotalAmount ?? 0),
      status: orderRow.Status as OrderDetailData["status"],
      orderTime: orderRow.OrderTime
        ? new Date(orderRow.OrderTime).toISOString()
        : null,
      payment: payments,
      details,
    };

    return NextResponse.json({ order });
  } catch (err) {
    console.error("获取订单详情失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
