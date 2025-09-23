import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { userModel } from '../../../../lib/database/models/user';

export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);

    // 获取请求数据
    const updateData = await request.json();

    // 验证更新数据
    const allowedFields = ['username', 'email', 'avatar'];
    const filteredData: any = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return createErrorResponse(new Error('没有有效的更新字段'), 400);
    }

    // 如果更新邮箱，检查是否已存在
    if (filteredData.email && filteredData.email !== auth.user.email) {
      const existingUser = await userModel.findByEmail(filteredData.email);
      if (existingUser) {
        return createErrorResponse(new Error('该邮箱已被使用'), 400);
      }
    }

    // 更新用户信息
    const updatedUser = await userModel.update(auth.user.id, filteredData);

    if (!updatedUser) {
      return createErrorResponse(new Error('更新失败'), 400);
    }

    // 返回更新后的用户信息（不包含敏感信息）
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      plan: updatedUser.plan,
      balance: updatedUser.balance,
      apiKey: updatedUser.apiKey,
      avatar: updatedUser.avatar,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    return createAuthResponse(safeUser, '资料更新成功');

  } catch (error) {
    console.error('用户资料更新错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('资料更新失败'), 500);
  }
}