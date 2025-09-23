import { BaseModel } from '../base-model';
import type { Plan } from '../../types';

export interface CreatePlanData {
  id?: string;
  name: string;
  display_name?: string;
  description?: string;
  price: number;
  currency?: string;
  duration_days?: number;
  requests_limit?: number;
  tokens_limit?: number;
  token_limit?: number;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  billing_period?: string;
  models?: string[];
  features?: string[];
  priority_support?: boolean;
  is_popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
  category_id?: string;
}

export interface UpdatePlanData {
  name?: string;
  display_name?: string;
  description?: string;
  price?: number;
  currency?: string;
  duration_days?: number;
  requests_limit?: number;
  tokens_limit?: number;
  models?: string[];
  features?: string[];
  priority_support?: boolean;
  is_popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
  category_id?: string;
}

export class PlanModel extends BaseModel {
  protected tableName = 'plans';

  // 创建套餐
  async create(planData: CreatePlanData): Promise<Plan> {
    this.validateRequired(planData, [
      'id', 'name', 'display_name', 'description', 'price',
      'duration_days', 'requests_limit', 'tokens_limit', 'models', 'features'
    ]);

    // 检查ID是否已存在
    if (await this.exists('id', planData.id)) {
      throw new Error('套餐ID已存在');
    }

    const plan = {
      id: planData.id,
      name: planData.name,
      display_name: planData.display_name,
      description: planData.description,
      price: planData.price,
      currency: planData.currency || 'CNY',
      duration_days: planData.duration_days,
      requests_limit: planData.requests_limit,
      tokens_limit: planData.tokens_limit,
      models: JSON.stringify(planData.models),
      features: JSON.stringify(planData.features),
      priority_support: planData.priority_support || false,
      is_popular: planData.is_popular || false,
      is_active: true,
      sort_order: planData.sort_order || 0,
      category_id: planData.category_id || null,
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp()
    };

    const { sql, params } = this.buildInsertQuery(this.tableName, plan);
    await this.execute(sql, params);

    return this.formatPlan(plan);
  }

  // 根据ID查询套餐
  async findPlanById(id: string): Promise<Plan | null> {
    const plan = await this.findOne<any>(`
      SELECT * FROM ${this.tableName} WHERE id = ?
    `, [id]);

    return plan ? this.formatPlan(plan) : null;
  }

  // 根据名称查询套餐
  async findByName(name: string): Promise<Plan | null> {
    const plan = await this.findOne<any>(`
      SELECT * FROM ${this.tableName}
      WHERE name = ?
    `, [name]);

    return plan ? this.formatPlan(plan) : null;
  }

  // 获取所有激活的套餐
  async findActive(): Promise<Plan[]> {
    const plans = await this.findMany<any>(`
      SELECT * FROM ${this.tableName}
      WHERE is_active = true
      ORDER BY sort_order ASC, price ASC
    `);

    return plans.map(plan => this.formatPlan(plan));
  }

  // 获取分组的套餐（用于前台展示）
  async findGroupedPlans(): Promise<{
    id: string;
    name: string;
    display_name: string;
    description?: string;
    icon?: string;
    color: string;
    sort_order: number;
    is_featured: boolean;
    plans: Plan[];
  }[]> {
    // 获取所有激活的分组
    const categories = await this.findMany<any>(`
      SELECT * FROM plan_categories
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    // 获取所有激活的套餐，包含分组信息
    const plans = await this.findMany<any>(`
      SELECT p.*, pc.display_name as category_name
      FROM ${this.tableName} p
      LEFT JOIN plan_categories pc ON p.category_id = pc.id
      WHERE p.is_active = true
      ORDER BY pc.sort_order ASC, p.sort_order ASC, p.price ASC
    `);

    // 按分组组织套餐
    const groupedPlans = categories.map(category => ({
      id: category.id,
      name: category.name,
      display_name: category.display_name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      sort_order: category.sort_order,
      is_featured: Boolean(category.is_featured),
      plans: plans
        .filter(plan => plan.category_id === category.id)
        .map(plan => this.formatPlan(plan))
    }));

    // 添加未分组的套餐
    const ungroupedPlans = plans
      .filter(plan => !plan.category_id)
      .map(plan => this.formatPlan(plan));

    if (ungroupedPlans.length > 0) {
      groupedPlans.push({
        id: 'ungrouped',
        name: 'ungrouped',
        display_name: '其他套餐',
        description: '未分组的套餐',
        icon: 'Package',
        color: '#6b7280',
        sort_order: 999,
        is_featured: false,
        plans: ungroupedPlans
      });
    }

    return groupedPlans.filter(group => group.plans.length > 0);
  }

  // 根据分组ID获取套餐
  async findByCategory(categoryId: string): Promise<Plan[]> {
    const plans = await this.findMany<any>(`
      SELECT * FROM ${this.tableName}
      WHERE category_id = ? AND is_active = true
      ORDER BY sort_order ASC, price ASC
    `, [categoryId]);

    return plans.map(plan => this.formatPlan(plan));
  }

  // 获取所有套餐（包括未激活的）
  async findAll(): Promise<Plan[]> {
    const plans = await this.findMany<any>(`
      SELECT * FROM ${this.tableName}
      ORDER BY sort_order ASC, price ASC
    `);

    return plans.map(plan => this.formatPlan(plan));
  }

  // 更新套餐
  async update(id: string, updateData: UpdatePlanData): Promise<Plan | null> {
    const cleanData = this.cleanData({
      ...updateData,
      // 如果有数组字段，需要JSON化
      ...(updateData.models && { models: JSON.stringify(updateData.models) }),
      ...(updateData.features && { features: JSON.stringify(updateData.features) }),
      updated_at: this.getCurrentTimestamp()
    });

    if (Object.keys(cleanData).length === 0) {
      throw new Error('没有要更新的数据');
    }

    const { setClause, params } = this.buildSetClause(cleanData);
    const result = await this.execute(`
      UPDATE ${this.tableName} SET ${setClause} WHERE id = ?
    `, [...params, id]);

    if ((result.changes ?? 0) === 0) {
      return null;
    }

    return await this.findPlanById(id);
  }

  // 删除套餐
  async delete(id: string): Promise<boolean> {
    // 检查是否有用户正在使用这个套餐
    const usersCount = await this.findOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM users WHERE current_plan_id = ?
    `, [id]);

    if ((usersCount?.count || 0) > 0) {
      throw new Error('无法删除正在被用户使用的套餐');
    }

    // 检查是否有订阅记录
    const subscriptionsCount = await this.findOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM user_subscriptions WHERE plan_id = ?
    `, [id]);

    if ((subscriptionsCount?.count || 0) > 0) {
      // 有订阅记录时，只设为未激活
      const result = await this.execute(`
        UPDATE ${this.tableName}
        SET is_active = false, updated_at = ?
        WHERE id = ?
      `, [this.getCurrentTimestamp(), id]);

      return (result.changes ?? 0) > 0;
    }

    // 没有关联记录时，可以物理删除
    return await this.deleteById(id);
  }

  // 启用/禁用套餐
  async toggleActive(id: string): Promise<Plan | null> {
    const plan = await this.findPlanById(id);
    if (!plan) {
      return null;
    }

    const result = await this.execute(`
      UPDATE ${this.tableName}
      SET is_active = NOT is_active, updated_at = ?
      WHERE id = ?
    `, [this.getCurrentTimestamp(), id]);

    if ((result.changes ?? 0) === 0) {
      return null;
    }

    return await this.findPlanById(id);
  }

  // 设置推荐套餐（只能有一个推荐套餐）
  async setPopular(id: string): Promise<Plan | null> {
    return await this.transaction(async () => {
      // 先取消所有套餐的推荐状态
      await this.execute(`
        UPDATE ${this.tableName}
        SET is_popular = false, updated_at = ?
      `, [this.getCurrentTimestamp()]);

      // 设置指定套餐为推荐
      const result = await this.execute(`
        UPDATE ${this.tableName}
        SET is_popular = true, updated_at = ?
        WHERE id = ?
      `, [this.getCurrentTimestamp(), id]);

      if ((result.changes ?? 0) === 0) {
        return null;
      }

      return await this.findPlanById(id);
    });
  }

  // 检查用户是否可以使用指定模型
  async canUseModel(planId: string, model: string): Promise<boolean> {
    const plan = await this.findOne<{ models: string }>(`
      SELECT models FROM ${this.tableName} WHERE id = ? AND is_active = true
    `, [planId]);

    if (!plan) {
      return false;
    }

    try {
      const models = JSON.parse(plan.models) as string[];
      // 如果包含 "*"，表示支持所有模型
      return models.includes('*') || models.includes(model);
    } catch {
      return false;
    }
  }

  // 获取套餐的使用限制
  async getLimits(planId: string): Promise<{
    requests_limit: number;
    tokens_limit: number;
    models: string[];
  } | null> {
    const plan = await this.findOne<{
      requests_limit: number;
      tokens_limit: number;
      models: string;
    }>(`
      SELECT requests_limit, tokens_limit, models
      FROM ${this.tableName}
      WHERE id = ? AND is_active = true
    `, [planId]);

    if (!plan) {
      return null;
    }

    try {
      return {
        requests_limit: plan.requests_limit,
        tokens_limit: plan.tokens_limit,
        models: JSON.parse(plan.models)
      };
    } catch {
      return null;
    }
  }

  // 获取套餐统计信息
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    popular: string | null;
    totalRevenue: number;
  }> {
    const stats = await this.findOne<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive
      FROM ${this.tableName}
    `);

    const popularPlan = await this.findOne<{ id: string }>(`
      SELECT id FROM ${this.tableName} WHERE is_popular = true LIMIT 1
    `);

    // 计算总收入（基于订阅记录）
    const revenueStats = await this.findOne<{ total_revenue: number }>(`
      SELECT COALESCE(SUM(price), 0) as total_revenue
      FROM user_subscriptions
      WHERE status = 'active'
    `);

    return {
      total: stats?.total || 0,
      active: stats?.active || 0,
      inactive: stats?.inactive || 0,
      popular: popularPlan?.id || null,
      totalRevenue: revenueStats?.total_revenue || 0
    };
  }

  // 格式化套餐信息
  private formatPlan(plan: any): Plan {
    return {
      id: plan.id,
      name: plan.display_name || plan.name,
      description: plan.description,
      price: parseFloat(plan.price),
      currency: plan.currency,
      duration: plan.duration_days,
      billing_period: plan.billing_period || 'monthly',
      features: this.parseJsonField(plan.features, []),
      requests_limit: plan.requests_limit,
      tokens_limit: plan.tokens_limit,
      models: this.parseJsonField(plan.models, []),
      priority_support: Boolean(plan.priority_support),
      is_popular: Boolean(plan.is_popular),
      is_active: Boolean(plan.is_active),
      category_id: plan.category_id,
      category_name: plan.category_name
    };
  }

  // 安全解析JSON字段
  private parseJsonField<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  }
}

// 导出单例实例
export const planModel = new PlanModel();