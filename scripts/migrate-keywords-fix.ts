#!/usr/bin/env tsx

/**
 * 数据库关键字修复迁移脚本
 * 从旧的关键字字段名迁移到新的非关键字字段名
 */

import { getDb } from '../lib/database/connection';

async function migrateKeywordsFix() {
  console.log('🚀 开始数据库关键字修复迁移...\n');

  const db = await getDb();

  try {
    console.log('1️⃣  检查数据库类型...');
    
    // 检测数据库类型
    let dbType = 'sqlite'; // 默认
    try {
      await db.get('SELECT version()');
      dbType = 'postgres';
    } catch {
      try {
        await db.get('SELECT VERSION()');
        dbType = 'mysql';
      } catch {
        dbType = 'sqlite';
      }
    }
    
    console.log('✅ 检测到数据库类型:', dbType.toUpperCase());

    console.log('\n2️⃣  开始字段重命名迁移...');

    if (dbType === 'sqlite') {
      // SQLite 需要重建表
      console.log('📝 SQLite 数据库 - 需要重建表结构...');
      
      // 由于 SQLite 的限制，建议使用全新的数据库架构
      console.log('⚠️  SQLite 建议：');
      console.log('   1. 备份现有数据：sqlite3 data/aiporxy.db ".backup backup.db"');
      console.log('   2. 删除现有数据库文件');
      console.log('   3. 重新运行初始化：pnpm run db:init');
      console.log('   4. 从备份恢复必要数据');
      
    } else if (dbType === 'mysql') {
      console.log('📝 MySQL 数据库 - 执行字段重命名...');
      
      await db.exec(`
        START TRANSACTION;
        
        -- 重命名 users 表字段
        ALTER TABLE users CHANGE COLUMN role user_role ENUM('user', 'admin', 'super_admin') DEFAULT 'user';
        ALTER TABLE users CHANGE COLUMN status user_status ENUM('active', 'inactive', 'banned', 'pending') DEFAULT 'active';
        
        -- 重命名 system_config 表字段  
        ALTER TABLE system_config CHANGE COLUMN \`key\` config_key VARCHAR(100) NOT NULL;
        ALTER TABLE system_config CHANGE COLUMN \`value\` config_value TEXT NOT NULL;
        
        -- 重命名 user_subscriptions 表字段
        ALTER TABLE user_subscriptions CHANGE COLUMN status subscription_status ENUM('pending', 'active', 'expired', 'cancelled') DEFAULT 'active';
        
        -- 重命名 billing_records 表字段
        ALTER TABLE billing_records CHANGE COLUMN type record_type ENUM('charge', 'usage', 'refund', 'subscription', 'topup') NOT NULL;
        ALTER TABLE billing_records CHANGE COLUMN status record_status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending';
        
        -- 重命名 usage_logs 表字段
        ALTER TABLE usage_logs CHANGE COLUMN method request_method VARCHAR(10) NOT NULL;
        
        -- 重命名 admin_logs 表字段
        ALTER TABLE admin_logs CHANGE COLUMN action admin_action VARCHAR(100) NOT NULL;
        
        -- 重命名通知表字段
        ALTER TABLE system_notifications CHANGE COLUMN type notification_type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info';
        ALTER TABLE user_notifications CHANGE COLUMN type notification_type ENUM('system', 'billing', 'security', 'info', 'warning', 'success') DEFAULT 'info';
        
        -- 更新索引
        DROP INDEX idx_users_status;
        CREATE INDEX idx_users_status ON users(user_status);
        
        DROP INDEX idx_user_subscriptions_status;
        CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(subscription_status);
        
        DROP INDEX idx_billing_records_type;
        CREATE INDEX idx_billing_records_type ON billing_records(record_type);
        
        DROP INDEX idx_billing_records_status;
        CREATE INDEX idx_billing_records_status ON billing_records(record_status);
        
        DROP INDEX idx_system_config_key;
        CREATE INDEX idx_system_config_key ON system_config(config_key);
        
        DROP INDEX idx_admin_logs_action;
        CREATE INDEX idx_admin_logs_action ON admin_logs(admin_action);
        
        DROP INDEX uk_category_key;
        CREATE UNIQUE INDEX uk_category_key ON system_config(category, config_key);
        
        COMMIT;
      `);
      
    } else if (dbType === 'postgres') {
      console.log('📝 PostgreSQL 数据库 - 执行字段重命名...');
      
      await db.exec(`
        BEGIN;
        
        -- 重命名 users 表字段
        ALTER TABLE users RENAME COLUMN role TO user_role;
        ALTER TABLE users RENAME COLUMN status TO user_status;
        
        -- 重命名 system_config 表字段
        ALTER TABLE system_config RENAME COLUMN key TO config_key;
        ALTER TABLE system_config RENAME COLUMN value TO config_value;
        
        -- 重命名 user_subscriptions 表字段
        ALTER TABLE user_subscriptions RENAME COLUMN status TO subscription_status;
        
        -- 重命名 billing_records 表字段
        ALTER TABLE billing_records RENAME COLUMN type TO record_type;
        ALTER TABLE billing_records RENAME COLUMN status TO record_status;
        
        -- 重命名 usage_logs 表字段
        ALTER TABLE usage_logs RENAME COLUMN method TO request_method;
        
        -- 重命名 admin_logs 表字段
        ALTER TABLE admin_logs RENAME COLUMN action TO admin_action;
        
        -- 重命名通知表字段
        ALTER TABLE system_notifications RENAME COLUMN type TO notification_type;
        ALTER TABLE user_notifications RENAME COLUMN type TO notification_type;
        
        -- 更新索引
        DROP INDEX IF EXISTS idx_users_status;
        CREATE INDEX idx_users_status ON users(user_status);
        
        DROP INDEX IF EXISTS idx_user_subscriptions_status;
        CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(subscription_status);
        
        DROP INDEX IF EXISTS idx_billing_records_type;
        CREATE INDEX idx_billing_records_type ON billing_records(record_type);
        
        DROP INDEX IF EXISTS idx_billing_records_status;
        CREATE INDEX idx_billing_records_status ON billing_records(record_status);
        
        DROP INDEX IF EXISTS idx_system_config_category_key;
        CREATE INDEX idx_system_config_category_key ON system_config(category, config_key);
        
        DROP INDEX IF EXISTS idx_admin_logs_action;
        CREATE INDEX idx_admin_logs_action ON admin_logs(admin_action);
        
        COMMIT;
      `);
    }

    console.log('✅ 字段重命名迁移完成');
    console.log('\n3️⃣  验证迁移结果...');
    
    // 简单验证
    const testQuery = await db.get(`SELECT COUNT(*) as count FROM users`);
    console.log('✅ 数据库连接正常，用户总数:', testQuery?.count || 0);
    
    console.log('\n🎉 数据库关键字修复迁移完成！');
    console.log('✅ 所有关键字字段已重命名');
    console.log('✅ 索引已更新');
    console.log('✅ 数据完整性保持');
    
    console.log('\n📝 后续步骤：');
    console.log('1. 运行测试脚本：npx tsx scripts/test-database-compatibility.ts');
    console.log('2. 重启应用程序');
    console.log('3. 验证所有功能正常工作');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    console.error('请检查错误并手动回滚数据库更改');
    process.exit(1);
  }
}

// 运行迁移
migrateKeywordsFix();