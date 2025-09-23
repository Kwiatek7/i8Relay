import { BaseModel } from '../base-model';
import type { UsageStats, UsageLog, DailySummary } from '../../types';

export interface CreateUsageLogData {
  user_id: string;
  api_key_id?: string;
  request_id?: string;
  method: string;
  endpoint: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens?: number;
  cache_read_tokens?: number;
  status_code: number;
  response_time_ms?: number;
  cost: number;
  user_agent?: string;
  ip_address?: string;
  error_code?: string;
  error_message?: string;
}

export class UsageModel extends BaseModel {
  protected tableName = 'usage_logs';

  // 记录API使用日志
  async logUsage(logData: CreateUsageLogData): Promise<void> {
    this.validateRequired(logData, [
      'user_id', 'method', 'endpoint', 'model',
      'input_tokens', 'output_tokens', 'status_code', 'cost'
    ]);

    const usage = {
      id: this.generateId(),
      user_id: logData.user_id,
      api_key_id: logData.api_key_id || null,
      request_id: logData.request_id || null,
      method: logData.method,
      endpoint: logData.endpoint,
      model: logData.model,
      input_tokens: logData.input_tokens,
      output_tokens: logData.output_tokens,
      cache_creation_tokens: logData.cache_creation_tokens || 0,
      cache_read_tokens: logData.cache_read_tokens || 0,
      total_tokens: logData.input_tokens + logData.output_tokens +
                   (logData.cache_creation_tokens || 0) + (logData.cache_read_tokens || 0),
      status_code: logData.status_code,
      response_time_ms: logData.response_time_ms || null,
      cost: logData.cost,
      user_agent: logData.user_agent || null,
      ip_address: logData.ip_address || null,
      error_code: logData.error_code || null,
      error_message: logData.error_message || null,
      created_at: this.getCurrentTimestamp()
    };

    const { sql, params } = this.buildInsertQuery(this.tableName, usage);
    this.execute(sql, params);

    // 更新用户统计信息
    await this.updateUserStats(logData.user_id, usage);

    // 更新每日汇总
    await this.updateDailySummary(logData.user_id, usage);

    // 更新模型使用统计
    await this.updateModelStats(logData.user_id, logData.model, usage);
  }

  // 获取用户使用统计
  async getUserStats(userId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<UsageStats> {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取总统计
    const totalStats = await this.findOne<{
      total_requests: number;
      total_tokens: number;
      total_cost: number;
    }>(`
      SELECT
        COUNT(*) as total_requests,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(cost), 0) as total_cost
      FROM ${this.tableName}
      WHERE user_id = ? AND created_at >= ?
    `, [userId, startDate.toISOString()]);

    // 获取每日统计
    const dailyStats = await this.findMany<{
      date: string;
      requests: number;
      tokens: number;
      input_tokens: number;
      output_tokens: number;
      cache_creation_tokens: number;
      cache_read_tokens: number;
      cost: number;
    }>(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(cache_creation_tokens), 0) as cache_creation_tokens,
        COALESCE(SUM(cache_read_tokens), 0) as cache_read_tokens,
        COALESCE(SUM(cost), 0) as cost
      FROM ${this.tableName}
      WHERE user_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId, startDate.toISOString()]);

    // 获取模型使用统计
    const modelStats = await this.findMany<{
      model: string;
      requests: number;
      tokens: number;
      cost: number;
    }>(`
      SELECT
        model,
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(cost), 0) as cost
      FROM ${this.tableName}
      WHERE user_id = ? AND created_at >= ?
      GROUP BY model
      ORDER BY requests DESC
    `, [userId, startDate.toISOString()]);

    return {
      total_requests: totalStats?.total_requests || 0,
      total_tokens: totalStats?.total_tokens || 0,
      total_cost: totalStats?.total_cost || 0,
      daily_requests: dailyStats.map(stat => ({
        date: stat.date,
        requests: stat.requests,
        tokens: stat.tokens,
        inputTokens: stat.input_tokens || 0,
        outputTokens: stat.output_tokens || 0,
        cacheCreated: stat.cache_creation_tokens || 0,
        cacheRead: stat.cache_read_tokens || 0,
        totalTokens: stat.tokens + (stat.cache_creation_tokens || 0) + (stat.cache_read_tokens || 0),
        cost: Number(stat.cost)
      })),
      model_usage: modelStats.map(stat => ({
        model: stat.model,
        requests: stat.requests,
        tokens: stat.tokens,
        cost: Number(stat.cost)
      }))
    };
  }

  // 获取使用日志（分页）
  async getUsageLogs(
    userId: string,
    filter: {
      model?: string;
      status?: string;
      startTime?: string;
      endTime?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: UsageLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let whereConditions = ['user_id = ?'];
    let params: any[] = [userId];

    if (filter.model) {
      whereConditions.push('model LIKE ?');
      params.push(`%${filter.model}%`);
    }

    if (filter.status) {
      whereConditions.push('status_code = ?');
      params.push(parseInt(filter.status));
    }

    if (filter.startTime) {
      whereConditions.push('created_at >= ?');
      params.push(filter.startTime);
    }

    if (filter.endTime) {
      whereConditions.push('created_at <= ?');
      params.push(filter.endTime);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const baseQuery = `
      SELECT
        id,
        created_at as timestamp,
        model,
        method,
        endpoint as url,
        status_code as status,
        input_tokens as inputTokens,
        output_tokens as outputTokens,
        total_tokens as totalTokens,
        cost,
        response_time_ms as duration,
        user_agent as userAgent
      FROM ${this.tableName}
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
    `;

    const result = await this.paginate<UsageLog>(baseQuery, countQuery, params, page, pageSize);

    return {
      ...result,
      data: result.data.map(log => ({
        ...log,
        cost: Number(log.cost)
      }))
    };
  }

  // 获取每日汇总
  async getDailySummaries(
    userId: string,
    filter: {
      startDate?: string;
      endDate?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: DailySummary[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let whereConditions = ['user_id = ?'];
    let params: any[] = [userId];

    if (filter.startDate) {
      whereConditions.push('date >= ?');
      params.push(filter.startDate);
    }

    if (filter.endDate) {
      whereConditions.push('date <= ?');
      params.push(filter.endDate);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const baseQuery = `
      SELECT
        date,
        total_requests as totalRequests,
        total_tokens as totalTokens,
        total_cost as totalCost,
        avg_response_time_ms as avgDuration
      FROM daily_usage_summaries
      ${whereClause}
      ORDER BY date DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM daily_usage_summaries
      ${whereClause}
    `;

    const result = await this.paginate<DailySummary>(baseQuery, countQuery, params, page, pageSize);

    return {
      ...result,
      data: result.data.map(summary => ({
        ...summary,
        totalCost: Number(summary.totalCost)
      }))
    };
  }

  // 获取系统总体统计（管理员用）
  async getSystemStats(days: number = 30): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    activeUsers: number;
    topModels: Array<{ model: string; requests: number }>;
    dailyGrowth: Array<{ date: string; requests: number; users: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalStats = await this.findOne<{
      total_requests: number;
      total_tokens: number;
      total_cost: number;
      active_users: number;
    }>(`
      SELECT
        COUNT(*) as total_requests,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(cost), 0) as total_cost,
        COUNT(DISTINCT user_id) as active_users
      FROM ${this.tableName}
      WHERE created_at >= ?
    `, [startDate.toISOString()]);

    const topModels = await this.findMany<{ model: string; requests: number }>(`
      SELECT
        model,
        COUNT(*) as requests
      FROM ${this.tableName}
      WHERE created_at >= ?
      GROUP BY model
      ORDER BY requests DESC
      LIMIT 10
    `, [startDate.toISOString()]);

    const dailyGrowth = await this.findMany<{
      date: string;
      requests: number;
      users: number;
    }>(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        COUNT(DISTINCT user_id) as users
      FROM ${this.tableName}
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate.toISOString()]);

    return {
      totalRequests: totalStats?.total_requests || 0,
      totalTokens: totalStats?.total_tokens || 0,
      totalCost: Number(totalStats?.total_cost) || 0,
      activeUsers: totalStats?.active_users || 0,
      topModels,
      dailyGrowth
    };
  }

  // 更新用户统计信息
  private async updateUserStats(userId: string, usage: any): Promise<void> {
    this.execute(`
      UPDATE users
      SET
        total_requests = total_requests + 1,
        total_tokens = total_tokens + ?,
        total_cost = total_cost + ?,
        updated_at = ?
      WHERE id = ?
    `, [usage.total_tokens, usage.cost, this.getCurrentTimestamp(), userId]);
  }

  // 更新每日汇总
  private async updateDailySummary(userId: string, usage: any): Promise<void> {
    const today = this.formatDate();

    // 尝试更新现有记录
    const updateResult = await this.execute(`
      UPDATE daily_usage_summaries
      SET
        total_requests = total_requests + 1,
        successful_requests = successful_requests + ?,
        failed_requests = failed_requests + ?,
        total_tokens = total_tokens + ?,
        input_tokens = input_tokens + ?,
        output_tokens = output_tokens + ?,
        cache_creation_tokens = cache_creation_tokens + ?,
        cache_read_tokens = cache_read_tokens + ?,
        total_cost = total_cost + ?,
        updated_at = ?
      WHERE user_id = ? AND date = ?
    `, [
      usage.status_code >= 200 && usage.status_code < 300 ? 1 : 0,
      usage.status_code >= 400 ? 1 : 0,
      usage.total_tokens,
      usage.input_tokens,
      usage.output_tokens,
      usage.cache_creation_tokens,
      usage.cache_read_tokens,
      usage.cost,
      this.getCurrentTimestamp(),
      userId,
      today
    ]);

    // 如果没有更新到记录，则插入新记录
    if (updateResult.changes === 0) {
      await this.execute(`
        INSERT INTO daily_usage_summaries (
          id, user_id, date,
          total_requests, successful_requests, failed_requests,
          total_tokens, input_tokens, output_tokens,
          cache_creation_tokens, cache_read_tokens,
          total_cost, avg_response_time_ms
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.generateId(), userId, today,
        usage.status_code >= 200 && usage.status_code < 300 ? 1 : 0,
        usage.status_code >= 400 ? 1 : 0,
        usage.total_tokens,
        usage.input_tokens,
        usage.output_tokens,
        usage.cache_creation_tokens,
        usage.cache_read_tokens,
        usage.cost,
        usage.response_time_ms || 0
      ]);
    }
  }

  // 更新模型使用统计
  private async updateModelStats(userId: string, model: string, usage: any): Promise<void> {
    const today = this.formatDate();

    // 尝试更新现有记录
    const updateResult = await this.execute(`
      UPDATE model_usage_stats
      SET
        requests = requests + 1,
        tokens = tokens + ?,
        cost = cost + ?,
        updated_at = ?
      WHERE user_id = ? AND model = ? AND date = ?
    `, [usage.total_tokens, usage.cost, this.getCurrentTimestamp(), userId, model, today]);

    // 如果没有更新到记录，则插入新记录
    if (updateResult.changes === 0) {
      await this.execute(`
        INSERT INTO model_usage_stats (
          id, user_id, model, date, requests, tokens, cost
        ) VALUES (?, ?, ?, ?, 1, ?, ?)
      `, [this.generateId(), userId, model, today, usage.total_tokens, usage.cost]);
    }
  }

  // 清理旧日志（定期清理）
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.execute(`
      DELETE FROM ${this.tableName}
      WHERE created_at < ?
    `, [cutoffDate.toISOString()]);

    return result.changes;
  }
}

// 导出单例实例
export const usageModel = new UsageModel();