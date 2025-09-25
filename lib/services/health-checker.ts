// AI账号健康检查服务
import { getDb } from '../database/connection';
import { aiAccountModel } from '../database/models/ai-account';
import { decrypt } from '../utils/encryption';

export interface HealthCheckResult {
  accountId: string;
  checkType: 'ping' | 'quota' | 'balance' | 'rate_limit';
  status: 'success' | 'warning' | 'error' | 'timeout';
  responseTime: number;
  message: string;
  details?: any;
}

export class HealthChecker {
  private static instance: HealthChecker;
  private isRunning: boolean = false;

  private constructor() {}

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  /**
   * 检查单个AI账号的健康状态
   */
  async checkAccount(accountId: string): Promise<HealthCheckResult[]> {
    const db = await getDb();
    
    try {
      const account = await db.get('SELECT * FROM ai_accounts WHERE id = ?', [accountId]);
      
      if (!account) {
        throw new Error(`账号 ${accountId} 不存在`);
      }

      console.log(`开始健康检查: ${account.account_name} (${account.provider})`);

      const results: HealthCheckResult[] = [];
      
      // 1. Ping检查 - 基本连接测试
      const pingResult = await this.performPingCheck(account);
      results.push(pingResult);

      // 2. 配额检查 - 检查API使用限制
      if (pingResult.status === 'success') {
        const quotaResult = await this.performQuotaCheck(account);
        results.push(quotaResult);
      }

      // 3. 速率限制检查
      if (pingResult.status === 'success') {
        const rateLimitResult = await this.performRateLimitCheck(account);
        results.push(rateLimitResult);
      }

      // 保存检查结果
      await this.saveCheckResults(accountId, results);

      // 更新账号健康分数
      await this.updateHealthScore(accountId, results);

      return results;

    } catch (error) {
      console.error(`检查账号 ${accountId} 健康状态失败:`, error);
      
      const errorResult: HealthCheckResult = {
        accountId,
        checkType: 'ping',
        status: 'error',
        responseTime: 0,
        message: error instanceof Error ? error.message : '未知错误'
      };

      await this.saveCheckResults(accountId, [errorResult]);
      return [errorResult];
    }
  }

  /**
   * Ping检查 - 测试基本API连接
   */
  private async performPingCheck(account: any): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 解密凭据
      const credentials = await decrypt(account.credentials);
      
      let testUrl: string;
      let headers: Record<string, string> = {};

      // 根据不同提供商设置测试端点
      switch (account.provider.toLowerCase()) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/models';
          headers = {
            'Authorization': `Bearer ${credentials}`,
            'Content-Type': 'application/json'
          };
          break;

        case 'anthropic':
          testUrl = 'https://api.anthropic.com/v1/messages';
          headers = {
            'x-api-key': credentials,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          };
          break;

        case 'google':
          testUrl = `https://generativelanguage.googleapis.com/v1/models?key=${credentials}`;
          break;

        default:
          throw new Error(`不支持的提供商: ${account.provider}`);
      }

      // 执行HTTP请求
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000) // 10秒超时
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          accountId: account.id,
          checkType: 'ping',
          status: 'success',
          responseTime,
          message: `API连接正常 (${response.status})`,
          details: {
            statusCode: response.status,
            provider: account.provider
          }
        };
      } else {
        return {
          accountId: account.id,
          checkType: 'ping',
          status: 'error',
          responseTime,
          message: `API连接失败: ${response.status} ${response.statusText}`,
          details: {
            statusCode: response.status,
            statusText: response.statusText
          }
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'TimeoutError') {
        return {
          accountId: account.id,
          checkType: 'ping',
          status: 'timeout',
          responseTime,
          message: 'API请求超时'
        };
      }

      return {
        accountId: account.id,
        checkType: 'ping',
        status: 'error',
        responseTime,
        message: error instanceof Error ? error.message : '连接失败'
      };
    }
  }

  /**
   * 配额检查 - 检查API使用限制和余额
   */
  private async performQuotaCheck(account: any): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // 这里可以根据不同提供商实现具体的配额检查逻辑
      // 目前返回基本的模拟检查结果
      
      const responseTime = Date.now() - startTime;
      
      // 模拟配额检查 - 实际实现中应该调用相应的API
      const quotaUsage = Math.random() * 100; // 模拟使用率
      
      let status: 'success' | 'warning' | 'error' = 'success';
      let message = '配额使用正常';

      if (quotaUsage > 90) {
        status = 'error';
        message = '配额使用率过高 (>90%)';
      } else if (quotaUsage > 75) {
        status = 'warning';
        message = '配额使用率较高 (>75%)';
      }

      return {
        accountId: account.id,
        checkType: 'quota',
        status,
        responseTime,
        message,
        details: {
          quotaUsage: Math.round(quotaUsage),
          provider: account.provider
        }
      };

    } catch (error) {
      return {
        accountId: account.id,
        checkType: 'quota',
        status: 'error',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : '配额检查失败'
      };
    }
  }

  /**
   * 速率限制检查
   */
  private async performRateLimitCheck(account: any): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // 检查最近一小时的请求数量
      const db = await getDb();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const recentRequests = await db.get(`
        SELECT COUNT(*) as count
        FROM account_usage_logs 
        WHERE ai_account_id = ? 
        AND created_at > ?
      `, [account.id, oneHourAgo]);

      const requestCount = recentRequests?.count || 0;
      const maxRequestsPerHour = account.max_requests_per_minute * 60;
      const usageRate = (requestCount / maxRequestsPerHour) * 100;

      let status: 'success' | 'warning' | 'error' = 'success';
      let message = '速率限制正常';

      if (usageRate > 90) {
        status = 'error';
        message = `请求速率过高 (${Math.round(usageRate)}%)`;
      } else if (usageRate > 75) {
        status = 'warning';
        message = `请求速率较高 (${Math.round(usageRate)}%)`;
      }

      return {
        accountId: account.id,
        checkType: 'rate_limit',
        status,
        responseTime: Date.now() - startTime,
        message,
        details: {
          requestCount,
          maxRequestsPerHour,
          usageRate: Math.round(usageRate)
        }
      };

    } catch (error) {
      return {
        accountId: account.id,
        checkType: 'rate_limit',
        status: 'error',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : '速率检查失败'
      };
    }
  }

  /**
   * 保存检查结果到数据库
   */
  private async saveCheckResults(accountId: string, results: HealthCheckResult[]): Promise<void> {
    const db = await getDb();

    for (const result of results) {
      await db.run(`
        INSERT INTO account_health_checks (
          ai_account_id, check_type, check_status,
          response_time_ms, status_message, check_details,
          checked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        accountId,
        result.checkType,
        result.status,
        result.responseTime,
        result.message,
        JSON.stringify(result.details || {}),
        new Date().toISOString()
      ]);
    }
  }

  /**
   * 更新账号健康分数
   */
  private async updateHealthScore(accountId: string, results: HealthCheckResult[]): Promise<void> {
    const db = await getDb();

    // 计算健康分数
    let healthScore = 100;
    let errorCount = 0;

    for (const result of results) {
      switch (result.status) {
        case 'success':
          break; // 满分
        case 'warning':
          healthScore -= 10;
          break;
        case 'error':
          healthScore -= 25;
          errorCount++;
          break;
        case 'timeout':
          healthScore -= 20;
          errorCount++;
          break;
      }
    }

    // 确保健康分数在0-100之间
    healthScore = Math.max(0, Math.min(100, healthScore));

    // 计算24小时内错误次数
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentErrors = await db.get(`
      SELECT COUNT(*) as count
      FROM account_health_checks 
      WHERE ai_account_id = ? 
      AND check_status IN ('error', 'timeout')
      AND checked_at > ?
    `, [accountId, twentyFourHoursAgo]);

    const errorCount24h = (recentErrors?.count || 0) + errorCount;

    // 更新账号健康状态
    await db.run(`
      UPDATE ai_accounts 
      SET health_score = ?,
          error_count_24h = ?,
          last_health_check_at = ?,
          last_error_at = CASE 
            WHEN ? > 0 THEN ? 
            ELSE last_error_at 
          END,
          updated_at = ?
      WHERE id = ?
    `, [
      healthScore,
      errorCount24h,
      new Date().toISOString(),
      errorCount,
      errorCount > 0 ? new Date().toISOString() : null,
      new Date().toISOString(),
      accountId
    ]);

    console.log(`账号 ${accountId} 健康分数更新为: ${healthScore} (24h错误数: ${errorCount24h})`);
  }

  /**
   * 检查所有活跃的AI账号
   */
  async checkAllAccounts(): Promise<void> {
    if (this.isRunning) {
      console.log('健康检查已在运行中，跳过');
      return;
    }

    this.isRunning = true;
    console.log('开始全量健康检查...');

    try {
      const db = await getDb();
      const accounts = await db.all(`
        SELECT id, account_name, provider 
        FROM ai_accounts 
        WHERE account_status = 'active'
        ORDER BY last_health_check_at ASC NULLS FIRST
      `);

      console.log(`发现 ${accounts.length} 个活跃账号需要检查`);

      // 并发检查，但限制并发数量避免过载
      const concurrency = 3;
      const batches = [];
      
      for (let i = 0; i < accounts.length; i += concurrency) {
        batches.push(accounts.slice(i, i + concurrency));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(account => 
            this.checkAccount(account.id).catch(error => {
              console.error(`检查账号 ${account.account_name} 失败:`, error);
            })
          )
        );
        
        // 批次间稍微延迟，避免请求过于密集
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('✅ 全量健康检查完成');

    } catch (error) {
      console.error('全量健康检查失败:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 清理过期的健康检查记录
   */
  async cleanupOldRecords(): Promise<void> {
    const db = await getDb();
    
    // 保留30天的健康检查记录
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const result = await db.run(`
      DELETE FROM account_health_checks 
      WHERE checked_at < ?
    `, [thirtyDaysAgo]);

    console.log(`清理了 ${result.changes} 条过期的健康检查记录`);
  }
}

export const healthChecker = HealthChecker.getInstance();