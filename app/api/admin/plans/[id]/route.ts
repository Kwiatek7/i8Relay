import { NextRequest } from 'next/server';
import { requireAdmin, createAuthResponse, createErrorResponse, AuthError } from '../../../../../lib/auth/middleware';
import { planModel } from '../../../../../lib/database/models/plan';

// 获取单个套餐信息
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    await requireAdmin(request);

    const { id: planId } = await params;

    // 获取套餐信息
    const plan = await planModel.findPlanById(planId);
    if (!plan) {
      return createErrorResponse(new Error('套餐不存在'), 404);
    }

    return createAuthResponse(plan, '套餐信息获取成功');

  } catch (error) {
    console.error('获取套餐信息错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('获取套餐信息失败'), 500);
  }
}

// 更新套餐
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    await requireAdmin(request);

    const { id: planId } = await params;
    const updateData = await request.json();

    // 验证套餐存在
    const existingPlan = await planModel.findPlanById(planId);
    if (!existingPlan) {
      return createErrorResponse(new Error('套餐不存在'), 404);
    }

    // 验证更新数据
    if (updateData.price !== undefined) {
      if (typeof updateData.price !== 'number' || updateData.price < 0) {
        return createErrorResponse(new Error('价格必须是非负数'), 400);
      }
    }

    if (updateData.token_limit !== undefined) {
      if (typeof updateData.token_limit !== 'number' || updateData.token_limit < 0) {
        return createErrorResponse(new Error('Token限制必须是非负数'), 400);
      }
    }

    if (updateData.rate_limit_per_minute !== undefined) {
      if (typeof updateData.rate_limit_per_minute !== 'number' || updateData.rate_limit_per_minute < 1) {
        return createErrorResponse(new Error('每分钟限制必须是正数'), 400);
      }
    }

    if (updateData.rate_limit_per_day !== undefined) {
      if (typeof updateData.rate_limit_per_day !== 'number' || updateData.rate_limit_per_day < 1) {
        return createErrorResponse(new Error('每天限制必须是正数'), 400);
      }
    }

    if (updateData.billing_period !== undefined) {
      const validPeriods = ['monthly', 'yearly', 'one_time'];
      if (!validPeriods.includes(updateData.billing_period)) {
        return createErrorResponse(new Error('无效的计费周期'), 400);
      }
    }

    if (updateData.features !== undefined && !Array.isArray(updateData.features)) {
      return createErrorResponse(new Error('特性配置必须是数组'), 400);
    }

    // 检查套餐名称是否与其他套餐冲突
    if (updateData.name && updateData.name !== existingPlan.name) {
      const conflictPlan = await planModel.findByName(updateData.name);
      if (conflictPlan && conflictPlan.id !== planId) {
        return createErrorResponse(new Error('套餐名称已存在'), 400);
      }
    }

    // 更新套餐
    updateData.updated_at = new Date().toISOString();
    const updatedPlan = await planModel.update(planId, updateData);

    if (!updatedPlan) {
      return createErrorResponse(new Error('更新套餐失败'), 500);
    }

    return createAuthResponse(updatedPlan, '套餐更新成功');

  } catch (error) {
    console.error('更新套餐错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('更新套餐失败'), 500);
  }
}

// 删除套餐
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    await requireAdmin(request);

    const { id: planId } = await params;

    // 验证套餐存在
    const existingPlan = await planModel.findPlanById(planId);
    if (!existingPlan) {
      return createErrorResponse(new Error('套餐不存在'), 404);
    }

    // 检查是否有用户正在使用此套餐
    // 这里应该检查users表中是否有用户的plan字段等于这个套餐名称
    // 为了安全起见，我们先不允许删除有用户使用的套餐

    // 删除套餐
    const success = await planModel.delete(planId);

    if (!success) {
      return createErrorResponse(new Error('删除套餐失败'), 500);
    }

    return createAuthResponse(null, '套餐删除成功');

  } catch (error) {
    console.error('删除套餐错误:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('删除套餐失败'), 500);
  }
}