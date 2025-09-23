#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb } from '../lib/database/connection';

/**
 * 执行用户通知迁移
 */
async function runNotificationMigration() {
  console.log('🚀 开始执行用户通知迁移...');

  try {
    // 获取数据库连接
    const db = await getDb();

    // 读取迁移 SQL 文件
    const migrationSqlPath = join(process.cwd(), 'database/migrations/create_user_notifications.sql');
    const migrationSql = readFileSync(migrationSqlPath, 'utf-8');

    // 步骤1: 创建表
    console.log('📝 步骤1: 创建用户通知表...');
    try {
      await db.run(`
        CREATE TABLE IF NOT EXISTS user_notifications (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info' CHECK (type IN ('system', 'billing', 'security', 'info', 'warning', 'success')),
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          is_read BOOLEAN DEFAULT false,
          action_url TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('   ✅ 用户通知表创建成功');
    } catch (error) {
      if (error instanceof Error && error.message.includes('table user_notifications already exists')) {
        console.log('   ⚠️  用户通知表已存在');
      } else {
        console.error('   ❌ 创建表失败:', error);
        throw error;
      }
    }

    // 步骤2: 创建索引
    console.log('📝 步骤2: 创建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read)',
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type)',
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_priority ON user_notifications(priority)',
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON user_notifications(user_id, is_read)'
    ];

    for (let i = 0; i < indexes.length; i++) {
      try {
        await db.run(indexes[i]);
        console.log(`   ✅ 索引 ${i + 1}/${indexes.length} 创建成功`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`   ⚠️  索引 ${i + 1} 已存在`);
        } else {
          console.error(`   ❌ 索引 ${i + 1} 创建失败:`, error);
        }
      }
    }

    // 步骤3: 插入示例数据
    console.log('📝 步骤3: 插入示例数据...');
    const sampleData = [
      {
        id: 'notif_001',
        user_id: 'user_test',
        title: '账户余额不足',
        message: '您的账户余额仅剩 $5.23，建议及时充值以避免服务中断。',
        type: 'billing',
        priority: 'high',
        is_read: false,
        action_url: '/dashboard/billing',
        created_at: "datetime('now', '-2 hours')"
      },
      {
        id: 'notif_002',
        user_id: 'user_test',
        title: '系统维护通知',
        message: '系统将于今晚 22:00-24:00 进行例行维护，期间服务可能会短暂中断。',
        type: 'system',
        priority: 'medium',
        is_read: false,
        action_url: null,
        created_at: "datetime('now', '-5 hours')"
      },
      {
        id: 'notif_003',
        user_id: 'user_test',
        title: '密码安全提醒',
        message: '检测到您的密码已使用超过 90 天，建议及时更换密码确保账户安全。',
        type: 'security',
        priority: 'medium',
        is_read: true,
        action_url: '/dashboard/profile',
        created_at: "datetime('now', '-1 day')"
      },
      {
        id: 'notif_004',
        user_id: 'user_test',
        title: 'API 密钥即将过期',
        message: '您的 API 密钥将在 7 天后过期，请及时更新以确保服务正常使用。',
        type: 'warning',
        priority: 'high',
        is_read: true,
        action_url: '/dashboard/profile',
        created_at: "datetime('now', '-1 day')"
      },
      {
        id: 'notif_005',
        user_id: 'user_test',
        title: '新功能上线',
        message: '我们推出了全新的使用统计功能，现在您可以更详细地了解API使用情况。',
        type: 'info',
        priority: 'low',
        is_read: true,
        action_url: '/dashboard/usage',
        created_at: "datetime('now', '-3 days')"
      },
      {
        id: 'notif_006',
        user_id: 'user_test',
        title: '账单支付成功',
        message: '您的月度账单 $29.99 已支付成功，感谢您的使用。',
        type: 'success',
        priority: 'low',
        is_read: true,
        action_url: '/dashboard/billing',
        created_at: "datetime('now', '-4 days')"
      }
    ];

    for (let i = 0; i < sampleData.length; i++) {
      const notification = sampleData[i];
      try {
        await db.run(`
          INSERT OR IGNORE INTO user_notifications
          (id, user_id, title, message, type, priority, is_read, action_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${notification.created_at})
        `, [
          notification.id,
          notification.user_id,
          notification.title,
          notification.message,
          notification.type,
          notification.priority,
          notification.is_read ? 1 : 0,
          notification.action_url
        ]);
        console.log(`   ✅ 示例数据 ${i + 1}/${sampleData.length} 插入成功`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
          console.log(`   ⚠️  示例数据 ${i + 1} 已存在`);
        } else {
          console.error(`   ❌ 示例数据 ${i + 1} 插入失败:`, error);
        }
      }
    }

    console.log('🎉 用户通知迁移完成！');

    // 验证迁移结果
    await verifyMigration(db);

  } catch (error) {
    console.error('❌ 迁移执行失败:', error);
    process.exit(1);
  }
}

/**
 * 验证迁移结果
 */
async function verifyMigration(db: any) {
  console.log('🔍 验证迁移结果...');

  try {
    // 检查表是否存在
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_notifications'"
    );

    if (tableExists) {
      console.log('✅ user_notifications 表存在');
    } else {
      console.log('❌ user_notifications 表不存在');
      return;
    }

    // 检查表结构
    const tableInfo = await db.all('PRAGMA table_info(user_notifications)');
    console.log('📋 表结构:');
    tableInfo.forEach((column: any) => {
      console.log(`   - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
    });

    // 检查示例数据
    const sampleCount = await db.get('SELECT COUNT(*) as count FROM user_notifications');
    console.log(`📊 示例数据: ${sampleCount.count} 条记录`);

    // 检查索引
    const indexes = await db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='user_notifications'");
    console.log('🔗 索引:');
    indexes.forEach((index: any) => {
      console.log(`   - ${index.name}`);
    });

    console.log('🎯 迁移验证完成');

  } catch (error) {
    console.error('验证过程中出错:', error);
  }
}

// 运行迁移
if (require.main === module) {
  runNotificationMigration().catch(console.error);
}

export { runNotificationMigration };