import { NextRequest } from 'next/server';
import { requireAdmin, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { planModel } from '../../../../lib/database/models/plan';

// 获取所有套餐
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin(request);

    // 获取所有套餐（包括非激活的）
    const plans = await planModel.findAll();

    return createAuthResponse(plans, '套餐列表获取成功');

  } catch (error) {
    console.error('获取套餐列表错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取套餐列表失败'), 500);
  }
}

// 创建新套餐
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin(request);

    // 获取请求数据
    const planData = await request.json();

    // 验证必需字段
    const requiredFields = ['name', 'price', 'billing_period', 'token_limit', 'rate_limit_per_minute', 'rate_limit_per_day'];
    for (const field of requiredFields) {
      if (planData[field] === undefined || planData[field] === null) {
        return createErrorResponse(new Error(`缺少必需字段: ${field}`), 400);
      }
    }

    // 验证数据类型和范围
    if (typeof planData.price !== 'number' || planData.price < 0) {
      return createErrorResponse(new Error('价格必须是非负数'), 400);
    }

    if (typeof planData.token_limit !== 'number' || planData.token_limit < 0) {
      return createErrorResponse(new Error('Token限制必须是非负数'), 400);
    }

    if (typeof planData.rate_limit_per_minute !== 'number' || planData.rate_limit_per_minute < 1) {
      return createErrorResponse(new Error('每分钟限制必须是正数'), 400);
    }

    if (typeof planData.rate_limit_per_day !== 'number' || planData.rate_limit_per_day < 1) {
      return createErrorResponse(new Error('每天限制必须是正数'), 400);
    }

    // 验证计费周期
    const validPeriods = ['monthly', 'yearly', 'one_time'];
    if (!validPeriods.includes(planData.billing_period)) {
      return createErrorResponse(new Error('无效的计费周期'), 400);
    }

    // 验证特性配置
    if (planData.features && !Array.isArray(planData.features)) {
      return createErrorResponse(new Error('特性配置必须是数组'), 400);
    }

    // 检查套餐名称是否已存在
    const existingPlan = await planModel.findByName(planData.name);
    if (existingPlan) {
      return createErrorResponse(new Error('套餐名称已存在'), 400);
    }

    // 创建套餐
    const plan = await planModel.create({
      name: planData.name,
      price: planData.price,
      billing_period: planData.billing_period,
      features: planData.features || [],
      token_limit: planData.token_limit,
      rate_limit_per_minute: planData.rate_limit_per_minute,
      rate_limit_per_day: planData.rate_limit_per_day,
      is_active: planData.is_active !== false, // 默认为true
      sort_order: planData.sort_order || 0
    });

    return createAuthResponse(plan, '套餐创建成功');

  } catch (error) {
    console.error('创建套餐错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('创建套餐失败'), 500);
  }
}