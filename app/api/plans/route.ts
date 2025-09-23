import { NextRequest } from 'next/server';
import { createAuthResponse, createErrorResponse } from '../../../lib/auth/middleware';
import { planModel } from '../../../lib/database/models/plan';

// 获取公开的套餐列表（不需要认证）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';
    const categoryId = searchParams.get('category');

    if (categoryId) {
      // 根据分组ID获取套餐
      const plans = await planModel.findByCategory(categoryId);
      return createAuthResponse(plans, '分组套餐获取成功');
    }

    if (grouped) {
      // 获取分组的套餐
      const groupedPlans = await planModel.findGroupedPlans();
      return createAuthResponse(groupedPlans, '分组套餐列表获取成功');
    }

    // 获取所有激活的套餐（传统格式）
    const plans = await planModel.findActive();
    return createAuthResponse(plans, '套餐列表获取成功');

  } catch (error) {
    console.error('获取套餐列表错误:', error);
    return createErrorResponse(new Error('获取套餐列表失败'), 500);
  }
}