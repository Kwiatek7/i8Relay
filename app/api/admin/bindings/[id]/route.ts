import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth/jwt';
import { userAccountBindingModel } from '../../../../../lib/database/models/user-account-binding';

// GET - 获取单个绑定详情
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
    const binding = await userAccountBindingModel.getById(id);
    if (!binding) {
      return NextResponse.json({ success: false, message: '绑定不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: binding
    });

  } catch (error) {
    console.error('获取绑定详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取绑定详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新绑定信息
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

    // 准备更新数据
    const updateData = {
      binding_status: body.binding_status,
      priority_level: parseInt(body.priority_level) || 1,
      max_requests_per_hour: body.max_requests_per_hour ? parseInt(body.max_requests_per_hour) : undefined,
      max_tokens_per_hour: body.max_tokens_per_hour ? parseInt(body.max_tokens_per_hour) : undefined,
      expires_at: body.expires_at || undefined
    };

    const { id } = await params;
    const updatedBinding = await userAccountBindingModel.update(id, updateData);
    if (!updatedBinding) {
      return NextResponse.json({ success: false, message: '绑定不存在或更新失败' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '绑定更新成功',
      data: updatedBinding
    });

  } catch (error) {
    console.error('更新绑定失败:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: '更新绑定失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除绑定
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
    const success = await userAccountBindingModel.delete(id);
    if (!success) {
      return NextResponse.json(
        { success: false, message: '绑定不存在或删除失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '绑定删除成功'
    });

  } catch (error) {
    console.error('删除绑定失败:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: '删除绑定失败' },
      { status: 500 }
    );
  }
}