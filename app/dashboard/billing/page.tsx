"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBillingRecords, usePagination } from '../../../lib/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface BillingRecord {
  id: string;
  orderNumber: string;
  planName: string;
  amount: number;
  status: 'success' | 'processing' | 'pending' | 'cancelled' | 'failed';
  paymentMethod: string;
  createdAt: string;
  paidAt?: string;
}

export default function BillingPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // 分页管理
  const { page: currentPage, limit: pageSize, goToPage, changeLimit } = usePagination(1, 20);

  // 获取账单数据
  const {
    data: billingData,
    loading: billingLoading,
    error: billingError,
    refresh: refreshBilling
  } = useBillingRecords(currentPage, pageSize);

  // 转换数据格式以匹配现有组件
  const billingRecords: BillingRecord[] = (billingData || []).map(record => ({
    id: record.id,
    orderNumber: record.id.slice(-8).toUpperCase(),
    planName: record.description,
    amount: Math.abs(record.amount),
    status: record.status === 'completed' ? 'success' :
            record.status === 'pending' ? 'pending' : 'failed',
    paymentMethod: '支付宝',
    createdAt: record.created_at,
    paidAt: record.updated_at
  }));

  // 计算统计数据
  const totalPaid = billingRecords
    .filter(record => record.status === 'success')
    .reduce((sum, record) => sum + record.amount, 0);
  const totalRecords = billingRecords.length;

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'success', label: '支付成功' },
    { value: 'processing', label: '处理中' },
    { value: 'pending', label: '待支付' },
    { value: 'cancelled', label: '已取消' },
    { value: 'failed', label: '支付失败' }
  ];

  const pageSizeOptions = [
    { value: 10, label: '10条/页' },
    { value: 20, label: '20条/页' },
    { value: 50, label: '50条/页' },
    { value: 100, label: '100条/页' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'processing':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
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

  const formatPrice = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const handleSearch = () => {
    // TODO: 实现搜索逻辑
    console.log('Search:', { statusFilter, dateRange, currentPage, pageSize });
  };

  const handleReset = () => {
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    goToPage(1);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  if (billingLoading) {
    return (
      <DashboardLayout
        title="账单管理"
        subtitle="查看您的订单记录和付款历史"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // 错误显示组件
  if (billingError) {
    return (
      <DashboardLayout
        title="账单管理"
        subtitle="查看您的订单记录和付款历史"
      >
        <Card className="text-center p-8 max-w-md mx-auto">
          <div className="text-red-500 text-lg mb-4 font-semibold">账单数据加载失败</div>
          <div className="text-gray-600 dark:text-gray-400 mb-6">{billingError}</div>
          <Button onClick={refreshBilling}>
            重试
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="账单管理"
      subtitle="查看您的订单记录和付款历史"
    >
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">总支付金额</CardTitle>
              <CardDescription>累计支付成功的订单金额</CardDescription>
            </CardHeader>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ¥{formatPrice(totalPaid)}
            </div>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">订单总数</CardTitle>
              <CardDescription>所有订单记录总数</CardDescription>
            </CardHeader>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalRecords}
            </div>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">成功订单</CardTitle>
              <CardDescription>支付成功的订单数量</CardDescription>
            </CardHeader>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {billingRecords.filter(r => r.status === 'success').length}
            </div>
          </Card>
        </div>

        {/* 筛选和搜索 */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* 状态筛选 */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                订单状态
              </label>
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="w-48 px-4 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                >
                  <span className="text-gray-900 dark:text-white">
                    {statusOptions.find(opt => opt.value === statusFilter)?.label}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setStatusDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span className="text-gray-900 dark:text-white">{option.label}</span>
                        {statusFilter === option.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 时间范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                搜索
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
          </div>
        </Card>

        {/* 订单列表 */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">订单记录</CardTitle>
            <CardDescription>您的所有订单和支付记录</CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>套餐名称</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>支付时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.orderNumber}</TableCell>
                    <TableCell>{record.planName}</TableCell>
                    <TableCell className="font-semibold">¥{formatPrice(record.amount)}</TableCell>
                    <TableCell>
                      <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.paymentMethod}</TableCell>
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                    <TableCell>{record.paidAt ? formatDate(record.paidAt) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">每页显示</span>
              <div className="relative">
                <button
                  onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-2"
                >
                  <span className="text-sm">{pageSize}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {pageSizeDropdownOpen && (
                  <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                    {pageSizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          changeLimit(option.value);
                          setPageSizeDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">条记录</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}