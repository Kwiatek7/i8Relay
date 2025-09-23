import { notificationTriggerService } from './trigger-service';

/**
 * 便捷的通知触发器函数
 * 可以在业务代码中直接调用
 */

// 检查用户余额并触发通知
export async function checkBalanceNotification(userId: string, currentBalance: number): Promise<void> {
  try {
    await notificationTriggerService.checkAndTrigger('balance_low', {
      userId,
      balance: currentBalance,
      threshold: 10 // 可以从配置中读取
    });
  } catch (error) {
    console.error('检查余额通知失败:', error);
  }
}

// 检查套餐到期并触发通知
export async function checkSubscriptionExpiryNotification(
  userId: string,
  planName: string,
  expiryDate: Date
): Promise<void> {
  try {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry > 0) {
      await notificationTriggerService.checkAndTrigger('subscription_expiring', {
        userId,
        planName,
        daysUntilExpiry,
        expireDate: expiryDate.toLocaleDateString('zh-CN')
      });
    }
  } catch (error) {
    console.error('检查套餐到期通知失败:', error);
  }
}

// 检查使用量并触发通知
export async function checkUsageLimitNotification(
  userId: string,
  resourceType: string,
  currentUsage: number,
  limit: number
): Promise<void> {
  try {
    const usagePercent = Math.round((currentUsage / limit) * 100);

    await notificationTriggerService.checkAndTrigger('usage_limit', {
      userId,
      resourceType,
      usagePercent,
      currentUsage,
      limit
    });
  } catch (error) {
    console.error('检查使用量通知失败:', error);
  }
}

// 支付失败通知
export async function triggerPaymentFailedNotification(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  try {
    await notificationTriggerService.checkAndTrigger('payment_failed', {
      userId,
      amount,
      reason
    });
  } catch (error) {
    console.error('发送支付失败通知失败:', error);
  }
}

// 异常登录通知
export async function triggerLoginSecurityNotification(
  userId: string,
  loginTime: Date,
  location: string,
  ip: string
): Promise<void> {
  try {
    await notificationTriggerService.checkAndTrigger('login_security', {
      userId,
      loginTime: loginTime.toLocaleString('zh-CN'),
      location,
      ip
    });
  } catch (error) {
    console.error('发送异常登录通知失败:', error);
  }
}

// 系统维护通知（群发）
export async function triggerSystemMaintenanceNotification(
  startTime: Date,
  endTime: Date
): Promise<void> {
  try {
    await notificationTriggerService.checkAndTrigger('system_maintenance', {
      start_time: startTime.toLocaleString('zh-CN'),
      end_time: endTime.toLocaleString('zh-CN')
    });
  } catch (error) {
    console.error('发送系统维护通知失败:', error);
  }
}

// 批量检查所有用户的余额（定时任务可用）
export async function batchCheckBalanceNotifications(): Promise<void> {
  try {
    // 这里可以获取所有用户的余额信息并逐一检查
    // 实际实现时可以根据业务需求来获取用户数据
    console.log('批量检查余额通知 - 待实现具体的用户数据获取逻辑');
  } catch (error) {
    console.error('批量检查余额通知失败:', error);
  }
}

// 批量检查所有用户的套餐到期（定时任务可用）
export async function batchCheckSubscriptionExpiryNotifications(): Promise<void> {
  try {
    // 这里可以获取所有用户的套餐信息并逐一检查
    // 实际实现时可以根据业务需求来获取用户数据
    console.log('批量检查套餐到期通知 - 待实现具体的用户数据获取逻辑');
  } catch (error) {
    console.error('批量检查套餐到期通知失败:', error);
  }
}

// 批量检查所有用户的使用量（定时任务可用）
export async function batchCheckUsageLimitNotifications(): Promise<void> {
  try {
    // 这里可以获取所有用户的使用量信息并逐一检查
    // 实际实现时可以根据业务需求来获取用户数据
    console.log('批量检查使用量通知 - 待实现具体的用户数据获取逻辑');
  } catch (error) {
    console.error('批量检查使用量通知失败:', error);
  }
}