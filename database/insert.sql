-- 1. 增加新档口：小吃天堂 (MerchantID: 04101)
INSERT INTO Merchant (MerchantID, MName, Location, Manager, Phone) VALUES
('04101', N'小吃天堂', N'四食堂一楼', N'周星', '13577778888');

-- 2. 增加新菜品：炸鸡腿 (DishID: 04101001)
INSERT INTO Dish (DishID, DName, Price, MerchantID) VALUES
('04101001', N'香辣炸鸡腿', 6.50, '04101');

-- 3. 增加初始库存
INSERT INTO Stock (StockID, MerchantID, DishID, InQuantity, OutQuantity, RemainingQuantity, UpdateTime) VALUES
('041010010001', '04101', '04101001', 100, 5, 100, GETDATE());

-- 4. 新增学生 '林小雨'
INSERT INTO Student (StudentID, SName, Sex, Major, Balance, Points) VALUES
('202411040510', N'林小雨', 'F', N'电子信息', 250.00, 50.00);