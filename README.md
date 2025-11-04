# 智慧食堂管理系统

基于 Next.js 15 + TypeScript + SQL Server 开发的校园食堂管理系统，提供学生点餐、商家管理、订单处理等功能。

## 📋 项目简介

本系统是一个全栈 Web 应用，包含：

- **学生端**：登录、查看订单、在线支付
- **商家端**：订单管理、库存查询
- **管理端**：订单管理、数据统计

## 🛠️ 技术栈

- **前端框架**：Next.js 15 (React 19)
- **开发语言**：TypeScript
- **样式方案**：Tailwind CSS
- **UI 组件**：Radix UI + shadcn/ui
- **状态管理**：Zustand
- **数据库**：Microsoft SQL Server
- **数据库驱动**：mssql (node-mssql)

---

## 🚀 本地部署指南（从零开始）

### 第一步：安装必要软件

#### 1.1 安装 Node.js

Node.js 是运行本项目的基础环境。

**Windows 用户**：

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 **LTS（长期支持版）**，推荐 v20.x 或更高版本
3. 双击下载的 `.msi` 文件，一路点击"下一步"完成安装
4. 打开命令提示符（按 `Win + R`，输入 `cmd`，回车）
5. 输入以下命令验证安装：
   ```bash
   node -v
   npm -v
   ```
   如果显示版本号（如 `v20.11.0` 和 `10.2.4`），说明安装成功

**macOS 用户**：

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 **LTS 版本**
3. 双击 `.pkg` 文件，按提示安装
4. 打开终端（按 `Command + 空格`，搜索"终端"）
5. 输入 `node -v` 和 `npm -v` 验证安装

#### 1.2 安装 SQL Server

**Windows 用户**：

1. 下载 [SQL Server Express](https://www.microsoft.com/zh-cn/sql-server/sql-server-downloads)（免费版）
2. 安装时选择"基本"模式
3. 记住**实例名称**（默认为 `SQLEXPRESS`）
4. 下载并安装 [SQL Server Management Studio (SSMS)](https://aka.ms/ssmsfullsetup)（数据库管理工具）

**macOS 用户**：

- 使用 Docker 运行 SQL Server：
  ```bash
  docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Password" \
    -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2022-latest
  ```

---

### 第二步：获取项目代码

#### 2.1 下载项目

如果你已经有项目文件夹，跳过此步骤。

**使用 Git（推荐）**：

```bash
git clone <你的项目仓库地址>
cd campus-canteen
```

**或者直接下载 ZIP**：

1. 从 GitHub/Gitee 下载项目压缩包
2. 解压到任意文件夹
3. 打开终端/命令提示符，使用 `cd` 命令进入项目文件夹：
   ```bash
   cd /path/to/campus-canteen
   ```

---

### 第三步：配置数据库

#### 3.1 创建数据库

1. 打开 **SQL Server Management Studio (SSMS)**
2. 连接到你的 SQL Server 实例
3. 右键"数据库" → "新建数据库"
4. 数据库名称输入：`CampusCanteen`（或你喜欢的名称）
5. 点击"确定"

#### 3.2 执行建表脚本

项目的 `database/` 文件夹中包含所有建表脚本：

1. 在 SSMS 中，右键 `CampusCanteen` 数据库 → "新建查询"
2. 依次打开并执行以下 SQL 文件：

   - `Student.sql` - 学生表
   - `档口表.sql` - 商家（档口）表
   - `菜品.sql` - 菜品表
   - `订单表.sql` - 订单表
   - `订单明细表.sql` - 订单明细表
   - `库存.sql` - 库存表
   - `payment.sql` - 支付表

3. 每个文件执行后，点击"执行"按钮（或按 `F5`）

---

### 第四步：配置项目环境变量

#### 4.1 创建环境变量文件

在项目根目录（与 `package.json` 同级）创建一个名为 `.env.local` 的文件。

**如何创建**：

- **Windows**：新建文本文件，重命名为 `.env.local`（需要显示文件扩展名）
- **macOS/Linux**：在终端执行 `touch .env.local`

#### 4.2 配置数据库连接

在 `.env.local` 文件中添加以下内容：

```env
# 数据库连接字符串
DATABASE_URL=mssql://用户名:密码@服务器地址:端口/数据库名?encrypt=true&trustServerCertificate=true
```

**示例配置**：

**本地 SQL Server (Windows)**：

```env
DATABASE_URL=mssql://sa:YourPassword123@localhost:1433/CampusCanteen?encrypt=true&trustServerCertificate=true
```

**Docker SQL Server (macOS)**：

```env
DATABASE_URL=mssql://sa:YourStrong@Password@localhost:1433/CampusCanteen?encrypt=true&trustServerCertificate=true
```

**参数说明**：

- `sa`：SQL Server 管理员账户（或你创建的其他用户）
- `YourPassword123`：替换为你的数据库密码
- `localhost`：本地数据库（如果是远程服务器，改为服务器 IP）
- `1433`：SQL Server 默认端口
- `CampusCanteen`：你创建的数据库名称

---

### 第五步：安装项目依赖

在项目根目录打开终端/命令提示符，执行：

```bash
npm install
```

**这一步会做什么**：

- 下载项目所需的所有第三方库（如 React、Next.js、mssql 等）
- 可能需要 3-10 分钟，取决于网络速度
- 完成后会在项目中生成 `node_modules` 文件夹

**如果速度很慢**，可以使用国内镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

---

### 第六步：启动开发服务器

安装完成后，执行：

```bash
npm run dev
```

**成功的标志**：
你会看到类似这样的提示：

```
  ▲ Next.js 15.5.6
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

**访问项目**：

1. 打开浏览器
2. 访问 [http://localhost:3000](http://localhost:3000)
3. 你应该能看到项目首页！

---

### 第七步：测试功能

#### 登录测试

**学生登录**：

- 访问 `/student`
- 学号：根据你数据库中的学生数据
- 密码规则：`ysu + 学号后6位`
- 例如：学号 `202101010001`，密码为 `ysu010001`

**商家登录**：

- 访问 `/merchant`
- 档口编号：根据你数据库中的商家数据
- 密码规则：`ysu + 档口编号`
- 例如：档口编号 `01101`，密码为 `ysu01101`

---

## 📁 项目结构

```
campus-canteen/
├── app/                      # Next.js 应用路由
│   ├── api/                  # 后端 API 接口
│   │   ├── locations/        # 位置查询
│   │   ├── orders/           # 订单管理
│   │   ├── student/          # 学生相关
│   │   └── merchant/         # 商家相关
│   ├── student/              # 学生页面
│   ├── merchant/             # 商家页面
│   └── order/                # 订单页面
├── components/               # React 组件
├── database/                 # 数据库建表脚本
├── src/
│   ├── lib/                  # 工具函数
│   │   └── db.ts            # 数据库连接池
│   ├── store/               # 状态管理
│   └── types/               # TypeScript 类型定义
├── public/                   # 静态资源
├── .env.local               # 环境变量（需自己创建）
├── package.json             # 项目依赖配置
└── README.md                # 本文件
```

---

## 🔧 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器（需先执行 build）
npm start

# 代码检查
npm run lint
```
