// 订单状态枚举（与数据库 CHECK 约束一致）
export type OrderStatus = "待支付" | "已支付" | "已取餐" | "已完成" | "已退款";

// 支付方式枚举（与数据库 CHECK 约束一致）
export type PayMethod = "微信" | "支付宝" | "校园卡" | "现金";

// 为可读性，金额字段统一用格式化后的货币字符串（例如：¥22.00）
export type CurrencyString = string;

// 单条支付记录
export interface PaymentItem {
  payId: string;
  amount: CurrencyString;
  payMethod: PayMethod | string;
  payTime: string | null;
}

// 单条订单明细
export interface OrderDetailItem {
  dishId: number;
  dishName: string | null;
  price: CurrencyString;
  quantity: number;
  subtotal: CurrencyString;
}

// 列表中的单个订单项（对应你的 items 映射）
export interface OrderListItem {
  orderId: string;
  studentId: number;
  studentName: string | null;
  merchantId: number;
  merchantName: string | null;
  orderTime: string; // ISO 字符串
  status: OrderStatus | string;
  totalAmount: CurrencyString;
  payment: PaymentItem[];
  details: OrderDetailItem[];
}

// /api/orders 返回结构
export interface OrderListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: OrderListItem[];
}

// /api/orders/{id} 返回结构
export interface OrderDetailResponse {
  order: OrderListItem;
}
