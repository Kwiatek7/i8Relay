"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useUsageLogs, useDailySummaries } from '../../../lib/hooks/use-api';
import { UsageFilter } from '../../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';


export default function UsagePage() {
  const [activeTab, setActiveTab] = useState('logs');

  // 请求明细筛选
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateTimeRange, setDateTimeRange] = useState({ start: '', end: '' });

  // 日汇总筛选
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // 构建筛选条件
  const logsFilter: UsageFilter = {
    model: modelFilter || undefined,
    status: statusFilter || undefined,
    startTime: dateTimeRange.start || undefined,
    endTime: dateTimeRange.end || undefined,
    page: currentPage,
    pageSize
  };

  const dailyFilter = {
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
    page: currentPage,
    pageSize
  };

  // 使用hooks获取数据
  const {
    data: logsData,
    loading: logsLoading,
    error: logsError,
    refresh: refreshLogs
  } = useUsageLogs(activeTab === 'logs' ? logsFilter : {});

  const {
    data: dailyData,
    loading: dailyLoading,
    error: dailyError,
    refresh: refreshDaily
  } = useDailySummaries(activeTab === 'daily' ? dailyFilter : {});

  // 当前标签页的数据
  const usageLogs = activeTab === 'logs' ? (logsData?.data || []) : [];
  const dailySummaries = activeTab === 'daily' ? (dailyData?.data || []) : [];
  const totalRecords = activeTab === 'logs' ? (logsData?.total || 0) : (dailyData?.total || 0);
  const isLoading = activeTab === 'logs' ? logsLoading : dailyLoading;
  const error = activeTab === 'logs' ? logsError : dailyError;

  const pageSizeOptions = [
    { value: 10, label: '10条/页' },
    { value: 20, label: '20条/页' },
    { value: 50, label: '50条/页' },
    { value: 100, label: '100条/页' }
  ];

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    } else if (status >= 400 && status < 500) {
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
    } else if (status >= 500) {
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    }
    return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (activeTab === 'logs') {
      refreshLogs();
    } else {
      refreshDaily();
    }
  };

  const handleReset = () => {
    if (activeTab === 'logs') {
      setModelFilter('');
      setStatusFilter('');
      setDateTimeRange({ start: '', end: '' });
    } else {
      setDateRange({ start: '', end: '' });
    }
    setCurrentPage(1);
  };

  const totalPages = activeTab === 'logs' ? (logsData?.totalPages || 0) : (dailyData?.totalPages || 0);

  if (isLoading) {
    return (
      <DashboardLayout
        title="我的使用记录"
        subtitle="实时监控您的API调用和使用情况"
      >
        <div className="space-y-6">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="我的使用记录"
      subtitle="实时监控您的API调用和使用情况"
    >
      <div className="space-y-6">
        {/* 标签页导航 */}
        <Card className="p-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveTab('logs');
                  setCurrentPage(1);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                请求明细
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveTab('daily');
                  setCurrentPage(1);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'daily'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                日汇总
              </Button>
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="mt-6">
            {/* 错误显示 */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center">
                  <div className="text-red-800 dark:text-red-200">
                    <p className="font-medium">加载失败</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button
                    onClick={() => activeTab === 'logs' ? refreshLogs() : refreshDaily()}
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                  >
                    重试
                  </Button>
                </div>
              </div>
            )}

                {/* 请求明细 */}
                {activeTab === 'logs' && (
                  <div>
            {/* 筛选表单 */}
            <div className="mb-4 flex flex-wrap gap-4 items-end">
              {/* 模型筛选 */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">模型</label>
                <input
                  type="text"
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  placeholder="搜索 model"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 状态筛选 */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">状态</label>
                <input
                  type="text"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="200/400..."
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 时间范围 */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">时间范围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={dateTimeRange.start}
                    onChange={(e) => setDateTimeRange({ ...dateTimeRange, start: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500 dark:text-gray-400">至</span>
                  <input
                    type="datetime-local"
                    value={dateTimeRange.end}
                    onChange={(e) => setDateTimeRange({ ...dateTimeRange, end: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSearch}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  搜索
                </Button>
                <Button
                  type="button"
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </Button>
              </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>模型</TableHead>
                    <TableHead>方法</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>输入Token</TableHead>
                    <TableHead>输出Token</TableHead>
                    <TableHead>总Token</TableHead>
                    <TableHead>费用</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.model}</TableCell>
                        <TableCell>{log.request_method}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.url}>{log.url}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(log.status)}`}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.inputTokens.toLocaleString()}</TableCell>
                        <TableCell>{log.outputTokens.toLocaleString()}</TableCell>
                        <TableCell>{log.totalTokens.toLocaleString()}</TableCell>
                        <TableCell>{formatCost(log.cost)}</TableCell>
                        <TableCell>{log.duration}ms</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.userAgent}>{log.userAgent}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
                  </div>
                )}

                {/* 日汇总 */}
                {activeTab === 'daily' && (
                  <div>
            {/* 筛选表单 */}
            <div className="mb-4 flex flex-wrap gap-4 items-end">
              {/* 日期范围 */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">日期范围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500 dark:text-gray-400">至</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSearch}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  搜索
                </Button>
                <Button
                  type="button"
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </Button>
              </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>总请求数</TableHead>
                    <TableHead>总Token数</TableHead>
                    <TableHead>总费用</TableHead>
                    <TableHead>平均耗时</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailySummaries.map((summary, index) => (
                      <TableRow key={index}>
                        <TableCell>{summary.date}</TableCell>
                        <TableCell>{summary.totalRequests.toLocaleString()}</TableCell>
                        <TableCell>{summary.totalTokens.toLocaleString()}</TableCell>
                        <TableCell>{formatCost(summary.totalCost)}</TableCell>
                        <TableCell>{summary.avgDuration}ms</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
                  </div>
                )}

          </div>
        </Card>

        {/* 分页 */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              共 {totalRecords} 条记录
            </span>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                  className="flex items-center gap-2"
                >
                  <span>{pageSize}条/页</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {pageSizeDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                    {pageSizeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant="ghost"
                        onClick={() => {
                          setPageSize(option.value);
                          setCurrentPage(1);
                          setPageSizeDropdownOpen(false);
                        }}
                        className={`w-full justify-start ${
                          pageSize === option.value ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : ''
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button
                  variant="default"
                  size="sm"
                >
                  {currentPage}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}