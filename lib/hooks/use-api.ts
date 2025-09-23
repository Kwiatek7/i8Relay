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

      const response = await apiClient.getNotifications(filter);

      if (response.success && response.data !== undefined) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || '获取通知失败');
      }
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
      const response = await apiClient.markNotificationAsRead(notificationId);
      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.error?.message || '标记已读失败');
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 标记为未读
  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      const response = await apiClient.markNotificationAsUnread(notificationId);
      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.error?.message || '标记未读失败');
      }
    } catch (error) {
      console.error('标记未读失败:', error);
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 删除通知
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await apiClient.deleteNotification(notificationId);
      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.error?.message || '删除通知失败');
      }
    } catch (error) {
      console.error('删除通知失败:', error);
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 批量标记为已读
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiClient.markAllNotificationsAsRead();
      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.error?.message || '批量标记失败');
      }
    } catch (error) {
      console.error('批量标记失败:', error);
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 清空所有通知
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await apiClient.clearAllNotifications();
      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.error?.message || '清空通知失败');
      }
    } catch (error) {
      console.error('清空通知失败:', error);
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
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
      const response = await apiClient.getUnreadNotificationCount();

      if (response.success && response.data) {
        setCount(response.data.count);
      } else {
        throw new Error(response.error?.message || '获取未读数量失败');
      }
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