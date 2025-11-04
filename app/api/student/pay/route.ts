import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import type { PaymentMethod } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 学生支付订单接口
 * 功能：
 * 1. 检查订单状态是否为"待支付"
 * 2. 检查学生余额是否足够
 * 3. 扣除余额
 * 4. 更新订单状态为"已完成"
 * 5. 创建支付记录
 * 6. 增加消费积分（积分 = 消费金额）
 */
export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (err) {
      console.error("解析支付请求失败:", err);
      return NextResponse.json(
        { error: "请求体格式错误" },
        { status: 400 }
      );
    }

    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json(
        { error: "请求体格式错误" },
        { status: 400 }
      );
    }

    const { orderId, studentId, payMethod } = payload as {
      orderId?: unknown;
      studentId?: unknown;
      payMethod?: unknown;
    };

    // 验证必填字段
    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json(
        { error: "订单ID不能为空" },
        { status: 400 }
      );
    }

    if (typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json(
        { error: "学号不能为空" },
        { status: 400 }
      );
    }

    const normalizedPayMethod = (typeof payMethod === "string" ? payMethod : "校园卡") as PaymentMethod;
    if (!["微信", "支付宝", "校园卡"].includes(normalizedPayMethod)) {
      return NextResponse.json(
        { error: "支付方式无效" },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // 查询订单信息
      const orderRequest = new sql.Request(transaction);
      orderRequest.input("orderId", orderId.trim());

      const orderResult = await orderRequest.query<{
        OrderID: string;
        StudentID: string;
        TotalAmount: number | string;
        Status: string;
      }>(`
        -- 查询订单信息
        SELECT OrderID, StudentID, TotalAmount, Status
        FROM [Order]
        WHERE OrderID = @orderId
      `);

      if (orderResult.recordset.length === 0) {
        await transaction.rollback();
        return NextResponse.json(
          { error: "订单不存在" },
          { status: 404 }
        );
      }

      const order = orderResult.recordset[0];

      // 验证订单归属
      if (order.StudentID.trim() !== studentId.trim()) {
        await transaction.rollback();
        return NextResponse.json(
          { error: "订单不属于该学生" },
          { status: 403 }
        );
      }

      // 验证订单状态
      if (order.Status.trim() !== "待支付") {
        await transaction.rollback();
        return NextResponse.json(
          { error: "订单已支付或状态不正确" },
          { status: 400 }
        );
      }

      const amount = typeof order.TotalAmount === "number"
        ? order.TotalAmount
        : Number(order.TotalAmount);

      // 查询学生余额
      const studentRequest = new sql.Request(transaction);
      studentRequest.input("studentId", studentId.trim());

      const studentResult = await studentRequest.query<{
        Balance: number | string;
        Points: number | string;
      }>(`
        -- 查询学生余额和积分
        SELECT Balance, Points
        FROM Student
        WHERE StudentID = @studentId
      `);

      if (studentResult.recordset.length === 0) {
        await transaction.rollback();
        return NextResponse.json(
          { error: "学生不存在" },
          { status: 404 }
        );
      }

      const student = studentResult.recordset[0];
      const balance = typeof student.Balance === "number"
        ? student.Balance
        : Number(student.Balance);
      const points = typeof student.Points === "number"
        ? student.Points
        : Number(student.Points);

      // 检查余额是否足够
      if (balance < amount) {
        await transaction.rollback();
        return NextResponse.json(
          { error: "余额不足" },
          { status: 400 }
        );
      }

      // 扣除余额，增加积分
      const updateStudentRequest = new sql.Request(transaction);
      updateStudentRequest.input("studentId", studentId.trim());
      updateStudentRequest.input("amount", amount);
      updateStudentRequest.input("points", amount);

      await updateStudentRequest.query(`
        -- 更新学生余额和积分
        UPDATE Student
        SET Balance = Balance - @amount,
            Points = Points + @points
        WHERE StudentID = @studentId
      `);

      // 更新订单状态
      const updateOrderRequest = new sql.Request(transaction);
      updateOrderRequest.input("orderId", orderId.trim());

      await updateOrderRequest.query(`
        -- 更新订单状态为已完成
        UPDATE [Order]
        SET Status = N'已完成'
        WHERE OrderID = @orderId
      `);

      // 生成支付记录ID（格式：P + 订单ID后14位，总共15位）
      const trimmedOrderId = orderId.trim();
      const payId = `P${trimmedOrderId.substring(1)}`;
      const payTime = new Date();

      // 创建支付记录
      const paymentRequest = new sql.Request(transaction);
      paymentRequest.input("payId", payId);
      paymentRequest.input("orderId", orderId.trim());
      paymentRequest.input("payMethod", normalizedPayMethod);
      paymentRequest.input("amount", amount);
      paymentRequest.input("payTime", payTime);

      await paymentRequest.query(`
        -- 插入支付记录
        INSERT INTO PayMentMethod (PayID, OrderID, PayMethod, Amount, PayTime)
        VALUES (@payId, @orderId, @payMethod, @amount, @payTime)
      `);

      await transaction.commit();

      return NextResponse.json({
        success: true,
        payId,
        newBalance: balance - amount,
        newPoints: points + amount,
      });
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("支付回滚失败:", rollbackErr);
      }
      throw err;
    }
  } catch (err) {
    console.error("支付失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
