import { NextRequest } from 'next/server';
import { requireAdmin, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { userModel } from '../../../../../lib/database/models/user';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    await requireAdmin(request);

    const { id: userId } = await params;
    const updateData = await request.json();

    // 验证用户存在
    const existingUser = await userModel.findUserById(userId);
    if (!existingUser) {
      return createErrorResponse(new Error('用户不存在'), 404);
    }

    // 字段映射：前端字段名 -> 后端字段名
    const fieldMapping: { [key: string]: string } = {
      'role': 'user_role',
      'status': 'user_status',
      'plan': 'plan',
      'balance': 'balance'
    };

    const filteredData: any = {};

    // 映射并过滤字段
    for (const [frontendField, backendField] of Object.entries(fieldMapping)) {
      if (updateData[frontendField] !== undefined) {
        filteredData[backendField] = updateData[frontendField];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return createErrorResponse(new Error('没有有效的更新字段'), 400);
    }

    // 验证角色值
    if (filteredData.user_role && !['user', 'admin', 'super_admin'].includes(filteredData.user_role)) {
      return createErrorResponse(new Error('无效的用户角色'), 400);
    }

    // 验证状态值
    if (filteredData.user_status && !['active', 'suspended', 'pending'].includes(filteredData.user_status)) {
      return createErrorResponse(new Error('无效的用户状态'), 400);
    }

    // 验证余额
    if (filteredData.balance !== undefined && (typeof filteredData.balance !== 'number' || filteredData.balance < 0)) {
      return createErrorResponse(new Error('无效的余额值'), 400);
    }

    // 更新用户
    filteredData.updated_at = new Date().toISOString();
    const updatedUser = await userModel.update(userId, filteredData);

    if (!updatedUser) {
      return createErrorResponse(new Error('更新用户失败'), 500);
    }

    // 返回更新后的用户信息（不包含敏感信息）
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.user_role,
      plan: updatedUser.plan,
      balance: updatedUser.balance,
      status: updatedUser.user_status,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    return createAuthResponse(safeUser, '用户信息更新成功');

  } catch (error) {
    console.error('更新用户错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('更新用户失败'), 500);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    await requireAdmin(request);

    const { id: userId } = await params;

    // 获取用户详细信息
    const user = await userModel.findUserById(userId);
    if (!user) {
      return createErrorResponse(new Error('用户不存在'), 404);
    }

    // 返回用户信息（不包含密码）
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.user_role,
      plan: user.plan,
      balance: user.balance,
      status: user.user_status,
      apiKey: user.apiKey,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login_at
    };

    return createAuthResponse(safeUser, '用户信息获取成功');

  } catch (error) {
    console.error('获取用户信息错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取用户信息失败'), 500);
  }
}