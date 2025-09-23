import { NextRequest } from 'next/server';
import { createAuthResponse, createErrorResponse } from '../../../lib/auth/middleware';
import { planCategoryModel } from '../../../lib/database/models/plan-category';

// 获取套餐分组列表（不需要认证）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    if (featured) {
      // 只获取特色分组
      const categories = await planCategoryModel.findFeatured();
      return createAuthResponse(categories, '特色分组获取成功');
    }

    // 获取所有激活的分组
    const categories = await planCategoryModel.findActive();
    return createAuthResponse(categories, '分组列表获取成功');

  } catch (error) {
    console.error('获取分组列表错误:', error);
    return createErrorResponse(new Error('获取分组列表失败'), 500);
  }
}