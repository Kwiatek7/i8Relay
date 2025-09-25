#!/usr/bin/env npx tsx

import { getDb } from '../lib/database/connection';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function addNotificationRulesTables() {
  console.log('🔧 正在添加通知规则相关表...');

  let db;

  try {
    // 获取数据库连接
    db = await getDb();

    console.log('✅ 数据库连接成功');

    // 读取SQL迁移文件
    const sqlFilePath = join(process.cwd(), 'scripts', 'add-notification-rules-mysql.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');

    console.log('📄 SQL迁移文件读取成功');

    // 将SQL内容按分号分割为单独的语句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔍 找到 ${statements.length} 条SQL语句`);

    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ 执行语句 ${i + 1}/${statements.length}`);
          await db.exec(statement + ';');
        } catch (error: any) {
          // 忽略已存在的表错误，但报告其他错误
          if (!error.message.includes('already exists') &&
              !error.message.includes('Duplicate entry') &&
              error.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.error(`❌ 执行SQL语句失败 (${i + 1}):`, error.message);
            console.log('SQL语句:', statement);
          } else {
            console.log(`⏭️  跳过已存在的资源 (${i + 1})`);
          }
        }
      }
    }

    console.log('✅ 通知规则表添加完成！');

    // 验证表是否创建成功
    console.log('\n🔍 验证表创建状态...');

    const tables = ['notification_templates', 'notification_rules', 'notification_rule_logs'];

    for (const table of tables) {
      try {
        const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${result.count} 条记录`);
      } catch (error) {
        console.log(`❌ ${table}: 表不存在或无法访问`);
      }
    }

    console.log('\n🎉 迁移完成！通知规则系统现在可以正常工作了。');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  }
}

// 运行迁移
addNotificationRulesTables().catch(console.error);