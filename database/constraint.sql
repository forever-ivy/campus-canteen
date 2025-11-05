--1.确保学生余额不超过 10000.00 元
ALTER TABLE Student
ADD CONSTRAINT CHK_Student_Balance_Limit CHECK (Balance <= 10000.00);
--测试
INSERT INTO Student (StudentID, SName, Sex, Major, Balance, Points) 
VALUES ('202411040599', N'测试学生', 'M', N'数学', 100000.01, 0);
--2.结束限制
-- 删除学生余额限制约束
ALTER TABLE Student
DROP CONSTRAINT CHK_Student_Balance_Limit;
--测试
INSERT INTO Student (StudentID, SName, Sex, Major, Balance, Points)
VALUES ('202411040599', N'测试学生', 'M', N'数学', 100000.01, 0);
