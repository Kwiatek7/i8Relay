import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../../lib/auth/jwt';
import { aiAccountModel } from '../../../../../../lib/database/models/ai-account';
import { decrypt } from '../../../../../../lib/utils/encryption';

// 批量健康检查
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { accountIds } = body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请提供要检查的账号ID列表'
      }, { status: 400 });
    }

    let healthyCount = 0;
    let warningCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    // 批量健康检查
    for (const accountId of accountIds) {
      try {
        const account = await aiAccountModel.getById(accountId);
        if (!account) {
          failedCount++;
          results.push({
            accountId,
            accountName: 'Unknown',
            status: 'failed',
            message: '账号不存在',
            healthScore: 0
          });
          continue;
        }

        // 执行健康检查
        const healthResult = await performHealthCheck(account);
        results.push(healthResult);

        // 统计结果
        if (healthResult.healthScore >= 80) {
          healthyCount++;
        } else if (healthResult.healthScore >= 60) {
          warningCount++;
        } else {
          failedCount++;
        }

        // 更新账号健康评分
        await aiAccountModel.update(accountId, {
          health_score: healthResult.healthScore,
          last_health_check_at: new Date().toISOString(),
          ...(healthResult.status === 'failed' && {
            error_count_24h: account.error_count_24h + 1,
            last_error_at: new Date().toISOString()
          })
        });

      } catch (error) {
        failedCount++;
        results.push({
          accountId,
          accountName: 'Unknown',
          status: 'failed',
          message: error instanceof Error ? error.message : '健康检查失败',
          healthScore: 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalChecked: accountIds.length,
        healthyCount,
        warningCount,
        failedCount,
        results
      },
      healthyCount,
      warningCount,
      failedCount,
      message: `批量健康检查完成：${healthyCount} 健康，${warningCount} 警告，${failedCount} 失败`
    });

  } catch (error) {
    console.error('批量健康检查失败:', error);
    return NextResponse.json({
      success: false,
      message: '批量健康检查操作失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 执行单个账号的健康检查
async function performHealthCheck(account: any) {
  const startTime = Date.now();
  let healthScore = 0;
  let status = 'failed';
  let message = '';

  try {
    // 1. 验证凭据格式
    let credentials;
    try {
      credentials = decrypt(account.credentials);
      if (credentials && credentials.length > 10) {
        healthScore += 25; // 凭据格式正确得25分
      }
    } catch (error) {
      return {
        accountId: account.id,
        accountName: account.account_name,
        status: 'failed',
        message: '凭据解密失败',
        healthScore: 0,
        checkTime: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }

    // 2. API连接测试
    const pingResult = await performApiPingTest(account.provider, credentials);
    if (pingResult.success) {
      healthScore += 50; // API连接成功得50分
      if (pingResult.responseTime && pingResult.responseTime < 2000) {
        healthScore += 15; // 响应时间良好额外得15分
      }
    }

    // 3. 基于历史错误率评估
    const errorRate = account.total_requests > 0 ? account.error_count_24h / Math.min(account.total_requests, 100) : 0;
    if (errorRate < 0.05) {
      healthScore += 10; // 错误率低于5%得10分
    } else if (errorRate > 0.2) {
      healthScore -= 10; // 错误率高于20%扣10分
    }

    // 确保健康评分在0-100范围内
    healthScore = Math.max(0, Math.min(100, healthScore));

    // 确定状态和消息
    if (healthScore >= 80) {
      status = 'healthy';
      message = '账号状态良好';
    } else if (healthScore >= 60) {
      status = 'warning';
      message = '账号状态一般，建议关注';
    } else {
      status = 'failed';
      message = '账号状态异常，需要处理';
    }

    return {
      accountId: account.id,
      accountName: account.account_name,
      status,
      message,
      healthScore,
      checkTime: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      accountId: account.id,
      accountName: account.account_name,
      status: 'failed',
      message: `健康检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
      healthScore: 0,
      checkTime: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

// API连接测试
async function performApiPingTest(provider: string, credentials: string) {
  try {
    let testEndpoint = '';
    let headers: Record<string, string> = {};

    switch (provider.toLowerCase()) {
      case 'openai':
        testEndpoint = 'https://api.openai.com/v1/models';
        headers = {
          'Authorization': `Bearer ${credentials}`,
          'Content-Type': 'application/json'
        };
        break;
      case 'anthropic':
        testEndpoint = 'https://api.anthropic.com/v1/messages';
        headers = {
          'x-api-key': credentials,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        };
        break;
      case 'google':
        testEndpoint = `https://generativelanguage.googleapis.com/v1/models?key=${credentials}`;
        break;
      default:
        return {
          success: false,
          message: `不支持的AI服务提供商: ${provider}`,
          responseTime: 0
        };
    }

    const startTime = Date.now();
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000) // 5秒超时
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      message: response.ok ? 'API连接测试通过' : `API连接失败: ${response.status}`,
      responseTime,
      statusCode: response.status
    };

  } catch (error) {
    return {
      success: false,
      message: `网络错误: ${error instanceof Error ? error.message : '连接超时'}`,
      responseTime: 0
    };
  }
}