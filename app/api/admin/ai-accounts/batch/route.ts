import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth/jwt';
import { aiAccountModel } from '../../../../../lib/database/models/ai-account';

// 批量删除AI账号
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { accountIds } = body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请提供要删除的账号ID列表'
      }, { status: 400 });
    }

    // 检查账号是否存在且可以删除
    const accounts = await Promise.all(
      accountIds.map(id => aiAccountModel.getById(id))
    );

    const existingAccounts = accounts.filter(account => account !== null);
    if (existingAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有找到可删除的账号'
      }, { status: 404 });
    }

    // 批量删除账号
    let deletedCount = 0;
    const errors: string[] = [];

    for (const accountId of accountIds) {
      try {
        const result = await aiAccountModel.delete(accountId);
        if (result) {
          deletedCount++;
        }
      } catch (error) {
        errors.push(`删除账号 ${accountId} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        requestedCount: accountIds.length,
        deletedCount,
        errors: errors.length > 0 ? errors : null
      },
      deletedCount,
      message: `批量删除完成：成功删除 ${deletedCount} 个账号${errors.length > 0 ? `，${errors.length} 个失败` : ''}`
    });

  } catch (error) {
    console.error('批量删除AI账号失败:', error);
    return NextResponse.json({
      success: false,
      message: '批量删除操作失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 批量更新AI账号
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { accountIds, updates } = body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请提供要更新的账号ID列表'
      }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({
        success: false,
        message: '请提供要更新的数据'
      }, { status: 400 });
    }

    // 验证更新字段
    const allowedFields = [
      'account_status', 'tier', 'is_shared',
      'max_requests_per_minute', 'max_tokens_per_minute',
      'max_concurrent_requests'
    ];

    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return NextResponse.json({
        success: false,
        message: `不支持更新以下字段: ${invalidFields.join(', ')}`
      }, { status: 400 });
    }

    // 批量更新账号
    let updatedCount = 0;
    const errors: string[] = [];

    for (const accountId of accountIds) {
      try {
        const result = await aiAccountModel.update(accountId, {
          ...updates,
          updated_at: new Date().toISOString()
        });
        if (result) {
          updatedCount++;
        }
      } catch (error) {
        errors.push(`更新账号 ${accountId} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        requestedCount: accountIds.length,
        updatedCount,
        errors: errors.length > 0 ? errors : null
      },
      updatedCount,
      message: `批量更新完成：成功更新 ${updatedCount} 个账号${errors.length > 0 ? `，${errors.length} 个失败` : ''}`
    });

  } catch (error) {
    console.error('批量更新AI账号失败:', error);
    return NextResponse.json({
      success: false,
      message: '批量更新操作失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}