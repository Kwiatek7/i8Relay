#!/usr/bin/env tsx

import { getDb } from '../lib/database/connection';

/**
 * 创建测试通知数据
 */
async function createTestNotifications() {
  console.log('🚀 开始创建测试通知数据...');

  try {
    const db = await getDb();

    // 首先确保有测试用户存在
    console.log('📝 检查测试用户...');
    let testUser = await db.get('SELECT id FROM users WHERE email = ?', ['test@example.com']);

    if (!testUser) {
      console.log('   创建测试用户...');
      const userId = 'user_test_' + Math.random().toString(36).substr(2, 8);
      await db.run(`
        INSERT INTO users (id, username, email, password_hash, salt, api_key)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userId,
        'testuser',
        'test@example.com',
        'test_hash',
        'test_salt',
        'sk-test-key'
      ]);
      testUser = { id: userId };
      console.log('   ✅ 测试用户创建成功:', userId);
    } else {
      console.log('   ✅ 测试用户已存在:', testUser.id);
    }

    // 清空现有的测试通知
    console.log('📝 清空现有测试通知...');
    await db.run('DELETE FROM user_notifications WHERE user_id = ?', [testUser.id]);
    console.log('   ✅ 现有通知已清空');

    // 创建测试通知
    const testNotifications = [
      {
        id: 'notif_test_001',
        title: '账户余额不足',
        message: '您的账户余额仅剩 $5.23，建议及时充值以避免服务中断。',
        type: 'billing',
        priority: 'high',
        is_read: false,
        action_url: '/dashboard/billing',
        created_at: "datetime('now', '-2 hours')"
      },
      {
        id: 'notif_test_002',
        title: '系统维护通知',
        message: '系统将于今晚 22:00-24:00 进行例行维护，期间服务可能会短暂中断。',
        type: 'system',
        priority: 'medium',
        is_read: false,
        action_url: null,
        created_at: "datetime('now', '-5 hours')"
      },
      {
        id: 'notif_test_003',
        title: '密码安全提醒',
        message: '检测到您的密码已使用超过 90 天，建议及时更换密码确保账户安全。',
        type: 'security',
        priority: 'medium',
        is_read: true,
        action_url: '/dashboard/profile',
        created_at: "datetime('now', '-1 day')"
      },
      {
        id: 'notif_test_004',
        title: 'API 密钥即将过期',
        message: '您的 API 密钥将在 7 天后过期，请及时更新以确保服务正常使用。',
        type: 'warning',
        priority: 'high',
        is_read: true,
        action_url: '/dashboard/profile',
        created_at: "datetime('now', '-1 day')"
      },
      {
        id: 'notif_test_005',
        title: '新功能上线',
        message: '我们推出了全新的使用统计功能，现在您可以更详细地了解API使用情况。',
        type: 'info',
        priority: 'low',
        is_read: true,
        action_url: '/dashboard/usage',
        created_at: "datetime('now', '-3 days')"
      },
      {
        id: 'notif_test_006',
        title: '账单支付成功',
        message: '您的月度账单 $29.99 已支付成功，感谢您的使用。',
        type: 'success',
        priority: 'low',
        is_read: true,
        action_url: '/dashboard/billing',
        created_at: "datetime('now', '-4 days')"
      }
    ];

    console.log('📝 创建测试通知...');
    for (let i = 0; i < testNotifications.length; i++) {
      const notification = testNotifications[i];
      try {
        await db.run(`
          INSERT INTO user_notifications
          (id, user_id, title, message, type, priority, is_read, action_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${notification.created_at})
        `, [
          notification.id,
          testUser.id,
          notification.title,
          notification.message,
          notification.type,
          notification.priority,
          notification.is_read ? 1 : 0,
          notification.action_url
        ]);
        console.log(`   ✅ 通知 ${i + 1}/${testNotifications.length} 创建成功: ${notification.title}`);
      } catch (error) {
        console.error(`   ❌ 通知 ${i + 1} 创建失败:`, error);
      }
    }

    // 验证结果
    console.log('🔍 验证测试数据...');
    const count = await db.get(
      'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ?',
      [testUser.id]
    );
    const unreadCount = await db.get(
      'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0',
      [testUser.id]
    );

    console.log(`📊 测试数据创建完成:`);
    console.log(`   - 总通知数: ${count.count}`);
    console.log(`   - 未读通知: ${unreadCount.count}`);
    console.log(`   - 测试用户: ${testUser.id} (test@example.com)`);

    console.log('🎉 测试数据创建成功！');
    console.log('');
    console.log('💡 测试说明:');
    console.log('   1. 访问 http://localhost:3000/dashboard/notifications');
    console.log('   2. 使用测试用户登录 (test@example.com)');
    console.log('   3. 测试各种通知功能：筛选、标记已读、删除等');

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  createTestNotifications().catch(console.error);
}

export { createTestNotifications };