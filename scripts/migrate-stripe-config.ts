import { Database } from 'sqlite3';
import { promisify } from 'util';
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
    console.log('🔄 开始应用 Stripe 配置迁移...');

    // 检查字段是否已存在
    const tableInfo = await new Promise<any[]>((resolve, reject) => {
      db.all("PRAGMA table_info(site_config)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const existingColumns = tableInfo.map(col => col.name);

    // 要添加的 Stripe 配置字段
    const stripeFields = [
      { name: 'stripe_enabled', type: 'BOOLEAN', default: '0' },
      { name: 'stripe_publishable_key', type: 'TEXT', default: null },
      { name: 'stripe_secret_key', type: 'TEXT', default: null },
      { name: 'stripe_webhook_secret', type: 'TEXT', default: null },
      { name: 'stripe_test_mode', type: 'BOOLEAN', default: '1' },
      { name: 'stripe_currency', type: 'TEXT', default: "'usd'" },
      { name: 'stripe_country', type: 'TEXT', default: "'US'" }
    ];

    // 添加不存在的字段
    for (const field of stripeFields) {
      if (!existingColumns.includes(field.name)) {
        const defaultClause = field.default !== null ? `DEFAULT ${field.default}` : '';
        const sql = `ALTER TABLE site_config ADD COLUMN ${field.name} ${field.type} ${defaultClause}`;
        await run(sql);
        console.log(`✅ 添加字段: ${field.name}`);
      } else {
        console.log(`⏭️  字段已存在: ${field.name}`);
      }
    }

    // 检查是否有默认配置记录
    const defaultConfig = await get("SELECT id FROM site_config WHERE id = 'default'");
    if (!defaultConfig) {
      console.log('⚠️  默认配置记录不存在，将在主应用中创建');
    } else {
      console.log('✅ 默认配置记录已存在');
    }

    console.log('🎉 Stripe 配置迁移完成！');

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