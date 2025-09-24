import {
  ApiResponse,
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UsageStats,
  BillingRecord,
  Plan,
  PlanGroup,
  ApiKey,
  ApiError,
  UsageLog,
  DailySummary,
  UsageFilter,
  PaginatedResponse,
  Notification,
  NotificationFilter
} from './types';

// API配置 - 使用本地API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// API客户端类
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.initializeToken();
  }

  // 初始化token
  private initializeToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    }
  }

  // 设置认证token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }

  // 移除认证token
  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  // 获取请求头
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // 处理API响应
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;

    if (isJson) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const error: ApiError = new Error(data.error?.message || `HTTP ${response.status}`) as ApiError;
      error.code = data.error?.code || 'unknown_error';
      error.status = response.status;
      error.details = data.error?.details;
      throw error;
    }

    return data;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 401) {
        // Token过期，尝试刷新
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // 重试原请求
          const retryConfig: RequestInit = {
            ...options,
            headers: {
              ...this.getHeaders(),
              ...options.headers,
            },
          };
          const response = await fetch(url, retryConfig);
          return await this.handleResponse<T>(response);
        } else {
          // 刷新失败，清除token并抛出错误
          this.removeToken();
        }
      }
      throw error;
    }
  }

  // 刷新token
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem(REFRESH_TOKEN_KEY)
        : null;

      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refresh_token);
        }
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // GET请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 认证相关API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse['data']>('/auth/login', credentials);

    if (response.success && response.data) {
      this.setToken(response.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
      }
    }

    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse['data']>('/auth/register', data);

    if (response.success && response.data) {
      this.setToken(response.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
      }
    }

    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/auth/me');
  }

  // 用户管理API
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>('/user/profile', data);
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<void>> {
    return this.post<void>('/user/change-password', data);
  }

  // 使用统计API
  async getUsageStats(period: 'day' | 'week' | 'month' = 'month'): Promise<ApiResponse<UsageStats>> {
    return this.get<UsageStats>(`/usage/stats?period=${period}`);
  }

  // 用户订阅信息API
  async getUserSubscription(): Promise<ApiResponse<any>> {
    return this.get<any>('/user/subscription');
  }

  // 账单API
  async getBillingRecords(page: number = 1, limit: number = 20): Promise<ApiResponse<BillingRecord[]>> {
    return this.get<BillingRecord[]>(`/billing/records?page=${page}&limit=${limit}`);
  }

  // 套餐API
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    return this.get<Plan[]>('/plans');
  }

  async getGroupedPlans(): Promise<ApiResponse<PlanGroup[]>> {
    return this.get<PlanGroup[]>('/plans?grouped=true');
  }

  async getPlansByCategory(categoryId: string): Promise<ApiResponse<Plan[]>> {
    return this.get<Plan[]>(`/plans?category=${categoryId}`);
  }

  async subscribePlan(planId: string, paymentMethod: string): Promise<ApiResponse<void>> {
    return this.post<void>('/billing/subscribe', { plan_id: planId, payment_method: paymentMethod });
  }

  // API密钥管理
  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return this.get<ApiKey[]>('/api-keys');
  }

  async createApiKey(name: string, permissions: string[] = []): Promise<ApiResponse<ApiKey>> {
    return this.post<ApiKey>('/api-keys', { name, permissions });
  }

  async deleteApiKey(keyId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api-keys/${keyId}`);
  }

  async regenerateApiKey(keyId: string): Promise<ApiResponse<ApiKey>> {
    return this.post<ApiKey>(`/api-keys/${keyId}/regenerate`);
  }

  // 使用记录相关方法
  async getUsageLogs(filter: UsageFilter = {}): Promise<ApiResponse<PaginatedResponse<UsageLog>>> {
    const params = new URLSearchParams();
    if (filter.model) params.append('model', filter.model);
    if (filter.status) params.append('status', filter.status);
    if (filter.startTime) params.append('start_time', filter.startTime);
    if (filter.endTime) params.append('end_time', filter.endTime);
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('page_size', filter.pageSize.toString());

    const url = `/usage/logs${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<PaginatedResponse<UsageLog>>(url);
  }

  async getDailySummaries(filter: { startDate?: string; endDate?: string; page?: number; pageSize?: number } = {}): Promise<ApiResponse<PaginatedResponse<DailySummary>>> {
    const params = new URLSearchParams();
    if (filter.startDate) params.append('start_date', filter.startDate);
    if (filter.endDate) params.append('end_date', filter.endDate);
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('page_size', filter.pageSize.toString());

    const url = `/usage/daily${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<PaginatedResponse<DailySummary>>(url);
  }

  // 通知相关方法
  async getNotifications(filter: NotificationFilter = {}): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const params = new URLSearchParams();
    if (filter.isRead !== undefined) params.append('is_read', filter.isRead.toString());
    if (filter.type) params.append('type', filter.type);
    if (filter.priority) params.append('priority', filter.priority);
    if (filter.search) params.append('search', filter.search);
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('page_size', filter.pageSize.toString());

    const url = `/notifications${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<PaginatedResponse<Notification>>(url);
  }

  async createNotification(data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
    targetUserId?: string;
  }): Promise<ApiResponse<Notification>> {
    return this.post<Notification>('/notifications', data);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    return this.put<Notification>(`/notifications/${notificationId}`, { isRead: true });
  }

  async markNotificationAsUnread(notificationId: string): Promise<ApiResponse<Notification>> {
    return this.put<Notification>(`/notifications/${notificationId}`, { isRead: false });
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/notifications/${notificationId}`);
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<{ success: boolean; updatedCount: number }>> {
    return this.post<{ success: boolean; updatedCount: number }>('/notifications/mark-all-read');
  }

  async clearAllNotifications(): Promise<ApiResponse<{ success: boolean; deletedCount: number }>> {
    return this.delete<{ success: boolean; deletedCount: number }>('/notifications/clear-all');
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
    return this.get<{ count: number }>('/notifications/unread-count');
  }

  // 管理员通知相关方法
  async getAdminNotifications(filter: {
    page?: number;
    pageSize?: number;
    userId?: string;
    type?: string;
    priority?: string;
    search?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<Notification & { user: { username: string; email: string } }>>> {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('page_size', filter.pageSize.toString());
    if (filter.userId) params.append('user_id', filter.userId);
    if (filter.type) params.append('type', filter.type);
    if (filter.priority) params.append('priority', filter.priority);
    if (filter.search) params.append('search', filter.search);

    const url = `/admin/notifications${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<PaginatedResponse<Notification & { user: { username: string; email: string } }>>(url);
  }

  async createAdminNotification(data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
    targetUsers?: string[];
    sendToAll?: boolean;
  }): Promise<ApiResponse<{ success: boolean; createdCount: number; targetCount: number }>> {
    return this.post<{ success: boolean; createdCount: number; targetCount: number }>('/admin/notifications', data);
  }

  async getAllUsers(): Promise<ApiResponse<Array<{ id: string; username: string; email: string; status: string; createdAt: string }>>> {
    return this.get<Array<{ id: string; username: string; email: string; status: string; createdAt: string }>>('/admin/notifications/users');
  }

  // 通知规则管理相关方法
  async getNotificationRules(filter?: {
    type?: string;
    enabled?: boolean;
  }): Promise<ApiResponse<Array<any>>> {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    if (filter?.enabled !== undefined) params.append('enabled', filter.enabled.toString());
    const url = `/admin/notification-rules${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<Array<any>>(url);
  }

  async getNotificationRule(id: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/admin/notification-rules/${id}`);
  }

  async createNotificationRule(data: {
    name: string;
    description?: string;
    type: string;
    triggerCondition: any;
    templateId: string;
    targetScope?: string;
    targetUsers?: string[];
    isEnabled?: boolean;
    cooldownMinutes?: number;
  }): Promise<ApiResponse<any>> {
    return this.post<any>('/admin/notification-rules', data);
  }

  async updateNotificationRule(id: string, data: {
    name: string;
    description?: string;
    type: string;
    triggerCondition: any;
    templateId: string;
    targetScope: string;
    targetUsers?: string[];
    isEnabled: boolean;
    cooldownMinutes: number;
  }): Promise<ApiResponse<any>> {
    return this.put<any>(`/admin/notification-rules/${id}`, data);
  }

  async deleteNotificationRule(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/admin/notification-rules/${id}`);
  }

  async toggleNotificationRule(id: string): Promise<ApiResponse<any>> {
    return this.put<any>(`/admin/notification-rules/${id}/toggle`, {});
  }

  // 通知模板管理相关方法
  async getNotificationTemplates(): Promise<ApiResponse<Array<any>>> {
    return this.get<Array<any>>('/admin/notification-templates');
  }

  async createNotificationTemplate(data: {
    name: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
    variables?: any;
  }): Promise<ApiResponse<any>> {
    return this.post<any>('/admin/notification-templates', data);
  }

  // 通知规则日志相关方法
  async getNotificationRuleLogs(filter?: {
    page?: number;
    pageSize?: number;
    ruleId?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.pageSize) params.append('page_size', filter.pageSize.toString());
    if (filter?.ruleId) params.append('rule_id', filter.ruleId);
    if (filter?.success !== undefined) params.append('success', filter.success.toString());
    if (filter?.startDate) params.append('start_date', filter.startDate);
    if (filter?.endDate) params.append('end_date', filter.endDate);
    const url = `/admin/notification-rule-logs${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<any>(url);
  }

  // 通知触发相关方法
  async triggerNotification(triggerType: string, triggerData: any): Promise<ApiResponse<any>> {
    return this.post<any>('/admin/notification-trigger', { triggerType, triggerData });
  }

  async testNotificationTrigger(testType: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/admin/notification-trigger?test=${testType}`);
  }

  // 临时提额相关方法
  async requestTemporaryQuota(): Promise<ApiResponse<{
    success: boolean;
    quota_id: string;
    amount: number;
    currency: string;
    expires_at: string;
    total_temporary_quota: number;
    message: string;
  }>> {
    return this.post<{
      success: boolean;
      quota_id: string;
      amount: number;
      currency: string;
      expires_at: string;
      total_temporary_quota: number;
      message: string;
    }>('/user/temporary-quota');
  }

  async getTemporaryQuotaInfo(): Promise<ApiResponse<{
    today_temp_quota: number;
    temp_quota_records: any[];
    can_use_today: boolean;
    daily_limit_per_increase: number;
    max_increases_per_day: number;
  }>> {
    return this.get<{
      today_temp_quota: number;
      temp_quota_records: any[];
      can_use_today: boolean;
      daily_limit_per_increase: number;
      max_increases_per_day: number;
    }>('/user/temporary-quota');
  }
}

// 创建默认实例
export const apiClient = new ApiClient();

// 导出类型和错误处理工具
export { ApiClient };

// 错误处理工具函数
export const handleApiError = (error: any): string => {
  if (error instanceof Error && 'code' in error) {
    const apiError = error as ApiError;

    // 根据错误代码返回用户友好的消息
    switch (apiError.code) {
      case 'invalid_credentials':
        return '邮箱或密码错误';
      case 'user_exists':
        return '该邮箱已被注册';
      case 'invalid_email':
        return '邮箱格式不正确';
      case 'weak_password':
        return '密码强度不足，请使用至少8位字符，包含字母和数字';
      case 'rate_limit_exceeded':
        return '请求过于频繁，请稍后再试';
      case 'insufficient_balance':
        return '余额不足';
      case 'plan_not_found':
        return '套餐不存在';
      case 'payment_failed':
        return '支付失败，请检查支付方式';
      case 'network_error':
        return '网络连接失败，请检查网络';
      default:
        return apiError.message || '操作失败，请稍后重试';
    }
  }

  return '未知错误，请稍后重试';
};

