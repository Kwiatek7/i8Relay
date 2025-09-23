import { getDb } from '../lib/database/connection';
import * as fs from 'fs';
import * as path from 'path';

async function migrateNotificationRules() {
  console.log('开始执行通知规则数据库迁移...');

  try {
    // 获取数据库连接
    const db = await getDb();

    // 读取迁移文件
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', 'create_notification_rules.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // 去除注释行并分割SQL语句
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');

    const statements = cleanSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // 按类型分组执行：先表，再索引，再数据
    const createTableStatements = statements.filter(stmt => stmt.startsWith('CREATE TABLE'));
    const createIndexStatements = statements.filter(stmt => stmt.startsWith('CREATE INDEX'));
    const insertStatements = statements.filter(stmt => stmt.startsWith('INSERT'));

    // 1. 先创建表
    for (const statement of createTableStatements) {
      console.log('创建表:', statement.substring(0, 50) + '...');
      await db.exec(statement);
    }

    // 2. 再创建索引
    for (const statement of createIndexStatements) {
      console.log('创建索引:', statement.substring(0, 50) + '...');
      await db.exec(statement);
    }

    // 3. 最后插入数据
    for (const statement of insertStatements) {
      console.log('插入数据:', statement.substring(0, 50) + '...');
      await db.exec(statement);
    }

    console.log('✅ 通知规则数据库迁移完成');

    // 验证表是否创建成功
    const tables = await db.all(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND (
        name='notification_templates' OR
        name='notification_rules' OR
        name='notification_rule_logs'
      )
    `);

    console.log('✅ 创建的表:', tables.map(t => t.name));

    // 查看默认数据
    const templates = await db.all('SELECT id, name, title FROM notification_templates');
    console.log('✅ 默认通知模板:', templates);

    const rules = await db.all('SELECT id, name, type, is_enabled FROM notification_rules');
    console.log('✅ 默认通知规则:', rules);

    console.log('✅ 数据库连接保持开启状态');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
migrateNotificationRules().then(() => {
  console.log('🎉 通知规则系统初始化完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 迁移脚本执行失败:', error);
  process.exit(1);
});