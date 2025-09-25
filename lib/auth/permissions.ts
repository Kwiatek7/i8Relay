/**
 * 权限控制工具函数
 */

import { User } from '../types';

export type UserRole = 'user' | 'admin' | 'super_admin';

/**
 * 检查用户是否为管理员
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.user_role === 'admin' || user.user_role === 'super_admin';
}

/**
 * 检查用户是否为超级管理员
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.user_role === 'super_admin';
}

/**
 * 检查用户是否为普通用户
 */
export function isRegularUser(user: User | null): boolean {
  if (!user) return false;
  return user.user_role === 'user' || !user.user_role;
}

/**
 * 检查用户是否有访问管理后台的权限
 */
export function canAccessAdmin(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * 检查用户是否有访问用户仪表板的权限
 */
export function canAccessDashboard(user: User | null): boolean {
  return isRegularUser(user);
}

/**
 * 根据用户角色获取默认重定向路径
 */
export function getDefaultRedirectPath(user: User | null): string {
  if (!user) return '/login';

  if (isAdmin(user)) {
    return '/admin';
  } else {
    return '/dashboard';
  }
}

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  const permissions: Record<UserRole, string[]> = {
    'user': [
      'access:dashboard',
      'view:profile',
      'edit:profile',
      'view:usage',
      'view:billing',
      'manage:api_keys'
    ],
    'admin': [
      'access:admin',
      'manage:users',
      'manage:plans',
      'view:stats',
      'manage:config',
      'manage:notifications',
      'manage:payments'
    ],
    'super_admin': [
      'access:admin',
      'manage:users',
      'manage:plans',
      'view:stats',
      'manage:config',
      'manage:notifications',
      'manage:payments',
      'manage:system',
      'access:logs'
    ]
  };

  const userRole = (user.user_role || 'user') as UserRole;
  return permissions[userRole]?.includes(permission) || false;
}

/**
 * 权限检查装饰器类型
 */
export interface PermissionCheck {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
  allowSelf?: boolean; // 允许用户操作自己的资源
}

/**
 * 检查用户是否满足权限要求
 */
export function checkPermissionRequirements(
  user: User | null,
  requirements: PermissionCheck,
  targetUserId?: string
): boolean {
  if (!user) return false;

  // 检查角色要求
  if (requirements.requiredRole) {
    const roles = Array.isArray(requirements.requiredRole)
      ? requirements.requiredRole
      : [requirements.requiredRole];

    const userRole = (user.user_role || 'user') as UserRole;
    if (!roles.includes(userRole)) {
      return false;
    }
  }

  // 检查权限要求
  if (requirements.requiredPermission) {
    const permissions = Array.isArray(requirements.requiredPermission)
      ? requirements.requiredPermission
      : [requirements.requiredPermission];

    for (const permission of permissions) {
      if (!hasPermission(user, permission)) {
        return false;
      }
    }
  }

  // 检查是否允许操作自己的资源
  if (requirements.allowSelf && targetUserId) {
    if (user.id === targetUserId) {
      return true;
    }
  }

  return true;
}

/**
 * 权限错误类
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public code: string = 'permission_denied',
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}