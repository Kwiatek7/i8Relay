'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  User,
  Server,
  CreditCard,
  Shield,
  Bell,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  userId?: string;
  userEmail?: string;
  accountId?: string;
  metadata?: Record<string, any>;
}

interface LogResponse {
  logs: LogEntry[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    pages: number;
  };
  categories: string[];
  levels: string[];
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
    pages: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  // 过滤条件
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    startDate: '',
    endDate: '',
    userId: '',
    accountId: '',
    search: ''
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // 获取日志数据
  useEffect(() => {
    fetchLogs();
  }, [pagination.current, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.level && { level: filters.level }),
        ...(filters.category && { category: filters.category }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.accountId && { accountId: filters.accountId })
      });

      const response = await fetch(`/api/admin/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        const logData = data.data as LogResponse;
        setLogs(logData.logs);
        setPagination(logData.pagination);
        setCategories(logData.categories);
        setLevels(logData.levels);
      } else {
        console.error('获取日志失败:', data.message);
      }
    } catch (error) {
      console.error('获取日志请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      level: '',
      category: '',
      startDate: '',
      endDate: '',
      userId: '',
      accountId: '',
      search: ''
    });
  };

  const toggleRowExpansion = (logId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'admin':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'api':
        return <Server className="h-4 w-4 text-blue-500" />;
      case 'billing':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'system':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'health':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'auth':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'notification':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      admin: '管理员操作',
      api: 'API调用',
      billing: '计费记录',
      system: '系统事件',
      health: '健康检查',
      auth: '身份认证',
      notification: '通知系统'
    };
    return names[category] || category;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    // 导出日志功能
    const csvContent = [
      ['时间', '级别', '类别', '消息', '用户', '元数据'].join(','),
      ...logs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.userEmail || log.userId || '',
        log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-blue-600" />
          系统日志
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? '隐藏筛选' : '显示筛选'}
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            导出日志
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 过滤器 */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日志级别
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'info' ? '信息' :
                     level === 'warn' ? '警告' :
                     level === 'error' ? '错误' : '调试'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类别
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户ID
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="输入用户ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
      )}

      {/* 日志统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Info className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">信息日志</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'info').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">警告日志</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'warn').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">错误日志</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'error').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">总日志数</p>
              <p className="text-lg font-semibold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">加载日志中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">没有找到日志记录</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log.id} className="hover:bg-gray-50">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleRowExpansion(log.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          {getLevelIcon(log.level)}
                          {getCategoryIcon(log.category)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {getCategoryName(log.category)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            {log.userEmail && (
                              <span className="text-xs text-blue-600">
                                {log.userEmail}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-900 break-words">
                            {log.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center ml-4">
                        {expandedRows.has(log.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 展开的详情 */}
                  {expandedRows.has(log.id) && log.metadata && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      <div className="pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">详细信息:</h4>
                        <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示 {(pagination.current - 1) * pagination.pageSize + 1} 到{' '}
              {Math.min(pagination.current * pagination.pageSize, pagination.total)} 项，
              共 {pagination.total} 项
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: Math.max(1, prev.current - 1) }))}
                disabled={pagination.current <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">
                第 {pagination.current} 页，共 {pagination.pages} 页
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: Math.min(prev.pages, prev.current + 1) }))}
                disabled={pagination.current >= pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}