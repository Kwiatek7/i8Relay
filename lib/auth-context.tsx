"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest } from './types';
import { authService } from './auth/service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初始化时检查用户登录状态
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // 使用本地API：验证cookie并获取用户信息
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      // 初始化失败不显示错误，因为用户可能确实未登录
      console.log('Auth initialization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        console.log('登录响应数据：', response.data);

        // 确保用户数据完整设置
        const userData = response.data.user;
        console.log('设置用户数据：', userData);

        setUser(userData);

        // 验证用户状态是否正确设置
        console.log('用户角色：', userData.role);
        console.log('是否为管理员：', userData.role === 'admin' || userData.role === 'super_admin');

        return { success: true };
      } else {
        const errorMessage = response.error?.message || '登录失败';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        const errorMessage = response.error?.message || '注册失败';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '注册失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.updateProfile(data);

      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        const errorMessage = response.error?.message || '更新失败';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}