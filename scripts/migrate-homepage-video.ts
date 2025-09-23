import { Database } from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// 定义配置对象类型
interface SiteConfig {
  id: string;
  homepage_video_url?: string;
}

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
    console.log('🔄 开始应用首页视频配置迁移...');

    // 检查字段是否已存在
    const tableInfo = await new Promise<any[]>((resolve, reject) => {
      db.all("PRAGMA table_info(site_config)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const existingColumns = tableInfo.map(col => col.name);
    const columnName = 'homepage_video_url';

    // 只添加不存在的字段
    if (!existingColumns.includes(columnName)) {
      const sql = "ALTER TABLE site_config ADD COLUMN homepage_video_url TEXT DEFAULT 'https://www.youtube.com/embed/dQw4w9WgXcQ'";
      await run(sql);
      console.log(`✅ 添加字段: ${columnName}`);
    } else {
      console.log(`⏭️  字段已存在: ${columnName}`);
    }

    // 检查是否有默认配置记录，如果没有则创建
    const defaultConfig = await get("SELECT id FROM site_config WHERE id = 'default'") as SiteConfig | undefined;
    if (!defaultConfig) {
      await run(`
        INSERT INTO site_config (
          id, site_name, site_description, contact_email,
          homepage_video_url,
          created_at, updated_at
        ) VALUES (
          'default', 'i8Relay', 'AI API中转服务', 'support@i8relay.com',
          'https://www.youtube.com/embed/dQw4w9WgXcQ',
          datetime('now'), datetime('now')
        )
      `);
      console.log('✅ 创建默认配置记录');
    } else {
      // 如果默认配置存在但没有视频链接，则更新
      const currentConfig = await get("SELECT homepage_video_url FROM site_config WHERE id = 'default'") as SiteConfig | undefined;
      if (currentConfig && !currentConfig.homepage_video_url) {
        await run(`
          UPDATE site_config
          SET homepage_video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              updated_at = datetime('now')
          WHERE id = 'default'
        `);
        console.log('✅ 更新默认配置记录的视频链接');
      }
    }

    console.log('🎉 首页视频配置迁移完成！');

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