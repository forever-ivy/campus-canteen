import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 获取商家基本信息
 * 包含：档口编号、名称、位置、负责人、联系电话
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
      .query<{
        MerchantID: string;
        MName: string;
        Location: string | null;
        Manager: string | null;
        Phone: string | null;
      }>(`
        -- 查询商家基本信息
        SELECT
          MerchantID,
          MName,
          Location,
          Manager,
          Phone
        FROM Merchant
        WHERE MerchantID = @merchantId
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "档口不存在" },
        { status: 404 }
      );
    }

    const merchant = result.recordset[0];

    return NextResponse.json({
      merchant: {
        merchantId: merchant.MerchantID.trim(),
        name: merchant.MName.trim(),
        location: merchant.Location ? merchant.Location.trim() : null,
        manager: merchant.Manager ? merchant.Manager.trim() : null,
        phone: merchant.Phone ? merchant.Phone.trim() : null,
      },
    });
  } catch (err) {
    console.error("获取商家信息失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
