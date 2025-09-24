"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUnreadCount } from '@/lib/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Maximize,
  RefreshCw
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
}

export function DashboardHeader({ onMenuClick, title, subtitle }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { count: notificationCount } = useUnreadCount();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 生成面包屑导航
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: '首页', path: '/' }
    ];

    if (pathSegments.includes('dashboard')) {
      breadcrumbs.push({ label: '仪表板', path: '/dashboard' });

      if (pathSegments.length > 1) {
        const currentPage = pathSegments[pathSegments.length - 1];
        const pageNames: { [key: string]: string } = {
          'usage': '使用记录',
          'billing': '账单管理',
          'plans': '套餐计划',
          'profile': '个人资料'
        };

        if (pageNames[currentPage]) {
          breadcrumbs.push({
            label: pageNames[currentPage],
            path: pathname
          });
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">

        {/* 左侧 - 菜单按钮和面包屑 */}
        <div className="flex items-center space-x-4">

          {/* 移动端菜单按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* 面包屑导航 */}
          <nav className="hidden sm:flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
                <button
                  onClick={() => router.push(crumb.path)}
                  className={`text-sm font-medium transition-colors cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {/* 页面标题（移动端显示） */}
          {title && (
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          )}
        </div>

        {/* 右侧 - 功能按钮和用户菜单 */}
        <div className="flex items-center space-x-3">

          {/* 搜索按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* 刷新按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* 主题切换 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* 通知按钮 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/notifications')}
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          </div>

          {/* 用户菜单 */}
          <div className="relative">
            <button
              onClick={handleUserMenuToggle}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Avatar
                className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700"
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                }
              />
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username || '用户'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  在线
                </div>
              </div>
            </button>

            {/* 用户下拉菜单 */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20">

                  {/* 用户信息头部 */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        className="w-12 h-12 border-2 border-gray-200 dark:border-gray-600"
                        fallback={
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user?.username || '用户'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || 'user@example.com'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        活跃用户
                      </Badge>
                    </div>
                  </div>

                  {/* 菜单项 */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        router.push('/dashboard/profile');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-3" />
                      个人资料
                    </button>
                    <button
                      onClick={() => {
                        router.push('/dashboard/settings');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      账户设置
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        router.push('/');
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 页面标题和副标题（桌面端显示） */}
      {(title || subtitle) && (
        <div className="hidden sm:block px-4 lg:px-8 pb-4">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}