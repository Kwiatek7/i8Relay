import { useState, useEffect, useCallback } from 'react';
import {
  ApiResponse,
  UsageLog,
  DailySummary,
  UsageFilter,
  PaginatedResponse,
  Notification,
  NotificationFilter
} from '../types';
import { apiClient, handleApiError } from '../api-client';

// 通用API钩子状态类型
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// 通用API钩子
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();

      if (response.success && response.data !== undefined) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || '数据获取失败');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

// 使用统计钩子
export function useUsageStats(period: 'day' | 'week' | 'month' = 'month') {
  return useApi(
    () => apiClient.getUsageStats(period),
    [period]
  );
}

// 用户订阅信息钩子
export function useUserSubscription() {
  return useApi(
    () => apiClient.getUserSubscription(),
    []
  );
}

// 账单记录钩子
export function useBillingRecords(page: number = 1, limit: number = 20) {
  return useApi(
    () => apiClient.getBillingRecords(page, limit),
    [page, limit]
  );
}

// 套餐列表钩子
export function usePlans() {
  return useApi(
    () => apiClient.getPlans(),
    []
  );
}

// 分组套餐钩子
export function useGroupedPlans() {
  return useApi(
    () => apiClient.getGroupedPlans(),
    []
  );
}

// 根据分组获取套餐钩子
export function usePlansByCategory(categoryId: string) {
  return useApi(
    () => apiClient.getPlansByCategory(categoryId),
    [categoryId]
  );
}

// API密钥列表钩子
export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getApiKeys();

      if (response.success && response.data) {
        setApiKeys(response.data);
      } else {
        throw new Error(response.error?.message || '获取API密钥失败');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createApiKey = useCallback(async (name: string) => {
    try {
      const response = await apiClient.createApiKey(name);
      if (response.success && response.data) {
        setApiKeys(prev => [...prev, response.data]);
        return { success: true };
      } else {
        throw new Error(response.error?.message || '创建API密钥失败');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteApiKey = useCallback(async (keyId: string) => {
    try {
      const response = await apiClient.deleteApiKey(keyId);
      if (response.success) {
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
        return { success: true };
      } else {
        throw new Error(response.error?.message || '删除API密钥失败');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      return { success: false, error: errorMessage };
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return {
    apiKeys,
    loading,
    error,
    refresh: fetchApiKeys,
    createApiKey,
    deleteApiKey
  };
}

// 分页钩子
export function usePagination(
  initialPage: number = 1,
  initialLimit: number = 20
) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // 重置到第一页
  }, []);

  return {
    page,
    limit,
    nextPage,
    prevPage,
    goToPage,
    changeLimit
  };
}

// 异步操作钩子
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
}

// 使用记录hooks
export function useUsageLogs(filter: UsageFilter = {}) {
  const [data, setData] = useState<PaginatedResponse<UsageLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getUsageLogs(filter);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || '获取使用记录失败');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    filter.model,
    filter.status,
    filter.startTime,
    filter.endTime,
    filter.page,
    filter.pageSize
  ]);

  useEffect(() => {
    fetchUsageLogs();
  }, [fetchUsageLogs]);

  return {
    data,
    loading,
    error,
    refresh: fetchUsageLogs
  };
}

// 日汇总hooks
export function useDailySummaries(filter: { startDate?: string; endDate?: string; page?: number; pageSize?: number } = {}) {
  const [data, setData] = useState<PaginatedResponse<DailySummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailySummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getDailySummaries(filter);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || '获取日汇总失败');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    filter.startDate,
    filter.endDate,
    filter.page,
    filter.pageSize
  ]);

  useEffect(() => {
    fetchDailySummaries();
  }, [fetchDailySummaries]);

  return {
    data,
    loading,
    error,
    refresh: fetchDailySummaries
  };
}

// 通知hooks - 获取通知列表
export function useNotifications(filter: NotificationFilter = {}) {
  const [data, setData] = useState<PaginatedResponse<Notification> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 模拟API调用 - 在实际项目中应该调用真实API
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: '账户余额不足',
          message: '您的账户余额仅剩 $5.23，建议及时充值以避免服务中断。',
          type: 'billing',
          isRead: false,
          createdAt: '2024-12-23T10:30:00Z',
          updatedAt: '2024-12-23T10:30:00Z',
          actionUrl: '/dashboard/billing',
          priority: 'high',
          userId: 'user1'
        },
        {
          id: '2',
          title: '系统维护通知',
          message: '系统将于今晚 22:00-24:00 进行例行维护，期间服务可能会短暂中断。',
          type: 'system',
          isRead: false,
          createdAt: '2024-12-23T09:15:00Z',
          updatedAt: '2024-12-23T09:15:00Z',
          priority: 'medium',
          userId: 'user1'
        },
        {
          id: '3',
          title: '密码安全提醒',
          message: '检测到您的密码已使用超过 90 天，建议及时更换密码确保账户安全。',
          type: 'security',
          isRead: true,
          createdAt: '2024-12-22T16:45:00Z',
          updatedAt: '2024-12-22T16:45:00Z',
          actionUrl: '/dashboard/profile',
          priority: 'medium',
          userId: 'user1'
        },
        {
          id: '4',
          title: 'API 密钥即将过期',
          message: '您的 API 密钥将在 7 天后过期，请及时更新以确保服务正常使用。',
          type: 'warning',
          isRead: true,
          createdAt: '2024-12-22T14:20:00Z',
          updatedAt: '2024-12-22T14:20:00Z',
          actionUrl: '/dashboard/profile',
          priority: 'high',
          userId: 'user1'
        },
        {
          id: '5',
          title: '新功能上线',
          message: '我们推出了全新的使用统计功能，现在您可以更详细地了解API使用情况。',
          type: 'info',
          isRead: true,
          createdAt: '2024-12-21T11:00:00Z',
          updatedAt: '2024-12-21T11:00:00Z',
          actionUrl: '/dashboard/usage',
          priority: 'low',
          userId: 'user1'
        },
        {
          id: '6',
          title: '账单支付成功',
          message: '您的月度账单 $29.99 已支付成功，感谢您的使用。',
          type: 'success',
          isRead: true,
          createdAt: '2024-12-20T08:30:00Z',
          updatedAt: '2024-12-20T08:30:00Z',
          actionUrl: '/dashboard/billing',
          priority: 'low',
          userId: 'user1'
        }
      ];

      // 应用筛选
      let filteredNotifications = mockNotifications;

      if (filter.isRead !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.isRead === filter.isRead);
      }

      if (filter.type && filter.type !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => n.type === filter.type);
      }

      if (filter.priority && filter.priority !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => n.priority === filter.priority);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredNotifications = filteredNotifications.filter(n =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
        );
      }

      // 分页
      const page = filter.page || 1;
      const pageSize = filter.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredNotifications.slice(startIndex, endIndex);

      const response: PaginatedResponse<Notification> = {
        data: paginatedData,
        total: filteredNotifications.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredNotifications.length / pageSize)
      };

      setData(response);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    filter.isRead,
    filter.type,
    filter.priority,
    filter.startDate,
    filter.endDate,
    filter.page,
    filter.pageSize,
    filter.search
  ]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    data,
    loading,
    error,
    refresh: fetchNotifications
  };
}

// 通知操作hooks
export function useNotificationActions() {
  // 标记为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // 模拟API调用
      console.log('标记通知为已读:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('标记已读失败:', error);
      return { success: false, error: '操作失败' };
    }
  }, []);

  // 标记为未读
  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      // 模拟API调用
      console.log('标记通知为未读:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('标记未读失败:', error);
      return { success: false, error: '操作失败' };
    }
  }, []);

  // 删除通知
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // 模拟API调用
      console.log('删除通知:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('删除通知失败:', error);
      return { success: false, error: '删除失败' };
    }
  }, []);

  // 批量标记为已读
  const markAllAsRead = useCallback(async () => {
    try {
      // 模拟API调用
      console.log('批量标记为已读');
      return { success: true };
    } catch (error) {
      console.error('批量标记失败:', error);
      return { success: false, error: '操作失败' };
    }
  }, []);

  // 清空所有通知
  const clearAllNotifications = useCallback(async () => {
    try {
      // 模拟API调用
      console.log('清空所有通知');
      return { success: true };
    } catch (error) {
      console.error('清空通知失败:', error);
      return { success: false, error: '清空失败' };
    }
  }, []);

  return {
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    clearAllNotifications
  };
}

// 获取未读通知数量
export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      // 模拟API调用 - 在实际项目中应该调用真实API
      // 这里应该返回未读通知的数量
      setCount(3); // 模拟3个未读通知
    } catch (error) {
      console.error('获取未读数量失败:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    count,
    loading,
    refresh: fetchUnreadCount
  };
}