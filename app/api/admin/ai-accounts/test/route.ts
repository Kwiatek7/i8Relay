import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth/jwt';
import { aiAccountModel } from '../../../../../lib/database/models/ai-account';
import { decrypt } from '../../../../../lib/utils/encryption';

// AI账号测试接口
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
    const { accountId, testType = 'ping' } = body;

    if (!accountId) {
      return NextResponse.json({
        success: false,
        message: '缺少必填字段：accountId'
      }, { status: 400 });
    }

    // 获取账号信息
    const account = await aiAccountModel.getById(accountId);
    if (!account) {
      return NextResponse.json({
        success: false,
        message: 'AI账号不存在'
      }, { status: 404 });
    }

    // 解密凭据进行测试
    let credentials;
    try {
      credentials = decrypt(account.credentials);
    } catch (error) {
      return NextResponse.json({
        success: false,
        testResults: [{
          type: 'credentials',
          status: 'failed',
          message: '凭据解密失败',
          timestamp: new Date().toISOString(),
          error: '凭据可能已损坏或加密密钥不正确'
        }]
      });
    }

    const testResults = [];

    // 1. 凭据格式验证
    testResults.push({
      type: 'credentials',
      status: credentials && credentials.length > 10 ? 'passed' : 'failed',
      message: credentials && credentials.length > 10 ? '凭据格式验证通过' : '凭据格式无效',
      timestamp: new Date().toISOString()
    });

    // 2. API连接测试
    if (testType === 'ping' || testType === 'full') {
      const pingResult = await performApiPingTest(account.provider, credentials);
      testResults.push(pingResult);
    }

    // 3. API调用测试（完整测试）
    if (testType === 'full') {
      const apiResult = await performApiCallTest(account.provider, credentials);
      testResults.push(apiResult);
    }

    // 4. 速率限制测试
    if (testType === 'full') {
      const rateLimitResult = await performRateLimitTest(account.provider, credentials);
      testResults.push(rateLimitResult);
    }

    // 更新账号健康评分
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const healthScore = Math.max(0, (testResults.length - failedTests) / testResults.length);

    await aiAccountModel.update(accountId, {
      health_score: healthScore,
      last_health_check_at: new Date().toISOString(),
      ...(failedTests > 0 && {
        error_count_24h: account.error_count_24h + 1,
        last_error_at: new Date().toISOString()
      })
    });

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        accountName: account.account_name,
        provider: account.provider,
        testType,
        testResults,
        overallStatus: failedTests === 0 ? 'healthy' : failedTests < testResults.length ? 'warning' : 'failed',
        healthScore: Math.round(healthScore * 100),
        timestamp: new Date().toISOString()
      },
      message: '账号测试完成'
    });

  } catch (error) {
    console.error('AI账号测试错误:', error);
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// API连接测试
async function performApiPingTest(provider: string, credentials: string) {
  const startTime = Date.now();

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
        throw new Error(`不支持的AI服务提供商: ${provider}`);
    }

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    const responseTime = Date.now() - startTime;

    return {
      type: 'api_ping',
      status: response.ok ? 'passed' : 'failed',
      message: response.ok ? 'API连接测试通过' : `API连接失败: ${response.status} ${response.statusText}`,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      statusCode: response.status
    };

  } catch (error) {
    return {
      type: 'api_ping',
      status: 'failed',
      message: 'API连接测试失败',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : '网络错误'
    };
  }
}

// API调用测试
async function performApiCallTest(provider: string, credentials: string) {
  const startTime = Date.now();

  try {
    let testPayload;
    let testEndpoint = '';
    let headers: Record<string, string> = {};

    switch (provider.toLowerCase()) {
      case 'openai':
        testEndpoint = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${credentials}`,
          'Content-Type': 'application/json'
        };
        testPayload = {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello, this is a test.' }],
          max_tokens: 5
        };
        break;
      case 'anthropic':
        testEndpoint = 'https://api.anthropic.com/v1/messages';
        headers = {
          'x-api-key': credentials,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        };
        testPayload = {
          model: 'claude-3-haiku-20240307',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hello, this is a test.' }]
        };
        break;
      default:
        return {
          type: 'api_call',
          status: 'skipped',
          message: '该提供商暂不支持API调用测试',
          timestamp: new Date().toISOString()
        };
    }

    const response = await fetch(testEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(15000) // 15秒超时
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        type: 'api_call',
        status: 'passed',
        message: 'API调用测试通过',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        statusCode: response.status
      };
    } else {
      const errorText = await response.text();
      return {
        type: 'api_call',
        status: 'failed',
        message: `API调用失败: ${response.status}`,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        statusCode: response.status,
        error: errorText.substring(0, 200)
      };
    }

  } catch (error) {
    return {
      type: 'api_call',
      status: 'failed',
      message: 'API调用测试失败',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : '请求超时或网络错误'
    };
  }
}

// 速率限制测试
async function performRateLimitTest(provider: string, credentials: string) {
  try {
    // 简单的速率限制测试 - 检查响应头
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
      default:
        return {
          type: 'rate_limit',
          status: 'skipped',
          message: '该提供商暂不支持速率限制测试',
          timestamp: new Date().toISOString()
        };
    }

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000)
    });

    // 检查速率限制相关的响应头
    const rateLimitInfo: Record<string, string> = {};

    if (provider.toLowerCase() === 'openai') {
      rateLimitInfo['requests_remaining'] = response.headers.get('x-ratelimit-remaining-requests') || 'N/A';
      rateLimitInfo['tokens_remaining'] = response.headers.get('x-ratelimit-remaining-tokens') || 'N/A';
    }

    return {
      type: 'rate_limit',
      status: response.status === 429 ? 'warning' : 'passed',
      message: response.status === 429 ? '触发速率限制' : '速率限制检查通过',
      timestamp: new Date().toISOString(),
      statusCode: response.status,
      rateLimitInfo
    };

  } catch (error) {
    return {
      type: 'rate_limit',
      status: 'failed',
      message: '速率限制测试失败',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '网络错误'
    };
  }
}