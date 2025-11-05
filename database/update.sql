-- 1. 价格上调
UPDATE Dish
SET Price = Price + 1.00
WHERE DishID = '01102002';

-- 2. 积分增加
UPDATE Student
SET Points = Points + 50
WHERE StudentID = '202411040505';

-- 3. 修改订单状态（例如某笔订单由“待支付”改为“已完成”）
UPDATE [Order]
SET Status = N'已完成'
WHERE OrderID = '021012511030004';

-- 4. 更新库存（某菜品售出10份后，剩余库存减少10）
UPDATE Stock
SET OutQuantity = OutQuantity + 10,
    RemainingQuantity = RemainingQuantity - 10,
    UpdateTime = GETDATE()
WHERE StockID = '011010010001';