const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../data/aiporxy.db');
const migrationPath = path.join(__dirname, '../database/migrations/add_email_verification.sql');

console.log('正在运行邮箱验证数据库迁移...');

async function runMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('数据库连接成功');
    });

    // 读取迁移文件
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // 分割SQL语句（以分号分割，但排除注释行）
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !/^\s*$/.test(stmt));

    console.log(`准备执行 ${statements.length} 条SQL语句`);

    // 串行执行SQL语句
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      statements.forEach((statement, index) => {
        if (statement.trim().length > 0) {
          db.run(statement, (err) => {
            if (err) {
              // 如果是列已存在或表已存在的错误，可以忽略
              if (err.message.includes('duplicate column name') || 
                  err.message.includes('already exists') ||
                  err.message.includes('UNIQUE constraint failed')) {
                console.warn(`警告（已忽略）语句 ${index + 1}:`, err.message);
              } else {
                console.error(`执行语句 ${index + 1} 失败:`, err.message);
                console.error('失败的语句:', statement.substring(0, 200));
                db.run('ROLLBACK');
                db.close();
                reject(err);
                return;
              }
            } else {
              console.log(`✓ 语句 ${index + 1} 执行成功`);
            }
          });
        }
      });

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('提交事务失败:', err);
          reject(err);
          return;
        }
        
        console.log('邮箱验证数据库迁移完成！');
        
        // 验证表是否创建成功
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%email%'", (err, tables) => {
          if (!err && tables) {
            console.log('创建的邮箱相关表:', tables.map(t => t.name));
          }
          
          // 检查配置是否插入成功
          db.all("SELECT config_key, config_value FROM system_config WHERE category = 'email_verification'", (err, configs) => {
            if (!err && configs) {
              console.log('插入的邮箱验证配置:', configs.length, '条');
              configs.forEach(config => {
                console.log(`  - ${config.config_key}: ${config.config_value}`);
              });
            }
            
            db.close((err) => {
              if (err) {
                reject(err);
              } else {
                console.log('数据库连接已关闭');
                resolve();
              }
            });
          });
        });
      });
    });
  });
}

runMigration()
  .then(() => {
    console.log('迁移完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  });