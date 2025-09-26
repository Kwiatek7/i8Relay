import { BaseModel } from '../base-model';
import type { AsyncDatabase } from '../connection';
import { encrypt, decrypt, generateKeyPreview, validateApiKeyFormat, hashApiKey } from '../../utils/encryption';

// AI账号数据接口
export interface AIAccount {
  id: string;
  account_name: string;
  provider: string;
  account_type: string;
  credentials: string; // 加密存储的凭据
  credentials_hash?: string; // 凭据哈希（用于验证）
  key_preview?: string; // 脱敏的密钥预览
  tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_requests_per_minute: number;
  max_tokens_per_minute: number;
  max_concurrent_requests: number;
  account_status: 'active' | 'inactive' | 'maintenance' | 'banned' | 'expired';
  is_shared: boolean;
  total_requests: number;
  total_tokens: number;
  last_used_at?: string;
  health_score: number;
  error_count_24h: number;
  last_error_at?: string;
  last_health_check_at?: string;
  monthly_cost: number;
  cost_currency: string;
  description?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAIAccountData {
  account_name: string;
  provider: string;
  account_type: string;
  credentials: string;
  tier?: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_requests_per_minute?: number;
  max_tokens_per_minute?: number;
  max_concurrent_requests?: number;
  is_shared?: boolean;
  monthly_cost?: number;
  cost_currency?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateAIAccountData {
  account_name?: string;
  account_status?: 'active' | 'inactive' | 'maintenance' | 'banned' | 'expired';
  tier?: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_requests_per_minute?: number;
  max_tokens_per_minute?: number;
  max_concurrent_requests?: number;
  is_shared?: boolean;
  monthly_cost?: number;
  description?: string;
  tags?: string[];
  // 健康检查相关字段
  health_score?: number;
  error_count_24h?: number;
  last_error_at?: string;
  last_health_check_at?: string;
  // 使用统计字段
  total_requests?: number;
  total_tokens?: number;
  last_used_at?: string;
  updated_at?: string;
}

export interface AIAccountFilter {
  provider?: string;
  tier?: string;
  account_status?: string;
  is_shared?: boolean;
  health_score_min?: number;
}

class AIAccountModel extends BaseModel {
  protected tableName = 'ai_accounts';

  // 创建AI账号
  async create(data: CreateAIAccountData): Promise<AIAccount> {
    this.validateRequired(data, ['account_name', 'provider', 'account_type', 'credentials']);

    // 验证API密钥格式
    if (!validateApiKeyFormat(data.credentials)) {
      throw new Error('API密钥格式不正确');
    }

    // 检查同一服务商下账号名称是否重复
    const existingAccount = await this.findOne<AIAccount>(
      'SELECT * FROM ai_accounts WHERE provider = ? AND account_name = ?',
      [data.provider, data.account_name]
    );

    if (existingAccount) {
      throw new Error(`在${data.provider}服务商下已存在名为"${data.account_name}"的账号`);
    }

    // 加密凭据
    const encryptedCredentials = encrypt(data.credentials);
    const credentialsHash = hashApiKey(data.credentials);
    const keyPreview = generateKeyPreview(data.credentials);

    const id = this.generateId();
    const now = this.getCurrentTimestamp();

    const accountData = {
      id,
      account_name: data.account_name,
      provider: data.provider,
      account_type: data.account_type,
      credentials: encryptedCredentials,
      credentials_hash: credentialsHash,
      key_preview: keyPreview,
      tier: data.tier || 'basic',
      max_requests_per_minute: data.max_requests_per_minute || 60,
      max_tokens_per_minute: data.max_tokens_per_minute || 100000,
      max_concurrent_requests: data.max_concurrent_requests || 3,
      account_status: 'active',
      is_shared: data.is_shared !== false, // 默认为共享账号
      total_requests: 0,
      total_tokens: 0,
      health_score: 100,
      error_count_24h: 0,
      monthly_cost: data.monthly_cost || 0,
      cost_currency: data.cost_currency || 'USD',
      description: data.description,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      created_at: now,
      updated_at: now
    };

    const { sql, params } = this.buildInsertQuery(this.tableName, accountData);
    await this.execute(sql, params);

    return await this.findById<AIAccount>(id) as AIAccount;
  }

  // 根据ID获取AI账号
  async getById(id: string): Promise<AIAccount | null> {
    return await this.findById<AIAccount>(id);
  }

  // 获取AI账号列表（带分页和过滤）
  async getList(
    filters: AIAccountFilter = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: AIAccount[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (filters.provider) {
      whereConditions.push('provider = ?');
      params.push(filters.provider);
    }

    if (filters.tier) {
      whereConditions.push('tier = ?');
      params.push(filters.tier);
    }

    if (filters.account_status) {
      whereConditions.push('account_status = ?');
      params.push(filters.account_status);
    }

    if (filters.is_shared !== undefined) {
      whereConditions.push('is_shared = ?');
      params.push(filters.is_shared);
    }

    if (filters.health_score_min) {
      whereConditions.push('health_score >= ?');
      params.push(filters.health_score_min);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const baseQuery = `
      SELECT * FROM ai_accounts 
      ${whereClause}
      ORDER BY provider, tier, account_name
    `;

    const countQuery = `
      SELECT COUNT(*) as count FROM ai_accounts 
      ${whereClause}
    `;

    return await this.paginate<AIAccount>(baseQuery, countQuery, params, page, pageSize);
  }

  // 获取可用的AI账号（用于分配）
  async getAvailableAccounts(
    provider: string,
    tier?: string,
    isShared?: boolean
  ): Promise<AIAccount[]> {
    let sql = `
      SELECT * FROM ai_accounts 
      WHERE provider = ? 
        AND account_status = 'active' 
        AND health_score >= 80
    `;
    let params: any[] = [provider];

    if (tier) {
      sql += ' AND tier = ?';
      params.push(tier);
    }

    if (isShared !== undefined) {
      sql += ' AND is_shared = ?';
      params.push(isShared);
    }

    sql += ' ORDER BY health_score DESC, last_used_at ASC';

    return await this.findMany<AIAccount>(sql, params);
  }

  // 更新AI账号信息
  async update(id: string, data: UpdateAIAccountData): Promise<AIAccount | null> {
    const cleanedData = this.cleanData({
      ...data,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
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

  // 更新账号使用统计
  async updateUsageStats(
    id: string,
    requestCount: number,
    tokenCount: number
  ): Promise<void> {
    const sql = `
      UPDATE ai_accounts 
      SET total_requests = total_requests + ?,
          total_tokens = total_tokens + ?,
          last_used_at = ?,
          updated_at = ?
      WHERE id = ?
    `;

    const now = this.getCurrentTimestamp();
    await this.execute(sql, [requestCount, tokenCount, now, now, id]);
  }

  // 更新健康分数
  async updateHealthScore(id: string, score: number, errorIncrement: number = 0): Promise<void> {
    const sql = `
      UPDATE ai_accounts 
      SET health_score = ?,
          error_count_24h = error_count_24h + ?,
          last_error_at = CASE WHEN ? > 0 THEN ? ELSE last_error_at END,
          last_health_check_at = ?,
          updated_at = ?
      WHERE id = ?
    `;

    const now = this.getCurrentTimestamp();
    await this.execute(sql, [
      Math.max(0, Math.min(100, score)), // 确保分数在0-100之间
      errorIncrement,
      errorIncrement,
      errorIncrement > 0 ? now : null,
      now,
      now,
      id
    ]);
  }

  // 重置24小时错误计数
  async resetDailyErrorCounts(): Promise<void> {
    const sql = `
      UPDATE ai_accounts 
      SET error_count_24h = 0,
          updated_at = ?
      WHERE error_count_24h > 0
    `;

    await this.execute(sql, [this.getCurrentTimestamp()]);
  }

  // 删除AI账号
  async delete(id: string): Promise<boolean> {
    // 检查是否有绑定的用户
    const bindingCount = await this.findOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_account_bindings WHERE ai_account_id = ? AND binding_status = ?',
      [id, 'active']
    );

    if (bindingCount && bindingCount.count > 0) {
      throw new Error('无法删除已绑定用户的AI账号，请先解除绑定');
    }

    return await this.deleteById(id);
  }

  // 获取按服务商统计的账号信息
  async getProviderStats(): Promise<Array<{
    provider: string;
    total_accounts: number;
    active_accounts: number;
    shared_accounts: number;
    dedicated_accounts: number;
    avg_health_score: number;
  }>> {
    const sql = `
      SELECT 
        provider,
        COUNT(*) as total_accounts,
        SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as active_accounts,
        SUM(CASE WHEN is_shared = 1 THEN 1 ELSE 0 END) as shared_accounts,
        SUM(CASE WHEN is_shared = 0 THEN 1 ELSE 0 END) as dedicated_accounts,
        ROUND(AVG(health_score), 2) as avg_health_score
      FROM ai_accounts
      GROUP BY provider
      ORDER BY provider
    `;

    return await this.findMany(sql);
  }

  // 获取按等级统计的账号信息
  async getTierStats(): Promise<Array<{
    tier: string;
    total_accounts: number;
    active_accounts: number;
    total_requests: number;
    total_tokens: number;
  }>> {
    const sql = `
      SELECT 
        tier,
        COUNT(*) as total_accounts,
        SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as active_accounts,
        SUM(total_requests) as total_requests,
        SUM(total_tokens) as total_tokens
      FROM ai_accounts
      GROUP BY tier
      ORDER BY
        CASE tier
          WHEN 'enterprise' THEN 1
          WHEN 'premium' THEN 2
          WHEN 'standard' THEN 3
          WHEN 'basic' THEN 4
          ELSE 5
        END
    `;

    return await this.findMany(sql);
  }

  // 获取解密的凭据（仅供内部服务使用）
  async getDecryptedCredentials(id: string): Promise<string | null> {
    const account = await this.findById<AIAccount>(id);
    if (!account) {
      return null;
    }

    try {
      return decrypt(account.credentials);
    } catch (error) {
      console.error('解密AI账号凭据失败:', error);
      throw new Error('无法获取账号凭据');
    }
  }

  // 验证凭据（用于验证API密钥是否正确）
  async validateCredentials(id: string, providedKey: string): Promise<boolean> {
    const account = await this.findById<AIAccount>(id);
    if (!account || !account.credentials_hash) {
      return false;
    }

    try {
      const providedHash = hashApiKey(providedKey);
      return providedHash === account.credentials_hash;
    } catch (error) {
      console.error('验证凭据失败:', error);
      return false;
    }
  }
}

// 导出单例模型实例
export const aiAccountModel = new AIAccountModel();