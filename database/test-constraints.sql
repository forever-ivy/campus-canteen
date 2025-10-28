-- 测试约束修复的简化脚本
-- 简化的数据插入脚本，用于测试约束修复

-- 测试Student表插入
INSERT INTO Student (StudentID, Name, SEX, Major, Balance, Points)
VALUES
    (1001, N'张三', N'M', N'计算机科学与技术', 158.50, 1250),
    (1002, N'李四', N'F', N'软件工程', 89.20, 680);

-- 测试Merchant表插入
INSERT INTO Merchant (MerchantID, Name, Location, Manager)
VALUES
    (2001, N'第一食堂一楼', N'第一食堂一楼', N'张经理'),
    (2002, N'第一食堂二楼', N'第一食堂二楼', N'李经理');

-- 测试Dish表插入
INSERT INTO Dish (DishID, Name, Price, Stock, MerchantID)
VALUES
    (3001, N'红烧肉', 18.00, 50, 2001),
    (3002, N'宫保鸡丁', 16.00, 45, 2001);

-- 测试Order表插入
INSERT INTO [Order] (OrderID, StudentID, MerchantID, OrderTime, TotalAmount, Status)
VALUES
    (202410001, 1001, 2001, '2024-10-28 07:30:00', 22.00, N'已完成'),
    (202410002, 1002, 2002, '2024-10-28 08:15:00', 19.50, N'已完成');

-- 测试OrderDetail表插入
INSERT INTO OrderDetail (OrderID, DishID, Quantity, Subtotal)
VALUES
    (202410001, 3001, 1, 18.00),
    (202410001, 3002, 1, 16.00);

-- 测试PaymentMethod表插入
INSERT INTO PaymentMethod (OrderID, PayMethod, Amount, PayTime)
VALUES
    (202410001, N'校园卡', 22.00, '2024-10-28 07:32:00'),
    (202410002, N'微信', 19.50, '2024-10-28 08:17:00');

-- 测试PointRecord表插入
INSERT INTO PointRecord (StudentID, OrderID, Points, CreatedAt)
VALUES
    (1001, 202410001, 22, '2024-10-28 07:35:00'),
    (1002, 202410002, 20, '2024-10-28 08:20:00');

-- 显示测试结果
SELECT N'测试数据插入成功！' AS message;