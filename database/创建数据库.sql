CREATE DATABASE [SmartCanteenSystem]
ON PRIMARY
(
    NAME = SmartCanteenSystem_data, 
    FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\SmartCanteenSystem_data.mdf',
    SIZE = 20MB, 
    MAXSIZE = 300MB, 
    FILEGROWTH = 5MB
)
LOG ON
(
    NAME = SmartCanteenSystem_log, 
    FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\SmartCanteenSystem_log.ldf',
    SIZE = 5MB, 
    MAXSIZE = 50MB, 
    FILEGROWTH = 1MB
);