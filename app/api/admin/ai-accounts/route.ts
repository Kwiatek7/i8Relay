import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { aiAccountModel } from '../../../../lib/database/models/ai-account';

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
    const provider = searchParams.get('provider') || '';
    const tier = searchParams.get('tier') || '';
    const account_status = searchParams.get('account_status') || '';
    const is_shared = searchParams.get('is_shared');

    // 构建过滤器
    const filters: any = {};
    if (provider) filters.provider = provider;
    if (tier) filters.tier = tier;
    if (account_status) filters.account_status = account_status;
    if (is_shared !== null && is_shared !== '') {
      filters.is_shared = is_shared === 'true';
    }

    // 获取AI账号列表
    const result = await aiAccountModel.getList(filters, page, pageSize);

    return createAuthResponse({
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages
    }, 'AI账号列表获取成功');

  } catch (error) {
    console.error('获取AI账号列表错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取AI账号列表失败'), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份和超级管理员权限
    const auth = await authenticateRequest(request);

    if (auth.user.user_role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足，只有超级管理员可以创建AI账号'), 403);
    }

    const body = await request.json();
    
    // 验证必填字段
    if (!body.account_name || !body.provider || !body.account_type || !body.credentials) {
      return createErrorResponse(new Error('缺少必填字段'), 400);
    }

    // 创建AI账号
    const aiAccount = await aiAccountModel.create({
      account_name: body.account_name,
      provider: body.provider,
      account_type: body.account_type,
      credentials: body.credentials, // 注意：在生产环境中应该加密存储
      tier: body.tier || 'basic',
      max_requests_per_minute: body.max_requests_per_minute,
      max_tokens_per_minute: body.max_tokens_per_minute,
      max_concurrent_requests: body.max_concurrent_requests,
      is_shared: body.is_shared !== false,
      monthly_cost: body.monthly_cost || 0,
      cost_currency: body.cost_currency || 'USD',
      description: body.description,
      tags: body.tags
    });

    return NextResponse.json({
      success: true,
      message: 'AI账号创建成功',
      data: aiAccount
    }, { status: 201 });

  } catch (error) {
    console.error('创建AI账号错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(
      new Error(error instanceof Error ? error.message : '创建AI账号失败'),
      500
    );
  }
}