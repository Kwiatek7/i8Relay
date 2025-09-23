import { Database } from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// 获取数据库连接
function getDatabase(): Promise<Database> {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(process.cwd(), 'data/aiporxy.db');
    const db = new Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

async function runMigration() {
  const db = await getDatabase();
  const run = promisify(db.run.bind(db));
  const get = promisify(db.get.bind(db));

  try {
    console.log('🔄 开始应用SMTP配置迁移...');

    // 检查字段是否已存在
    const tableInfo = await new Promise<any[]>((resolve, reject) => {
      db.all("PRAGMA table_info(site_config)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const existingColumns = tableInfo.map(col => col.name);
    const newColumns = [
      'smtp_host',
      'smtp_port',
      'smtp_user',
      'smtp_password',
      'smtp_secure',
      'contact_form_email',
      'smtp_enabled'
    ];

    // 只添加不存在的字段
    for (const column of newColumns) {
      if (!existingColumns.includes(column)) {
        let sql = '';
        switch (column) {
          case 'smtp_host':
            sql = "ALTER TABLE site_config ADD COLUMN smtp_host TEXT DEFAULT ''";
            break;
          case 'smtp_port':
            sql = "ALTER TABLE site_config ADD COLUMN smtp_port INTEGER DEFAULT 587";
            break;
          case 'smtp_user':
            sql = "ALTER TABLE site_config ADD COLUMN smtp_user TEXT DEFAULT ''";
            break;
          case 'smtp_password':
            sql = "ALTER TABLE site_config ADD COLUMN smtp_password TEXT DEFAULT ''";
            break;
          case 'smtp_secure':
            sql = "ALTER TABLE site_config ADD COLUMN smtp_secure BOOLEAN DEFAULT false";
            break;
          case 'contact_form_email':
            sql = "ALTER TABLE site_config ADD COLUMN contact_form_email TEXT DEFAULT ''";
            break;
          case 'smtp_enabled':
            sql = "ALTER TABLE site_config ADD COLUMN smtp_enabled BOOLEAN DEFAULT false";
            break;
        }

        if (sql) {
          await run(sql);
          console.log(`✅ 添加字段: ${column}`);
        }
      } else {
        console.log(`⏭️  字段已存在: ${column}`);
      }
    }

    // 检查是否有默认配置记录，如果没有则创建
    const defaultConfig = await get("SELECT id FROM site_config WHERE id = 'default'");
    if (!defaultConfig) {
      await run(`
        INSERT INTO site_config (
          id, site_name, site_description, contact_email,
          smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure,
          contact_form_email, smtp_enabled,
          created_at, updated_at
        ) VALUES (
          'default', 'i8Relay', 'AI API中转服务', 'support@i8relay.com',
          '', 587, '', '', false,
          '', false,
          datetime('now'), datetime('now')
        )
      `);
      console.log('✅ 创建默认配置记录');
    }

    console.log('🎉 SMTP配置迁移完成！');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    db.close();
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration };