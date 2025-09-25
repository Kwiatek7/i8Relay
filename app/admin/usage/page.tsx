'use client';

import { useEffect, useState } from 'react';

interface UsageOverview {
  total_requests: number;
  active_users: number;
  total_tokens: number;
  total_cost: number;
  success_rate: string;
  unique_models: number;
  request_growth: number;
  user_growth: number;
  cost_growth: number;
}

interface ModelStat {
  model: string;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

interface DailyTrend {
  date: string;
  requests: number;
  users: number;
  cost: number;
}

interface TopUser {
  id: string;
  username: string;
  email: string;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

interface UsageStats {
  period: string;
  overview: UsageOverview;
  model_stats: ModelStat[];
  daily_trend: DailyTrend[];
  top_users: TopUser[];
}

interface UsageLog {
  id: string;
  user_id: string;
  username: string;
  email: string;
  model: string;
  prompt_type: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  cost_formatted: string;
  status: string;
  error_message: string | null;
  ip_address: string;
  created_at: string;
  created_at_formatted: string;
}

interface UsageLogsResponse {
  data: UsageLog[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export default function AdminUsage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  // 查询参数
  const [period, setPeriod] = useState('month');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 分页信息
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchUsageStats();
  }, [period]);

  useEffect(() => {
    fetchUsageLogs();
  }, [page, filterUserId, filterModel, filterStatus, startDate, endDate]);

  const fetchUsageStats = async () => {
    setStatsLoading(true);
    try {
      // 确保使用本地API - 强制使用相对路径
      const response = await fetch(`/api/admin/usage/stats?period=${period}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('获取使用统计失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsageLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filterUserId) params.append('user_id', filterUserId);
      if (filterModel) params.append('model', filterModel);
      if (filterStatus) params.append('status', filterStatus);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      // 确保使用本地API - 强制使用相对路径
      const response = await fetch(`/api/admin/usage/logs?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setLogs(result.data.data || []);
          setPagination({
            page: result.data.pagination?.page || 1,
            limit: result.data.pagination?.limit || 20,
            total: result.data.pagination?.total || 0,
            totalPages: result.data.pagination?.totalPages || 0
          });
        } else {
          setLogs([]);
          setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
        }
      } else {
        console.error('API返回错误:', response.status, response.statusText);
        setLogs([]);
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('获取使用日志失败:', error);
      setLogs([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
    } finally {
      setLogsLoading(false);
    }
  };

  const getStatusColor = (status: number | string) => {
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    if (statusCode >= 200 && statusCode < 300) {
      return 'text-green-600 bg-green-100';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'text-red-600 bg-red-100';
    } else if (statusCode >= 500) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: number | string) => {
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    if (statusCode >= 200 && statusCode < 300) {
      return '成功';
    } else if (statusCode >= 400 && statusCode < 500) {
      return '客户端错误';
    } else if (statusCode >= 500) {
      return '服务器错误';
    } else {
      return statusCode.toString();
    }
  };

  const formatGrowth = (growth: number) => {
    const safeGrowth = parseFloat(String(growth || 0));
    const sign = safeGrowth > 0 ? '+' : '';
    return `${sign}${safeGrowth.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">使用情况统计</h1>
        <p className="text-gray-600">系统整体使用情况和详细日志</p>
      </div>

      {/* 时间周期选择 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="day"
              checked={period === 'day'}
              onChange={(e) => setPeriod(e.target.value)}
              className="mr-2"
            />
            最近24小时
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="week"
              checked={period === 'week'}
              onChange={(e) => setPeriod(e.target.value)}
              className="mr-2"
            />
            最近7天
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="month"
              checked={period === 'month'}
              onChange={(e) => setPeriod(e.target.value)}
              className="mr-2"
            />
            最近30天
          </label>
        </div>
      </div>

      {/* 统计概览 */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 总请求数 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总请求数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.overview.total_requests.toLocaleString()}
                </p>
                <p className={`text-sm ${getGrowthColor(stats.overview.request_growth)}`}>
                  {formatGrowth(stats.overview.request_growth)} 较上期
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 活跃用户 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃用户</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.overview.active_users}
                </p>
                <p className={`text-sm ${getGrowthColor(stats.overview.user_growth)}`}>
                  {formatGrowth(stats.overview.user_growth)} 较上期
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 总Token数 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总Token数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.overview.total_tokens.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">成功率: {stats.overview.success_rate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 总成本 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总成本</p>
                <p className="text-3xl font-bold text-gray-900">
                  ¥{parseFloat(String(stats.overview.total_cost || 0)).toFixed(2)}
                </p>
                <p className={`text-sm ${getGrowthColor(stats.overview.cost_growth)}`}>
                  {formatGrowth(stats.overview.cost_growth)} 较上期
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模型使用统计和用户排行榜 */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 模型使用统计 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">模型使用统计</h3>
            <div className="space-y-3">
              {stats.model_stats.map((model, index) => (
                <div key={model.model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{model.model}</p>
                    <p className="text-xs text-gray-500">
                      {model.request_count} 次请求 · ¥{parseFloat(String(model.cost || 0)).toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {((parseFloat(String(model.input_tokens || 0)) + parseFloat(String(model.output_tokens || 0))) / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-gray-500">Tokens</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 用户排行榜 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户使用排行</h3>
            <div className="space-y-3">
              {stats.top_users.slice(0, 10).map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user.request_count}</p>
                    <p className="text-xs text-gray-500">¥{parseFloat(String(user.cost || 0)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 使用日志筛选 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">使用日志筛选</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户ID</label>
            <input
              type="text"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="用户ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">模型</label>
            <input
              type="text"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="模型名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部状态</option>
              <option value="success">成功</option>
              <option value="error">错误</option>
              <option value="timeout">超时</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => {
              setFilterUserId('');
              setFilterModel('');
              setFilterStatus('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            清除筛选
          </button>
        </div>
      </div>

      {/* 使用日志列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            使用日志 ({pagination.total} 条记录)
          </h3>
        </div>

        {logsLoading ? (
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成本</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(logs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.username}</div>
                        <div className="text-sm text-gray-500">{log.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>入: {log.input_tokens?.toLocaleString() || 0}</div>
                        <div>出: {log.output_tokens?.toLocaleString() || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.cost_formatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {getStatusText(log.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.created_at_formatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示 {((pagination.page - 1) * pagination.limit) + 1} 到 {Math.min(pagination.page * pagination.limit, pagination.total)} 项，共 {pagination.total} 项
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                  {page}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}