import { BaseModel } from '../base-model';
import type { AsyncDatabase } from '../connection';

// 用户账号绑定数据接口
export interface UserAccountBinding {
  id: string;
  user_id: string;
  ai_account_id: string;
  plan_id: string;
  binding_type: 'dedicated' | 'priority' | 'shared';
  priority_level: number;
  binding_status: 'active' | 'inactive' | 'expired' | 'suspended';
  max_requests_per_hour?: number;
  max_tokens_per_hour?: number;
  starts_at: string;
  expires_at?: string;
  last_used_at?: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserAccountBindingData {
  user_id: string;
  ai_account_id: string;
  plan_id: string;
  binding_type?: 'dedicated' | 'priority' | 'shared';
  priority_level?: number;
  max_requests_per_hour?: number;
  max_tokens_per_hour?: number;
  starts_at?: string;
  expires_at?: string;
}

export interface UpdateUserAccountBindingData {
  binding_status?: 'active' | 'inactive' | 'expired' | 'suspended';
  priority_level?: number;
  max_requests_per_hour?: number;
  max_tokens_per_hour?: number;
  expires_at?: string;
}

export interface UserAccountBindingFilter {
  user_id?: string;
  ai_account_id?: string;
  plan_id?: string;
  binding_status?: string;
  binding_type?: string;
}

// 绑定详情接口（包含关联数据）
export interface UserAccountBindingDetail extends UserAccountBinding {
  // 用户信息
  username?: string;
  user_email?: string;
  
  // AI账号信息
  account_name?: string;
  provider?: string;
  tier?: string;
  
  // 套餐信息
  plan_name?: string;
  plan_display_name?: string;
}

class UserAccountBindingModel extends BaseModel {
  protected tableName = 'user_account_bindings';

  // 创建用户账号绑定
  async create(data: CreateUserAccountBindingData): Promise<UserAccountBinding> {
    this.validateRequired(data, ['user_id', 'ai_account_id', 'plan_id']);

    // 检查AI账号是否可用
    const aiAccount = await this.findOne(
      'SELECT * FROM ai_accounts WHERE id = ? AND account_status = ? AND is_shared = ?',
      [data.ai_account_id, 'active', false] // 只有非共享账号可以绑定
    );

    if (!aiAccount) {
      throw new Error('指定的AI账号不可用或不支持绑定');
    }

    // 检查该AI账号是否已被其他用户绑定
    const existingBinding = await this.findOne<UserAccountBinding>(
      'SELECT * FROM user_account_bindings WHERE ai_account_id = ? AND binding_status = ?',
      [data.ai_account_id, 'active']
    );

    if (existingBinding && existingBinding.user_id !== data.user_id) {
      throw new Error('该AI账号已被其他用户绑定');
    }

    // 检查用户在同一服务商下是否已有绑定
    const userExistingBinding = await this.findOne<UserAccountBinding>(
      `SELECT uab.* FROM user_account_bindings uab
       JOIN ai_accounts aa ON uab.ai_account_id = aa.id
       WHERE uab.user_id = ? AND aa.provider = (
         SELECT provider FROM ai_accounts WHERE id = ?
       ) AND uab.binding_status = ?`,
      [data.user_id, data.ai_account_id, 'active']
    );

    if (userExistingBinding) {
      throw new Error('用户在该AI服务商下已存在绑定，请先解除现有绑定');
    }

    const id = this.generateId();
    const now = this.getCurrentTimestamp();
    
    const bindingData = {
      id,
      ...data,
      binding_type: data.binding_type || 'dedicated',
      priority_level: data.priority_level || 1,
      binding_status: 'active',
      starts_at: data.starts_at || now,
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
      created_at: now,
      updated_at: now
    };

    const { sql, params } = this.buildInsertQuery(this.tableName, bindingData);
    await this.execute(sql, params);

    return await this.findById<UserAccountBinding>(id) as UserAccountBinding;
  }

  // 根据ID获取绑定信息
  async getById(id: string): Promise<UserAccountBinding | null> {
    return await this.findById<UserAccountBinding>(id);
  }

  // 获取绑定详情（包含关联信息）
  async getDetailById(id: string): Promise<UserAccountBindingDetail | null> {
    const sql = `
      SELECT 
        uab.*,
        u.username, u.email as user_email,
        aa.account_name, aa.provider, aa.tier,
        p.plan_name, p.display_name as plan_display_name
      FROM user_account_bindings uab
      LEFT JOIN users u ON uab.user_id = u.id
      LEFT JOIN ai_accounts aa ON uab.ai_account_id = aa.id
      LEFT JOIN plans p ON uab.plan_id = p.id
      WHERE uab.id = ?
    `;

    return await this.findOne<UserAccountBindingDetail>(sql, [id]);
  }

  // 获取用户的绑定列表
  async getByUserId(userId: string, includeExpired: boolean = false): Promise<UserAccountBindingDetail[]> {
    let sql = `
      SELECT 
        uab.*,
        aa.account_name, aa.provider, aa.tier, aa.account_status,
        p.plan_name, p.display_name as plan_display_name
      FROM user_account_bindings uab
      LEFT JOIN ai_accounts aa ON uab.ai_account_id = aa.id
      LEFT JOIN plans p ON uab.plan_id = p.id
      WHERE uab.user_id = ?
    `;

    if (!includeExpired) {
      sql += ` AND uab.binding_status = 'active' 
               AND (uab.expires_at IS NULL OR uab.expires_at > datetime('now'))`;
    }

    sql += ' ORDER BY uab.priority_level ASC, uab.created_at DESC';

    return await this.findMany<UserAccountBindingDetail>(sql, [userId]);
  }

  // 获取用户在指定服务商下的绑定
  async getUserBindingByProvider(userId: string, provider: string): Promise<UserAccountBindingDetail | null> {
    const sql = `
      SELECT 
        uab.*,
        aa.account_name, aa.provider, aa.tier, aa.account_status,
        p.plan_name, p.display_name as plan_display_name
      FROM user_account_bindings uab
      JOIN ai_accounts aa ON uab.ai_account_id = aa.id
      LEFT JOIN plans p ON uab.plan_id = p.id
      WHERE uab.user_id = ? 
        AND aa.provider = ?
        AND uab.binding_status = 'active'
        AND (uab.expires_at IS NULL OR uab.expires_at > datetime('now'))
      ORDER BY uab.priority_level ASC
      LIMIT 1
    `;

    return await this.findOne<UserAccountBindingDetail>(sql, [userId, provider]);
  }

  // 获取AI账号的绑定用户列表
  async getByAccountId(accountId: string): Promise<UserAccountBindingDetail[]> {
    const sql = `
      SELECT 
        uab.*,
        u.username, u.email as user_email,
        p.plan_name, p.display_name as plan_display_name
      FROM user_account_bindings uab
      LEFT JOIN users u ON uab.user_id = u.id
      LEFT JOIN plans p ON uab.plan_id = p.id
      WHERE uab.ai_account_id = ?
      ORDER BY uab.priority_level ASC, uab.created_at DESC
    `;

    return await this.findMany<UserAccountBindingDetail>(sql, [accountId]);
  }

  // 获取绑定列表（带分页和过滤）
  async getList(
    filters: UserAccountBindingFilter = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: UserAccountBindingDetail[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (filters.user_id) {
      whereConditions.push('uab.user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.ai_account_id) {
      whereConditions.push('uab.ai_account_id = ?');
      params.push(filters.ai_account_id);
    }

    if (filters.plan_id) {
      whereConditions.push('uab.plan_id = ?');
      params.push(filters.plan_id);
    }

    if (filters.binding_status) {
      whereConditions.push('uab.binding_status = ?');
      params.push(filters.binding_status);
    }

    if (filters.binding_type) {
      whereConditions.push('uab.binding_type = ?');
      params.push(filters.binding_type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const baseQuery = `
      SELECT 
        uab.*,
        u.username, u.email as user_email,
        aa.account_name, aa.provider, aa.tier,
        p.plan_name, p.display_name as plan_display_name
      FROM user_account_bindings uab
      LEFT JOIN users u ON uab.user_id = u.id
      LEFT JOIN ai_accounts aa ON uab.ai_account_id = aa.id
      LEFT JOIN plans p ON uab.plan_id = p.id
      ${whereClause}
      ORDER BY uab.created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM user_account_bindings uab
      LEFT JOIN users u ON uab.user_id = u.id
      LEFT JOIN ai_accounts aa ON uab.ai_account_id = aa.id
      LEFT JOIN plans p ON uab.plan_id = p.id
      ${whereClause}
    `;

    return await this.paginate<UserAccountBindingDetail>(baseQuery, countQuery, params, page, pageSize);
  }

  // 更新绑定信息
  async update(id: string, data: UpdateUserAccountBindingData): Promise<UserAccountBinding | null> {
    const cleanedData = this.cleanData({
      ...data,
      updated_at: this.getCurrentTimestamp()
    });

    if (Object.keys(cleanedData).length === 1) { // 只有updated_at
      throw new Error('没有要更新的数据');
    }

    const { setClause, params } = this.buildSetClause(cleanedData);
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    
    const result = await this.execute(sql, [...params, id]);
    
    if (result.changes === 0) {
      return null;
    }

    return await this.getById(id);
  }

  // 更新绑定使用统计
  async updateUsageStats(
    id: string,
    requestCount: number,
    tokenCount: number,
    cost: number
  ): Promise<void> {
    const sql = `
      UPDATE user_account_bindings 
      SET total_requests = total_requests + ?,
          total_tokens = total_tokens + ?,
          total_cost = total_cost + ?,
          last_used_at = ?,
          updated_at = ?
      WHERE id = ?
    `;

    const now = this.getCurrentTimestamp();
    await this.execute(sql, [requestCount, tokenCount, cost, now, now, id]);
  }

  // 检查并更新过期绑定
  async updateExpiredBindings(): Promise<number> {
    const sql = `
      UPDATE user_account_bindings 
      SET binding_status = 'expired', 
          updated_at = ?
      WHERE binding_status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at <= datetime('now')
    `;

    const result = await this.execute(sql, [this.getCurrentTimestamp()]);
    return result.changes;
  }

  // 解除绑定
  async unbind(id: string): Promise<boolean> {
    const result = await this.execute(
      'UPDATE user_account_bindings SET binding_status = ?, updated_at = ? WHERE id = ?',
      ['inactive', this.getCurrentTimestamp(), id]
    );

    return result.changes > 0;
  }

  // 删除绑定记录
  async delete(id: string): Promise<boolean> {
    return await this.deleteById(id);
  }

  // 获取绑定统计信息
  async getBindingStats(): Promise<{
    total_bindings: number;
    active_bindings: number;
    expired_bindings: number;
    by_provider: Array<{
      provider: string;
      binding_count: number;
    }>;
    by_plan: Array<{
      plan_name: string;
      binding_count: number;
    }>;
  }> {
    // 基础统计
    const basicStats = await this.findOne<{
      total_bindings: number;
      active_bindings: number;
      expired_bindings: number;
    }>(`
      SELECT 
        COUNT(*) as total_bindings,
        SUM(CASE WHEN binding_status = 'active' THEN 1 ELSE 0 END) as active_bindings,
        SUM(CASE WHEN binding_status = 'expired' THEN 1 ELSE 0 END) as expired_bindings
      FROM user_account_bindings
    `);

    // 按服务商统计
    const providerStats = await this.findMany<{ provider: string; binding_count: number }>(`
      SELECT aa.provider, COUNT(*) as binding_count
      FROM user_account_bindings uab
      JOIN ai_accounts aa ON uab.ai_account_id = aa.id
      WHERE uab.binding_status = 'active'
      GROUP BY aa.provider
      ORDER BY binding_count DESC
    `);

    // 按套餐统计
    const planStats = await this.findMany<{ plan_name: string; binding_count: number }>(`
      SELECT p.display_name as plan_name, COUNT(*) as binding_count
      FROM user_account_bindings uab
      JOIN plans p ON uab.plan_id = p.id
      WHERE uab.binding_status = 'active'
      GROUP BY p.id, p.display_name
      ORDER BY binding_count DESC
    `);

    return {
      ...basicStats!,
      by_provider: providerStats,
      by_plan: planStats
    };
  }
}

// 导出单例模型实例
export const userAccountBindingModel = new UserAccountBindingModel();