import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { userAccountBindingModel } from '../../../../lib/database/models/user-account-binding';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const user_id = searchParams.get('user_id') || '';
    const ai_account_id = searchParams.get('ai_account_id') || '';
    const plan_id = searchParams.get('plan_id') || '';
    const binding_status = searchParams.get('binding_status') || '';
    const binding_type = searchParams.get('binding_type') || '';
    const provider = searchParams.get('provider') || '';

    // 构建过滤器
    const filters: any = {};
    if (user_id) filters.user_id = user_id;
    if (ai_account_id) filters.ai_account_id = ai_account_id;
    if (plan_id) filters.plan_id = plan_id;
    if (binding_status) filters.binding_status = binding_status;
    if (binding_type) filters.binding_type = binding_type;

    // 获取用户账号绑定列表
    const result = await userAccountBindingModel.getList(filters, page, pageSize);

    // 如果有provider过滤，需要在结果中进一步过滤
    let filteredData = result.data;
    if (provider) {
      filteredData = result.data.filter(binding => binding.provider === provider);
    }

    return createAuthResponse({
      data: filteredData,
      total: provider ? filteredData.length : result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: provider ? Math.ceil(filteredData.length / pageSize) : result.totalPages
    }, '用户绑定列表获取成功');

  } catch (error) {
    console.error('获取用户绑定列表错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取用户绑定列表失败'), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'admin' && auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const body = await request.json();
    
    // 验证必填字段
    if (!body.user_id || !body.ai_account_id || !body.plan_id) {
      return createErrorResponse(new Error('缺少必填字段：user_id, ai_account_id, plan_id'), 400);
    }

    // 创建用户账号绑定
    const binding = await userAccountBindingModel.create({
      user_id: body.user_id,
      ai_account_id: body.ai_account_id,
      plan_id: body.plan_id,
      binding_type: body.binding_type || 'dedicated',
      priority_level: body.priority_level || 1,
      max_requests_per_hour: body.max_requests_per_hour,
      max_tokens_per_hour: body.max_tokens_per_hour,
      starts_at: body.starts_at,
      expires_at: body.expires_at
    });

    return NextResponse.json({
      success: true,
      message: '用户账号绑定创建成功',
      data: binding
    }, { status: 201 });

  } catch (error) {
    console.error('创建用户账号绑定错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(
      new Error(error instanceof Error ? error.message : '创建用户账号绑定失败'),
      500
    );
  }
}