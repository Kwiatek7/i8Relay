const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/aiporxy.db');

console.log('正在连接数据库:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// 添加 site_name_split_index 字段到 site_config 表
const addColumn = () => {
  return new Promise((resolve, reject) => {
    // 首先检查字段是否已存在
    db.all("PRAGMA table_info(site_config)", (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasColumn = columns.some(col => col.name === 'site_name_split_index');

      if (hasColumn) {
        console.log('✅ site_name_split_index 字段已存在');
        resolve();
        return;
      }

      // 添加字段
      db.run(
        "ALTER TABLE site_config ADD COLUMN site_name_split_index INTEGER",
        (err) => {
          if (err) {
            console.error('❌ 添加字段失败:', err);
            reject(err);
          } else {
            console.log('✅ 成功添加 site_name_split_index 字段');
            resolve();
          }
        }
      );
    });
  });
};

// 执行迁移
async function migrate() {
  try {
    await addColumn();
    console.log('🎉 数据库迁移完成');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err);
      } else {
        console.log('📊 数据库连接已关闭');
      }
    });
  }
}

migrate();