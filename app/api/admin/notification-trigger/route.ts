import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse, createErrorResponse, AuthError } from '../../../../lib/auth/middleware';
import { notificationTriggerService } from '../../../../lib/notifications/trigger-service';

// 手动触发通知检查
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    // 解析请求体
    const body = await request.json();
    const { triggerType, triggerData } = body;

    // 验证必填字段
    if (!triggerType) {
      return createErrorResponse(new Error('触发器类型不能为空'), 400);
    }

    console.log(`手动触发通知检查: ${triggerType}`, triggerData);

    // 执行触发检查
    const result = await notificationTriggerService.checkAndTrigger(triggerType, triggerData || {});

    return createAuthResponse(result, '通知触发检查完成');

  } catch (error) {
    console.error('手动触发通知失败:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('手动触发通知失败'), 500);
  }
}

// 测试触发器
export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await authenticateRequest(request);
    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return createErrorResponse(new Error('权限不足'), 403);
    }

    const url = new URL(request.url);
    const testType = url.searchParams.get('test');

    let result;

    switch (testType) {
      case 'balance_low':
        result = await notificationTriggerService.checkAndTrigger('balance_low', {
          userId: 'user-001', // 测试用户
          balance: 5, // 余额低于阈值
          threshold: 10
        });
        break;

      case 'subscription_expiring':
        result = await notificationTriggerService.checkAndTrigger('subscription_expiring', {
          userId: 'user-001',
          planName: '基础套餐',
          daysUntilExpiry: 3,
          expireDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
        });
        break;

      case 'usage_limit':
        result = await notificationTriggerService.checkAndTrigger('usage_limit', {
          userId: 'user-001',
          resourceType: 'API调用',
          usagePercent: 85,
          currentUsage: 850,
          limit: 1000
        });
        break;

      case 'payment_failed':
        result = await notificationTriggerService.checkAndTrigger('payment_failed', {
          userId: 'user-001',
          amount: 99,
          reason: '银行卡余额不足'
        });
        break;

      case 'login_security':
        result = await notificationTriggerService.checkAndTrigger('login_security', {
          userId: 'user-001',
          loginTime: new Date().toLocaleString('zh-CN'),
          location: '北京市',
          ip: '192.168.1.100'
        });
        break;

      default:
        return createErrorResponse(new Error('不支持的测试类型'), 400);
    }

    return createAuthResponse(result, `${testType} 测试触发完成`);

  } catch (error) {
    console.error('测试触发器失败:', error);

    if (error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error('测试触发器失败'), 500);
  }
}