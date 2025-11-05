--1.查询所有已完成订单的详细信息，包括订单编号、学生姓名、档口名称、订单总金额和支付方式。（连接查询）
SELECT
    O.OrderID AS 订单编号,
    S.SName AS 学生姓名,
    M.MName AS 档口名称,
    O.TotalAmount AS 订单总金额,
    P.PayMethod AS 支付方式
FROM
    [Order] AS O
JOIN
    Student AS S ON O.StudentID = S.StudentID
JOIN
    Merchant AS M ON O.MerchantID = M.MerchantID
JOIN
    PaymentMethod AS P ON O.OrderID = P.OrderID
WHERE
    O.Status = N'已完成';
--2.查询所有供应价格低于 10 元菜品的档口信息（档口编号、名称、位置）。（嵌套查询）
SELECT
    MerchantID AS 档口编号,
    MName AS 档口名称,
    Location AS 档口位置
FROM
    Merchant
WHERE
    MerchantID IN (
        SELECT
            MerchantID
        FROM
            Dish
        WHERE
            Price < 10.00
    );
--3.统计订单总金额大于等于 20 元的档口，并列出这些档口的总销售额和订单数量。（分组查询）
SELECT
    M.MerchantID AS 档口编号,
    M.MName AS 档口名称,
    SUM(O.TotalAmount) AS 总销售额,
    COUNT(O.OrderID) AS 订单总数
FROM
    [Order] AS O
JOIN
    Merchant AS M ON O.MerchantID = M.MerchantID
GROUP BY
    M.MerchantID, M.MName
HAVING
    SUM(O.TotalAmount) >= 20.00
ORDER BY
    总销售额 DESC;
--4.查询所有档口中，剩余库存量低于 20 的菜品信息，并列出档口名称、菜品名称和剩余数量。（连接查询）
SELECT
    M.MName AS 档口名称,
    D.DName AS 菜品名称,
    S.RemainingQuantity AS 剩余数量
FROM
    Stock AS S
JOIN
    Dish AS D ON S.DishID = D.DishID
JOIN
    Merchant AS M ON S.MerchantID = M.MerchantID
WHERE
    S.RemainingQuantity < 20
ORDER BY
    剩余数量 ASC;
--5.统计每个档口在 指定时间段内（2025-11-03） 的 总销售额 和 平均客单价，并按总销售额降序排列。
--同时只列出总销售额高于所有档口平均销售额的档口。
SELECT
    M.MName AS 档口名称,
    SUM(O.TotalAmount) AS 总销售额,
    AVG(O.TotalAmount) AS 平均客单价,
    COUNT(O.OrderID) AS 订单总数
FROM
    [Order] AS O
JOIN
    Merchant AS M ON O.MerchantID = M.MerchantID
WHERE
    O.OrderTime >= '2025-11-03 00:00:00' 
    AND O.OrderTime < '2025-11-04 00:00:00' 
GROUP BY
    M.MerchantID, M.MName
HAVING
    SUM(O.TotalAmount) > (
        SELECT AVG(TotalAmount)
        FROM [Order]
        WHERE OrderTime >= '2025-11-03 00:00:00' AND OrderTime < '2025-11-04 00:00:00'
    )
ORDER BY
    总销售额 DESC;

--6.查询出所有购买过 “宫保鸡丁” (DishID: 01101003) 的 女性 学生的基本信息（学生编号、姓名、专业）。
SELECT
    StudentID AS 学生编号,
    SName AS 学生姓名,
    Major AS 专业
FROM
    Student
WHERE
    Sex = 'F' 
    AND StudentID IN (
        SELECT 
            O.StudentID
        FROM 
            [Order] AS O
        JOIN 
            OrderDetail AS OD ON O.OrderID = OD.OrderID
        WHERE 
            OD.DishID = '01101003'
    );