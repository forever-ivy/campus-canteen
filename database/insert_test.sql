INSERT INTO [Order]
    (OrderID, StudentID, MerchantID, OrderTime, TotalAmount, Status)
VALUES
    -- 2024年10月的订单
    (203010001, 1001, 2001, '2030-10-29 07:30:00', 22.00, N'已完成');



INSERT INTO OrderDetail
    (OrderID, DishID, Quantity, Subtotal)
VALUES
    -- 订单202410001的详情
    (203010001, 3001, 1, 18.00);



INSERT INTO PaymentMethod
    (OrderID, PayMethod, Amount, PayTime)
VALUES
    -- 2024年10月订单的支付记录
    (203010001, N'校园卡', 22.00, '2030-10-29 07:32:00');


INSERT INTO PointRecord
    (StudentID, OrderID, Points, CreatedAt)
VALUES
    -- 2024年10月订单的积分记录
    (1001, 203010001, 22, '2030-10-29 07:35:00');
