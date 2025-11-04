import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import type { OrderStatus } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentOrderRow = {
  OrderID: string;
  OrderTime: Date | string | null;
  TotalAmount: number | string;
  Status: string;
  MerchantName: string;
  Location: string | null;
};

type OrderDetailRow = {
  DishName: string;
  Price: number | string;
  Quantity: number;
};

/**
 * 获取学生订单列表
 * 支持按状态筛选：status=待支付 或 status=已完成
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId || !studentId.trim()) {
      return NextResponse.json(
        { error: "学号不能为空" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const pool = await getPool();
    const requestBuilder = pool.request();
    requestBuilder.input("studentId", studentId.trim());

    const sqlParts: string[] = [
      `
      -- 查询学生订单列表
      SELECT
        [Order].OrderID,
        [Order].OrderTime,
        [Order].TotalAmount,
        [Order].[Status],
        Merchant.MName AS MerchantName,
        Merchant.Location
      FROM [Order]
      INNER JOIN Merchant ON Merchant.MerchantID = [Order].MerchantID
      WHERE [Order].StudentID = @studentId
      `,
    ];

    // 按状态筛选
    if (statusFilter && (statusFilter === "待支付" || statusFilter === "已完成")) {
      sqlParts.push("AND [Order].[Status] = @status");
      requestBuilder.input("status", statusFilter);
    }

    // 按时间倒序排列
    sqlParts.push("ORDER BY [Order].OrderTime DESC");

    const result = await requestBuilder.query<StudentOrderRow>(
      sqlParts.join("\n")
    );

    // 为每个订单获取菜品详情
    const ordersWithDishes = await Promise.all(
      result.recordset.map(async (row) => {
        // 查询订单的菜品详情
        const detailsResult = await pool
          .request()
          .input("orderId", row.OrderID.trim())
          .query<OrderDetailRow>(`
            SELECT
              Dish.DName AS DishName,
              Dish.Price,
              OrderDetail.Quantity
            FROM OrderDetail
            INNER JOIN Dish ON Dish.DishID = OrderDetail.DishID
            WHERE OrderDetail.OrderID = @orderId
          `);

        const dishes = detailsResult.recordset.map((detail) => ({
          dishName: detail.DishName.trim(),
          price: typeof detail.Price === "number"
            ? detail.Price
            : Number(detail.Price),
          quantity: detail.Quantity,
        }));

        return {
          orderId: row.OrderID.trim(),
          orderTime: row.OrderTime ? new Date(row.OrderTime).toISOString() : null,
          totalAmount: typeof row.TotalAmount === "number"
            ? row.TotalAmount
            : Number(row.TotalAmount),
          status: row.Status.trim() as OrderStatus,
          merchantName: row.MerchantName.trim(),
          location: row.Location ? row.Location.trim() : null,
          dishes,
        };
      })
    );

    return NextResponse.json({ orders: ordersWithDishes });
  } catch (err) {
    console.error("获取学生订单失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
