import { notificationTriggerService } from '../lib/notifications/trigger-service';
import {
  checkBalanceNotification,
  triggerPaymentFailedNotification,
  triggerLoginSecurityNotification
} from '../lib/notifications/triggers';

async function testNotificationSystem() {
  console.log('🧪 开始测试通知系统...\n');

  try {
    // 测试1: 余额不足通知
    console.log('1️⃣ 测试余额不足通知...');
    await checkBalanceNotification('user-001', 5); // 余额低于阈值
    console.log('✅ 余额不足通知测试完成\n');

    // 测试2: 支付失败通知
    console.log('2️⃣ 测试支付失败通知...');
    await triggerPaymentFailedNotification('user-001', 99, '银行卡余额不足');
    console.log('✅ 支付失败通知测试完成\n');

    // 测试3: 异常登录通知
    console.log('3️⃣ 测试异常登录通知...');
    await triggerLoginSecurityNotification('user-001', new Date(), '北京市', '192.168.1.100');
    console.log('✅ 异常登录通知测试完成\n');

    // 测试4: 套餐到期通知
    console.log('4️⃣ 测试套餐到期通知...');
    const result1 = await notificationTriggerService.checkAndTrigger('subscription_expiring', {
      userId: 'user-001',
      planName: '基础套餐',
      daysUntilExpiry: 3,
      expireDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
    });
    console.log('套餐到期通知结果:', result1);
    console.log('✅ 套餐到期通知测试完成\n');

    // 测试5: 使用量超限通知
    console.log('5️⃣ 测试使用量超限通知...');
    const result2 = await notificationTriggerService.checkAndTrigger('usage_limit', {
      userId: 'user-001',
      resourceType: 'API调用',
      usagePercent: 85,
      currentUsage: 850,
      limit: 1000
    });
    console.log('使用量超限通知结果:', result2);
    console.log('✅ 使用量超限通知测试完成\n');

    console.log('🎉 所有通知测试完成！');

  } catch (error) {
    console.error('❌ 通知测试失败:', error);
  }
}

// 运行测试
testNotificationSystem();