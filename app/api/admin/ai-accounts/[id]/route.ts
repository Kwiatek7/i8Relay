import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth/jwt';
import { aiAccountModel } from '../../../../../lib/database/models/ai-account';

// GET - 获取单个AI账号详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const { id } = await params;
    const account = await aiAccountModel.getById(id);
    if (!account) {
      return NextResponse.json({ success: false, message: 'AI账号不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: account
    });

  } catch (error) {
    console.error('获取AI账号详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取AI账号详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新AI账号信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const body = await request.json();

    // 验证必填字段
    if (!body.account_name?.trim()) {
      return NextResponse.json(
        { success: false, message: '账号名称不能为空' },
        { status: 400 }
      );
    }

    // 准备更新数据
    const updateData = {
      account_name: body.account_name.trim(),
      account_status: body.account_status,
      tier: body.tier,
      max_requests_per_minute: parseInt(body.max_requests_per_minute) || 60,
      max_tokens_per_minute: parseInt(body.max_tokens_per_minute) || 100000,
      max_concurrent_requests: parseInt(body.max_concurrent_requests) || 3,
      is_shared: body.is_shared !== false,
      monthly_cost: parseFloat(body.monthly_cost) || 0,
      description: body.description?.trim() || null,
      tags: body.tags && body.tags.length > 0 ? body.tags : null
    };

    const { id } = await params;
    const updatedAccount = await aiAccountModel.update(id, updateData);
    if (!updatedAccount) {
      return NextResponse.json({ success: false, message: 'AI账号不存在或更新失败' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'AI账号更新成功',
      data: updatedAccount
    });

  } catch (error) {
    console.error('更新AI账号失败:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: '更新AI账号失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除AI账号
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const { id } = await params;
    const success = await aiAccountModel.delete(id);
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'AI账号不存在或删除失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'AI账号删除成功'
    });

  } catch (error) {
    console.error('删除AI账号失败:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: '删除AI账号失败' },
      { status: 500 }
    );
  }
}