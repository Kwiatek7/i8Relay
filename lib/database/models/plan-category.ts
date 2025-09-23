import { BaseModel } from '../base-model';

export interface PlanCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePlanCategoryData {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_featured?: boolean;
}

export interface UpdatePlanCategoryData {
  name?: string;
  display_name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

export class PlanCategoryModel extends BaseModel {
  protected tableName = 'plan_categories';

  // 创建套餐分组
  async create(categoryData: CreatePlanCategoryData): Promise<PlanCategory> {
    this.validateRequired(categoryData, ['id', 'name', 'display_name']);

    // 检查ID是否已存在
    if (await this.exists('id', categoryData.id)) {
      throw new Error('分组ID已存在');
    }

    const category = {
      id: categoryData.id,
      name: categoryData.name,
      display_name: categoryData.display_name,
      description: categoryData.description || null,
      icon: categoryData.icon || null,
      color: categoryData.color || '#3b82f6',
      sort_order: categoryData.sort_order || 0,
      is_active: true,
      is_featured: categoryData.is_featured || false,
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp()
    };

    const { sql, params } = this.buildInsertQuery(this.tableName, category);
    await this.execute(sql, params);

    return this.formatCategory(category);
  }

  // 根据ID查询分组
  async findCategoryById(id: string): Promise<PlanCategory | null> {
    const category = await this.findOne<any>(`
      SELECT * FROM ${this.tableName} WHERE id = ?
    `, [id]);

    return category ? this.formatCategory(category) : null;
  }

  // 获取所有激活的分组
  async findActive(): Promise<PlanCategory[]> {
    const categories = await this.findMany<any>(`
      SELECT * FROM ${this.tableName}
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    return categories.map(category => this.formatCategory(category));
  }

  // 获取特色分组
  async findFeatured(): Promise<PlanCategory[]> {
    const categories = await this.findMany<any>(`
      SELECT * FROM ${this.tableName}
      WHERE is_active = true AND is_featured = true
      ORDER BY sort_order ASC
    `);

    return categories.map(category => this.formatCategory(category));
  }

  // 获取所有分组（包括未激活的）
  async findAll(): Promise<PlanCategory[]> {
    const categories = await this.findMany<any>(`
      SELECT * FROM ${this.tableName}
      ORDER BY sort_order ASC
    `);

    return categories.map(category => this.formatCategory(category));
  }

  // 更新分组
  async update(id: string, updateData: UpdatePlanCategoryData): Promise<PlanCategory | null> {
    const cleanData = this.cleanData({
      ...updateData,
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

    return await this.findCategoryById(id);
  }

  // 删除分组
  async delete(id: string): Promise<boolean> {
    // 检查是否有套餐在使用这个分组
    const plansCount = await this.findOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM plans WHERE category_id = ?
    `, [id]);

    if ((plansCount?.count || 0) > 0) {
      throw new Error('无法删除包含套餐的分组，请先移动或删除分组内的套餐');
    }

    return await this.deleteById(id);
  }

  // 启用/禁用分组
  async toggleActive(id: string): Promise<PlanCategory | null> {
    const category = await this.findCategoryById(id);
    if (!category) {
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

    return await this.findCategoryById(id);
  }

  // 设置特色分组
  async setFeatured(id: string, is_featured: boolean): Promise<PlanCategory | null> {
    const result = await this.execute(`
      UPDATE ${this.tableName}
      SET is_featured = ?, updated_at = ?
      WHERE id = ?
    `, [is_featured, this.getCurrentTimestamp(), id]);

    if ((result.changes ?? 0) === 0) {
      return null;
    }

    return await this.findCategoryById(id);
  }

  // 获取分组统计信息
  async getStats(): Promise<{
    total: number;
    active: number;
    featured: number;
    totalPlans: number;
  }> {
    const stats = await this.findOne<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_featured = true THEN 1 ELSE 0 END) as featured
      FROM ${this.tableName}
    `);

    // 计算总套餐数
    const planStats = await this.findOne<{ total_plans: number }>(`
      SELECT COUNT(*) as total_plans FROM plans WHERE category_id IS NOT NULL
    `);

    return {
      total: stats?.total || 0,
      active: stats?.active || 0,
      featured: stats?.featured || 0,
      totalPlans: planStats?.total_plans || 0
    };
  }

  // 格式化分组信息
  private formatCategory(category: any): PlanCategory {
    return {
      id: category.id,
      name: category.name,
      display_name: category.display_name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      sort_order: category.sort_order,
      is_active: Boolean(category.is_active),
      is_featured: Boolean(category.is_featured),
      created_at: category.created_at,
      updated_at: category.updated_at
    };
  }
}

// 导出单例实例
export const planCategoryModel = new PlanCategoryModel();