import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StockRow = {
  StockID: string;
  DishID: string;
  DishName: string;
  InQuantity: number;
  OutQuantity: number;
  RemainingQuantity: number;
  UpdateTime: Date | string | null;
};

/**
 * 获取商家库存信息（仅本档口）
 * 显示菜品的入库量、出库量、剩余量及更新时间
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: merchantId } = await params;

    if (!merchantId || !merchantId.trim()) {
      return NextResponse.json(
        { error: "档口编号不能为空" },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("merchantId", merchantId.trim())
      .query<StockRow>(`
        -- 查询商家库存信息（仅本档口）
        SELECT
          Stock.StockID,
          Stock.DishID,
          Dish.DName AS DishName,
          Stock.InQuantity,
          Stock.OutQuantity,
          Stock.RemainingQuantity,
          Stock.UpdateTime
        FROM Stock
        INNER JOIN Dish ON Dish.DishID = Stock.DishID
        WHERE Stock.MerchantID = @merchantId
        ORDER BY Stock.UpdateTime DESC
      `);

    const stockItems = result.recordset.map((row) => ({
      stockId: row.StockID.trim(),
      dishId: row.DishID.trim(),
      dishName: row.DishName.trim(),
      inQuantity: row.InQuantity,
      outQuantity: row.OutQuantity,
      remainingQuantity: row.RemainingQuantity,
      updateTime: row.UpdateTime ? new Date(row.UpdateTime).toISOString() : null,
    }));

    return NextResponse.json({ stockItems });
  } catch (err) {
    console.error("获取库存信息失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
