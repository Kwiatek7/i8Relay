"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, useNotificationActions } from '../../../lib/hooks/use-api';
import { Notification, NotificationFilter } from '../../../lib/types';
import {
  Bell,
  Check,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  Info,
  CreditCard,
  Shield,
  Settings,
  CheckCircle,
  X,
  MoreVertical
} from 'lucide-react';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 构建筛选条件
  const notificationFilter: NotificationFilter = {
    isRead: filter === 'all' ? undefined : filter === 'read',
    type: typeFilter === 'all' ? undefined : typeFilter,
    search: searchQuery || undefined,
    page: 1,
    pageSize: 20
  };

  // 使用hooks获取数据和操作
  const {
    data: notificationsData,
    loading,
    error: notificationsError,
    refresh: refreshNotifications
  } = useNotifications(notificationFilter);

  const {
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    clearAllNotifications
  } = useNotificationActions();

  const notifications = notificationsData?.data || [];
  const totalNotifications = notificationsData?.total || 0;

  // 操作处理函数
  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead(id);
    if (result.success) {
      refreshNotifications();
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    const result = await markAsUnread(id);
    if (result.success) {
      refreshNotifications();
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const result = await deleteNotification(id);
    if (result.success) {
      refreshNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      refreshNotifications();
    }
  };

  const handleClearAllNotifications = async () => {
    const result = await clearAllNotifications();
    if (result.success) {
      refreshNotifications();
    }
  };

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'billing':
        return <CreditCard className="w-5 h-5" />;
      case 'security':
        return <Shield className="w-5 h-5" />;
      case 'system':
        return <Settings className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // 获取通知颜色样式
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'billing':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
      case 'security':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'system':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'success':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'info':
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
      default:
        return 'bg-green-500';
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours} 小时前`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 处理错误显示
  if (notificationsError) {
    return (
      <DashboardLayout
        title="通知中心"
        subtitle="查看系统通知和重要消息"
      >
        <Card className="text-center p-8 max-w-md mx-auto">
          <div className="text-red-500 text-lg mb-4 font-semibold">通知数据加载失败</div>
          <div className="text-gray-600 dark:text-gray-400 mb-6">{notificationsError}</div>
          <Button onClick={refreshNotifications}>
            重试
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout
        title="通知中心"
        subtitle="查看系统通知和重要消息"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="通知中心"
      subtitle="查看系统通知和重要消息"
    >
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalNotifications}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">总通知</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unreadCount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">未读</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">高优先级</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.length - unreadCount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">已读</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 筛选和操作 */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-3">
              {/* 读取状态筛选 */}
              <div className="flex gap-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  未读 {unreadCount > 0 && <Badge className="ml-1">{unreadCount}</Badge>}
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('read')}
                >
                  已读
                </Button>
              </div>

              {/* 类型筛选 */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">所有类型</option>
                <option value="system">系统通知</option>
                <option value="billing">账单通知</option>
                <option value="security">安全通知</option>
                <option value="warning">警告</option>
                <option value="info">信息</option>
                <option value="success">成功</option>
              </select>

              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索通知..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 批量操作 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="w-4 h-4 mr-1" />
                全部已读
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllNotifications}
                disabled={totalNotifications === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                清空所有
              </Button>
            </div>
          </div>
        </Card>

        {/* 通知列表 */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              通知列表 ({notifications.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {totalNotifications === 0 ? '暂无通知' : '没有找到符合条件的通知'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      notification.isRead
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 优先级指示器 */}
                      <div className={`w-1 h-16 rounded-full ${getPriorityColor(notification.priority)}`} />

                      {/* 图标 */}
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`font-medium ${
                              notification.isRead
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className={`mt-1 text-sm ${
                              notification.isRead
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(notification.createdAt)}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getNotificationColor(notification.type)}`}
                              >
                                {notification.type === 'billing' && '账单'}
                                {notification.type === 'security' && '安全'}
                                {notification.type === 'system' && '系统'}
                                {notification.type === 'warning' && '警告'}
                                {notification.type === 'success' && '成功'}
                                {notification.type === 'info' && '信息'}
                              </Badge>
                              {notification.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">
                                  高优先级
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-2">
                            {notification.actionUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = notification.actionUrl!}
                              >
                                查看详情
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => notification.isRead ? handleMarkAsUnread(notification.id) : handleMarkAsRead(notification.id)}
                              title={notification.isRead ? '标记为未读' : '标记为已读'}
                            >
                              {notification.isRead ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNotification(notification.id)}
                              title="删除通知"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}