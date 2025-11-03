-- 表 3-1: 学生表 (Student)
CREATE TABLE Student
(
    StudentID CHAR(12) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Sex CHAR(1),
    Major NVARCHAR(50),
    Balance DECIMAL(10, 2) DEFAULT 0.00,
    Points DECIMAL(10, 2) DEFAULT 0.00
);

-- 表 3-2: 档口表 (Merchant)
CREATE TABLE Merchant
(
    MerchantID CHAR(5) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Location NVARCHAR(50),
    Manager NVARCHAR(50)
);

-- 表 3-3: 菜品表 (Dish)
CREATE TABLE Dish
(
    DishID CHAR(8) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Price DECIMAL(8, 2) NOT NULL,
    MerchantID CHAR(5) NOT NULL,
    FOREIGN KEY(MerchantID) REFERENCES Merchant(MerchantID)
);

-- 表 3-4: 库存表 (Stock)
CREATE TABLE Stock
(
    StockID CHAR(12) PRIMARY KEY,
    MerchantID CHAR(5) NOT NULL,
    DishID CHAR(8) NOT NULL,
    InQuantity INT DEFAULT 0,
    OutQuantity INT DEFAULT 0,
    RemainingQuantity INT DEFAULT 0,
    UpdateTime DATETIME,
    FOREIGN KEY(MerchantID) REFERENCES Merchant(MerchantID),
    FOREIGN KEY(DishID) REFERENCES Dish(DishID)
);

-- 表 3-5: 订单表 (Order)
-- 注意: 'Order' 是 SQL 的保留关键字, 建议使用方括号 [] 或将其命名为 Orders
CREATE TABLE [Order]
(
    OrderID CHAR(15) PRIMARY KEY,
    StudentID CHAR(12) NOT NULL,
    MerchantID CHAR(5) NOT NULL,
    OrderTime DATETIME NOT NULL,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    [Status] NVARCHAR(10) NOT NULL CHECK ([Status] IN (N'待支付', N'已完成')),
    FOREIGN KEY(StudentID) REFERENCES Student(StudentID),
    FOREIGN KEY(MerchantID) REFERENCES Merchant(MerchantID)
);

-- 表 3-6: 支付方式表 (Payment)
CREATE TABLE Payment
(
    PayID CHAR(15) PRIMARY KEY,
    OrderID CHAR(15) NOT NULL,
    PayMethod NVARCHAR(10) NOT NULL CHECK (PayMethod IN (N'微信', N'支付宝', N'校园卡')),
    Amount DECIMAL(10, 2) NOT NULL,
    PayTime DATETIME NOT NULL,
    FOREIGN KEY(OrderID) REFERENCES [Order](OrderID)
);

-- 表 3-7: 订单明细表 (OrderDetail)
CREATE TABLE OrderDetail
(
    OrderID CHAR(15) NOT NULL,
    DishID CHAR(8) NOT NULL,
    Quantity INT NOT NULL,
    PRIMARY KEY(OrderID, DishID),
    FOREIGN KEY(OrderID) REFERENCES [Order](OrderID),
    FOREIGN KEY(DishID) REFERENCES Dish(DishID)
);