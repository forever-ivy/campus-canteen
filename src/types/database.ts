// Global database type definitions derived from the SQL files in /database.

export type OrderStatus = "待支付" | "已完成";

export type PaymentMethod = "微信" | "支付宝" | "校园卡";

export type StudentSex = "M" | "F";

export interface Student {
  studentId: string;
  name: string;
  sex: StudentSex;
  major: string;
  balance: number;
  points: number;
}

export interface Merchant {
  merchantId: string;
  name: string;
  location: string | null;
  manager: string | null;
  phone: string | null;
}

export type MerchantLocation = NonNullable<Merchant["location"]>;

export interface Dish {
  dishId: string;
  name: string;
  price: number;
  merchantId: string;
}

export interface Stock {
  stockId: string;
  merchantId: string;
  dishId: string;
  inQuantity: number;
  outQuantity: number;
  remainingQuantity: number;
  updateTime: Date;
}

export interface Order {
  orderId: string;
  studentId: string;
  merchantId: string;
  orderTime: Date;
  totalAmount: number;
  status: OrderStatus;
}

export interface PaymentRecord {
  payId: string;
  orderId: string;
  payMethod: PaymentMethod;
  amount: number;
  payTime: Date;
}

export interface OrderDetail {
  orderId: string;
  dishId: string;
  quantity: number;
}

export interface OrderPaymentEntry {
  payId: string;
  payMethod: PaymentMethod | string;
  amount: number;
  payTime: string | null;
}

export interface OrderDetailItem {
  orderId: string;
  dishId: string;
  dishName: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDetailData {
  orderId: string;
  studentId: string;
  studentName: string;
  merchantId: string;
  merchantName: string;
  location: Merchant["location"];
  totalAmount: number;
  status: OrderStatus;
  orderTime: string | null;
  payment: OrderPaymentEntry[];
  details: OrderDetailItem[];
}

export interface OrderTableRow {
  id: Order["orderId"];
  student: Student["name"];
  store: Merchant["name"];
  location: Merchant["location"];
  amount: Order["totalAmount"];
  orderedAt: string | null;
  status: OrderStatus;
}

export interface DatabaseSchema {
  Student: Student;
  Merchant: Merchant;
  Dish: Dish;
  Stock: Stock;
  Order: Order;
  PaymentMethod: PaymentRecord;
  OrderDetail: OrderDetail;
}
