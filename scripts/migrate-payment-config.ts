#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb } from '../lib/database/connection';

/**
 * 执行支付提供商配置迁移
 */
async function runPaymentConfigMigration() {
  console.log('🚀 开始执行支付提供商配置迁移...');

  try {
    // 获取数据库连接
    const db = await getDb();

    // 读取迁移 SQL 文件
    const migrationSqlPath = join(process.cwd(), 'database/migrations/add_payment_providers_config.sql');
    const migrationSql = readFileSync(migrationSqlPath, 'utf-8');

    // 分割 SQL 语句（按分号分割）
    const sqlStatements = migrationSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    console.log(`📝 准备执行 ${sqlStatements.length} 条 SQL 语句...`);

    // 执行每条 SQL 语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`   执行语句 ${i + 1}/${sqlStatements.length}...`);

      try {
        await db.run(statement);
        console.log(`   ✅ 语句 ${i + 1} 执行成功`);
      } catch (error) {
        // 检查是否是"列已存在"的错误，如果是则忽略
        if (error instanceof Error && error.message.includes('duplicate column name')) {
          console.log(`   ⚠️  语句 ${i + 1} 跳过（列已存在）: ${error.message}`);
          continue;
        }

        console.error(`   ❌ 语句 ${i + 1} 执行失败:`, error);
        throw error;
      }
    }

    console.log('🎉 支付提供商配置迁移完成！');

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
    // 检查是否存在默认配置记录
    const config = await db.get('SELECT id FROM site_config WHERE id = ?', ['default']);
    if (config) {
      console.log('✅ 默认配置记录存在');
    } else {
      console.log('⚠️  默认配置记录不存在，正在创建...');
      await db.run('INSERT INTO site_config (id) VALUES (?)', ['default']);
      console.log('✅ 默认配置记录已创建');
    }

    // 检查关键字段是否存在（通过查询测试）
    const testFields = [
      'default_payment_provider',
      'stripe_enabled',
      'stripe_publishable_key',
      'epay_enabled',
      'epay_merchant_id'
    ];

    for (const field of testFields) {
      try {
        await db.get(`SELECT ${field} FROM site_config WHERE id = ? LIMIT 1`, ['default']);
        console.log(`✅ 字段 ${field} 存在`);
      } catch (error) {
        console.log(`❌ 字段 ${field} 不存在:`, error);
      }
    }

    console.log('🎯 迁移验证完成');

  } catch (error) {
    console.error('验证过程中出错:', error);
  }
}

// 运行迁移
if (require.main === module) {
  runPaymentConfigMigration().catch(console.error);
}

export { runPaymentConfigMigration };