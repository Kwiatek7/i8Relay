import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../lib/auth/middleware';
import { aiAccountModel } from '../../../lib/database/models/ai-account';
import { userAccountBindingModel } from '../../../lib/database/models/user-account-binding';
import { usageModel } from '../../../lib/database/models/usage';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);
    const userId = auth.user.id;

    const body = await request.json();

    // 验证必填字段
    if (!body.provider) {
      return createErrorResponse(new Error('缺少必填字段：provider'), 400);
    }

    // 首先检查用户是否有专属绑定
    const bindings = await userAccountBindingModel.getList({
      user_id: userId
    }, 1, 10);

    let selectedAccount = null;
    let binding = null;
    let source = 'shared';

    // 如果用户有专属绑定，使用专属账号
    if (bindings.data && bindings.data.length > 0) {
      const activeBinding = bindings.data.find((b: any) =>
        b.binding_status === 'active' &&
        new Date(b.expires_at || '9999-12-31') > new Date()
      );

      if (activeBinding) {
        selectedAccount = await aiAccountModel.getById(activeBinding.ai_account_id);
        binding = activeBinding;
        source = 'dedicated';
      }
    }

    // 如果没有专属绑定，从共享池选择
    if (!selectedAccount) {
      const sharedAccounts = await aiAccountModel.getList({
        provider: body.provider,
        is_shared: true,
        account_status: 'active'
      }, 1, 20);

      if (sharedAccounts.data && sharedAccounts.data.length > 0) {
        // 根据健康评分和负载选择最优账号
        selectedAccount = sharedAccounts.data
          .filter((acc: any) => acc.health_score > 0.7)
          .sort((a: any, b: any) => {
            // 优先选择健康评分高、使用率低的账号
            const scoreA = a.health_score * (1 - a.total_requests / (a.max_requests_per_minute * 60));
            const scoreB = b.health_score * (1 - b.total_requests / (b.max_requests_per_minute * 60));
            return scoreB - scoreA;
          })[0];

        source = 'shared';
      }
    }

    if (!selectedAccount) {
      return createErrorResponse(new Error('暂无可用资源'), 503);
    }

    // 返回分配结果（隐藏敏感信息）
    const response = {
      success: true,
      source: source,
      message: source === 'dedicated' ? '已分配专属资源' : '已分配共享资源',
      account: {
        id: selectedAccount.id,
        provider: selectedAccount.provider,
        tier: selectedAccount.tier,
        max_requests_per_minute: selectedAccount.max_requests_per_minute,
        max_tokens_per_minute: selectedAccount.max_tokens_per_minute,
        max_concurrent_requests: selectedAccount.max_concurrent_requests,
        health_score: selectedAccount.health_score
      },
      binding: binding ? {
        id: binding.id,
        binding_type: binding.binding_type,
        max_requests_per_hour: binding.max_requests_per_hour,
        max_tokens_per_hour: binding.max_tokens_per_hour,
        expires_at: binding.expires_at
      } : null
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: '资源分配成功'
    });

  } catch (error) {
    console.error('资源分配错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('资源分配失败'), 500);
  }
}

// 记录资源使用情况
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await authenticateRequest(request);
    const userId = auth.user.id;

    const body = await request.json();

    // 验证必填字段
    if (!body.account_id || !body.provider || !body.model) {
      return createErrorResponse(new Error('缺少必填字段'), 400);
    }

    // 记录使用情况到usage_logs表
    await usageModel.logUsage({
      user_id: userId,
      method: 'POST',
      endpoint: `/api/proxy/${body.provider}`,
      model: body.model,
      input_tokens: body.input_tokens || 0,
      output_tokens: body.output_tokens || 0,
      status_code: body.success !== false ? 200 : 500,
      response_time_ms: body.response_time_ms || 0,
      cost: body.cost || 0,
      error_code: body.success === false ? body.error_type : undefined,
      error_message: body.success === false ? body.error_message : undefined
    });

    return NextResponse.json({
      success: true,
      data: { recorded: true },
      message: '使用记录保存成功'
    });

  } catch (error) {
    console.error('记录使用情况错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('记录使用情况失败'), 500);
  }
}