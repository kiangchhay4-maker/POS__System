// Core domain types matching the backend API

export type UserRole = 'STAFF' | 'ADMIN' | 'CUSTOMER';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'KHQR' | 'CARD';

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'UNKNOWN';

export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export type ProductCategory = 
  | 'COFFEE'
  | 'COFFEE_BEANS'
  | 'ESPRESSO'
  | 'TEA'
  | 'COLD_BREW'
  | 'PASTRY'
  | 'SNACK'
  | 'MERCHANDISE';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: ProductCategory | string;
  categoryId?: string;
  categoryName?: string;
  currency?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  available: boolean;
  stockQuantity?: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category: ProductCategory | string;
  price: number;
  currency?: string;
  available?: boolean;
  initialStock?: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: ProductCategory | string;
  price?: number;
  available?: boolean;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  qrCode?: string;
  receiptNumber?: string;
  createdAt: string;
  processedAt?: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  status: ShiftStatus;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashSales: number;
  cashRefunds: number;
  cashIn: number;
  cashOut: number;
  difference?: number;
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
}

export interface Discount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string;
}

// API Request/Response types

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface CreateOrderRequest {
  customerId?: string;
  orderType: OrderType;
  items: {
    productId: string;
    quantity: number;
    notes?: string;
  }[];
  discountId?: string;
  notes?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  amountReceived?: number;
  idempotencyKey: string;
}

export interface OpenShiftRequest {
  openingCash: number;
}

export interface CloseShiftRequest {
  closingCash: number;
  notes?: string;
}

export interface RefundRequest {
  orderId: string;
  items: {
    orderItemId: string;
    quantity: number;
  }[];
  reason: string;
}

// Error response type
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
