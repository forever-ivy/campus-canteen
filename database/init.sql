CREATE TABLE Student
(
    StudentID INT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    SEX CHAR(1),
    Major VARCHAR(100),
    Balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    Points INT NOT NULL DEFAULT 0,
    CONSTRAINT CK_Student_Balance CHECK (Balance >= 0),
    CONSTRAINT CK_Student_Points CHECK (Points >= 0),
    CONSTRAINT CK_Student_SEX CHECK (SEX IN ('M', 'F', '男', '女'))
);

CREATE TABLE Merchant
(
    MerchantID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(100),
    Manager VARCHAR(50)
);

CREATE TABLE Dish
(
    DishID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
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
    Status VARCHAR(20) NOT NULL,
    CONSTRAINT FK_Order_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID) ON DELETE CASCADE,
    CONSTRAINT FK_Order_Merchant FOREIGN KEY (MerchantID) REFERENCES Merchant(MerchantID) ON DELETE NO ACTION,
    CONSTRAINT CK_Order_TotalAmount CHECK (TotalAmount >= 0),
    CONSTRAINT CK_Order_Status CHECK (Status IN ('待支付', '已支付', '已取餐', '已完成', '已退款'))
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
    PayMethod VARCHAR(50) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    PayTime DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PaymentMethod_Order FOREIGN KEY (OrderID) REFERENCES [Order](OrderID) ON DELETE CASCADE,
    CONSTRAINT CK_PaymentMethod_Amount CHECK (Amount > 0),
    CONSTRAINT CK_PaymentMethod_PayMethod CHECK (PayMethod IN ('微信', '支付宝', '校园卡', '现金'))
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



