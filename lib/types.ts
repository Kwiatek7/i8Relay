// 用户相关类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  plan: string;
  balance: number;
  apiKey: string;
  avatar?: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'banned' | 'pending';
  phone?: string;
  company?: string;
  total_requests?: number;
  total_tokens?: number;
  total_cost?: number;
  last_login_at?: string;
  plan_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// 认证相关类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  company?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refresh_token: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// API 响应通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    request_id: string;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

// 套餐相关类型
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // 天数
  billing_period: string;
  features: string[];
  requests_limit: number;
  tokens_limit: number;
  models: string[];
  priority_support: boolean;
  is_popular: boolean;
  is_active: boolean;
  category_id?: string;
  category_name?: string;
  icon?: string;
}

// 套餐分组类型
export interface PlanGroup {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_featured: boolean;
  plans: Plan[];
}

// 使用统计类型
export interface UsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  daily_requests: Array<{
    date: string;
    requests: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    cacheCreated: number;
    cacheRead: number;
    totalTokens: number;
    cost: number;
  }>;
  model_usage: Array<{
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

// 账单类型
export interface BillingRecord {
  id: string;
  type: 'charge' | 'usage' | 'refund';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// API 密钥类型
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used: string | null;
  created_at: string;
  is_active: boolean;
}

// 错误类型
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, any>;
}

// 使用记录相关类型
export interface UsageLog {
  id: string;
  timestamp: string;
  model: string;
  method: string;
  url: string;
  status: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  userAgent: string;
}

export interface DailySummary {
  date: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgDuration: number;
}

export interface UsageFilter {
  model?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 通知相关类型
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'billing' | 'security' | 'info' | 'warning' | 'success';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  userId: string;
}

export interface NotificationFilter {
  isRead?: boolean;
  type?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}