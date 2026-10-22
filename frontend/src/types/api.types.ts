export type UserRole = 'USER' | 'ADMIN' | 'CUSTOMER' | 'user' | 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  avatarUrl?: string;
  createdAt: string;
  email_verified_at?: string | null;
}

export type BackendUser = Pick<User, 'id' | 'email' | 'name' | 'role'> & {
  avatar?: string | null;
  created_at?: string;
  updated_at?: string;
  email_verified_at?: string | null;
};

export interface AuthResponse {
  user: BackendUser;
  accessToken: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  categoryId?: string;
  stock: number;
  rating: number;
  numReviews: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string; // Cart item unique ID
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

export interface Cart {
  items: CartItem[];
  itemsCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: string;
}

export interface OrderSummary {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderDetailItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface CartMutationResult {
  message?: string;
  data: {
    id: string;
    cart_id?: string;
    product_id?: string;
    quantity?: number;
  };
}

// DTO Requests
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export interface UpdateUserResponse {
  message: string;
  data: {
    name: string;
    email: string;
    updatedAt?: string;
  };
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateOrderRequest {
  products: { items: { productId: string; quantity: number }[] };
  shipping_address: {
    fullName: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
  };
  paymentMethod: string;
}

export interface CreateOrderResponse {
  message: string;
  data: {
    orderId: string;
    items: {
      id: string;
      order_id: string;
      product_id: string;
      quantity: number;
      price: number | string;
    }[];
  };
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

// Queries
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// General API Responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  salesOverTime: { date: string; sales: number }[];
  categorySales: { name: string; value: number }[];
}
