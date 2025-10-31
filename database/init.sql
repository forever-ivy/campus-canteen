-- 设置数据库以支持中文（如果数据库不存在，创建时指定）
-- 注意：在实际部署时，建议在数据库创建时指定 COLLATE Chinese_PRC_CI_AS

CREATE TABLE Student
(
    StudentID INT PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    SEX NCHAR(1),
    Major NVARCHAR(100),
    Balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    Points INT NOT NULL DEFAULT 0,
    CONSTRAINT CK_Student_Balance CHECK (Balance >= 0),
    CONSTRAINT CK_Student_Points CHECK (Points >= 0),
    CONSTRAINT CK_Student_SEX CHECK (SEX IN (N'M', N'F', N'男', N'女'))
);

CREATE TABLE Merchant
(
    MerchantID INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Location NVARCHAR(100),
    Manager NVARCHAR(50)
);

CREATE TABLE Dish
(
    DishID INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(8, 2) NOT NULL,
    Stock INT NOT NULL DEFAULT 0,
    MerchantID INT NOT NULL,
    CONSTRAINT FK_Dish_Merchant FOREIGN KEY (MerchantID) REFERENCES Merchant(MerchantID) ON DELETE NO ACTION,
    CONSTRAINT CK_Dish_Price CHECK (Price > 0),
    CONSTRAINT CK_Dish_Stock CHECK (Stock >= 0)
);

CREATE TABLE [Order]
(
    OrderID BIGINT PRIMARY KEY,
    StudentID INT NOT NULL,
    MerchantID INT NOT NULL,
    OrderTime DATETIME NOT NULL DEFAULT GETDATE(),
    TotalAmount DECIMAL(10, 2) NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    CONSTRAINT FK_Order_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID) ON DELETE CASCADE,
    CONSTRAINT FK_Order_Merchant FOREIGN KEY (MerchantID) REFERENCES Merchant(MerchantID) ON DELETE NO ACTION,
    CONSTRAINT CK_Order_TotalAmount CHECK (TotalAmount >= 0),
    CONSTRAINT CK_Order_Status CHECK (Status IN (N'待支付', N'已支付', N'已取餐', N'已完成', N'已退款'))
);

CREATE TABLE OrderDetail
(
    OrderID BIGINT NOT NULL,
    DishID INT NOT NULL,
    Quantity INT NOT NULL,
    Subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT PK_OrderDetail PRIMARY KEY (OrderID, DishID),
    -- 联合主键
    CONSTRAINT FK_OrderDetail_Order FOREIGN KEY (OrderID) REFERENCES [Order](OrderID) ON DELETE CASCADE,
    CONSTRAINT FK_OrderDetail_Dish FOREIGN KEY (DishID) REFERENCES Dish(DishID) ON DELETE NO ACTION,
    CONSTRAINT CK_OrderDetail_Quantity CHECK (Quantity > 0)
);


CREATE TABLE PaymentMethod
(
    PayID BIGINT PRIMARY KEY IDENTITY(1,1),
    -- 主键自增
    OrderID BIGINT NOT NULL,
    PayMethod NVARCHAR(50) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    PayTime DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PaymentMethod_Order FOREIGN KEY (OrderID) REFERENCES [Order](OrderID) ON DELETE CASCADE,
    CONSTRAINT CK_PaymentMethod_Amount CHECK (Amount > 0),
    CONSTRAINT CK_PaymentMethod_PayMethod CHECK (PayMethod IN (N'微信', N'支付宝', N'校园卡', N'现金'))
);

CREATE TABLE PointRecord
(
    RecordID BIGINT PRIMARY KEY IDENTITY(1,1),
    -- 主键自增
    StudentID INT NOT NULL,
    OrderID BIGINT NOT NULL,
    Points INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_PointRecord_OrderID UNIQUE (OrderID),
    -- 保证一个订单只产生一条积分记录
    CONSTRAINT FK_PointRecord_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID) ON DELETE NO ACTION,
    CONSTRAINT FK_PointRecord_Order FOREIGN KEY (OrderID) REFERENCES [Order](OrderID) ON DELETE NO ACTION,
    CONSTRAINT CK_PointRecord_Points CHECK (Points >= 0)
);



