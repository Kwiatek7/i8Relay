'use client';

import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Package,
  Settings,
  Activity,
  LogOut,
  Home
} from 'lucide-react';
import BackToTop from '../components/BackToTop';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      // 检查用户是否已登录且是管理员
      if (!user) {
        router.push('/login?redirect=/admin');
        return;
      }

      // 检查用户角色
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }

      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const menuItems = [
    {
      name: '概览',
      href: '/admin',
      icon: BarChart3,
    },
    {
      name: '用户管理',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: '套餐管理',
      href: '/admin/plans',
      icon: Package,
    },
    {
      name: '网站配置',
      href: '/admin/config',
      icon: Settings,
    },
    {
      name: '使用统计',
      href: '/admin/usage',
      icon: Activity,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded"></div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                i8Relay 管理后台
              </span>
            </div>
          </div>

          <nav className="mt-6">
            <div className="px-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-md hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* 用户信息和登出 */}
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role === 'super_admin' ? '超级管理员' : '管理员'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link
                  href="/"
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  title="前台界面"
                >
                  <Home className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  title="登出"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      <BackToTop />
    </div>
  );
}