#!/usr/bin/env tsx

import { getDb } from '../lib/database/connection';

/**
 * 添加缺失的字段
 */
async function addMissingFields() {
  console.log('🔧 添加缺失的数据库字段...');

  try {
    const db = await getDb();

    // 需要添加的字段
    const fieldsToAdd = [
      {
        table: 'site_config',
        column: 'default_payment_provider',
        definition: 'TEXT DEFAULT \'stripe\''
      },
      {
        table: 'site_config',
        column: 'stripe_enabled',
        definition: 'BOOLEAN DEFAULT false'
      },
      {
        table: 'site_config',
        column: 'epay_enabled',
        definition: 'BOOLEAN DEFAULT false'
      },
      {
        table: 'site_config',
        column: 'alipay_enabled',
        definition: 'BOOLEAN DEFAULT false'
      },
      {
        table: 'site_config',
        column: 'wechat_pay_enabled',
        definition: 'BOOLEAN DEFAULT false'
      },
      {
        table: 'billing_records',
        column: 'provider',
        definition: 'TEXT'
      },
      {
        table: 'billing_records',
        column: 'transaction_id',
        definition: 'TEXT'
      },
      {
        table: 'billing_records',
        column: 'completed_at',
        definition: 'DATETIME'
      },
      {
        table: 'billing_records',
        column: 'failed_at',
        definition: 'DATETIME'
      }
    ];

    for (const field of fieldsToAdd) {
      try {
        const sql = `ALTER TABLE ${field.table} ADD COLUMN ${field.column} ${field.definition}`;
        await db.run(sql);
        console.log(`✅ 添加字段 ${field.table}.${field.column} 成功`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate column name')) {
          console.log(`⚠️  字段 ${field.table}.${field.column} 已存在，跳过`);
        } else {
          console.error(`❌ 添加字段 ${field.table}.${field.column} 失败:`, error);
        }
      }
    }

    // 创建索引
    const indexesToCreate = [
      'CREATE INDEX IF NOT EXISTS idx_billing_records_provider ON billing_records(provider)',
      'CREATE INDEX IF NOT EXISTS idx_billing_records_payment_id ON billing_records(payment_id)',
      'CREATE INDEX IF NOT EXISTS idx_billing_records_transaction_id ON billing_records(transaction_id)'
    ];

    for (const indexSql of indexesToCreate) {
      try {
        await db.run(indexSql);
        console.log(`✅ 创建索引成功: ${indexSql.split(' ')[5]}`);
      } catch (error) {
        console.log(`⚠️  索引可能已存在，跳过: ${indexSql.split(' ')[5]}`);
      }
    }

    console.log('🎉 缺失字段添加完成！');

  } catch (error) {
    console.error('❌ 添加字段失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  addMissingFields().catch(console.error);
}

export { addMissingFields };