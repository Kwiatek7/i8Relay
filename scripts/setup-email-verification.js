const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../data/aiporxy.db');

console.log('设置邮箱验证功能...');

async function setupEmailVerification() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('数据库连接成功');
    });

    const statements = [
      // 1. 为用户表添加邮箱验证字段
      `ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN email_verified_at DATETIME`,
      
      // 2. 创建邮箱验证令牌表
      `CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        token_hash TEXT NOT NULL UNIQUE,
        type TEXT DEFAULT 'email_verification' CHECK (type IN ('email_verification', 'email_change')),
        is_used BOOLEAN DEFAULT false,
        used_at DATETIME,
        expires_at DATETIME NOT NULL,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      
      // 3. 创建索引
      `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash)`,
      `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON email_verification_tokens(email)`,
      `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at)`,
      `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_type ON email_verification_tokens(type)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified)`,
      
      // 4. 插入邮箱验证配置
      `INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
        ('email_verification', 'enable_email_verification', 'false', 'boolean', '是否启用邮箱验证功能', 1)`,
      `INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
        ('email_verification', 'require_verification_for_registration', 'false', 'boolean', '注册时是否强制邮箱验证', 1)`,
      `INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
        ('email_verification', 'verification_token_expires_hours', '24', 'number', '验证令牌过期时间（小时）', 0)`,
      `INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
        ('email_verification', 'max_verification_attempts', '3', 'number', '最大验证尝试次数', 0)`,
      `INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
        ('email_verification', 'resend_cooldown_minutes', '5', 'number', '重新发送验证邮件冷却时间（分钟）', 0)`,
      `INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
        ('email_verification', 'verification_email_subject', '请验证您的邮箱地址', 'string', '验证邮件主题', 0)`,
      `INSERT OR REPLACE INTO system_config (category, key, value, data_type, description, is_public) VALUES
        ('email_verification', 'block_unverified_users', 'false', 'boolean', '是否阻止未验证用户使用服务', 1)`,
      
      // 5. 更新现有用户的邮箱验证状态
      `UPDATE users SET email_verified = false WHERE email_verified IS NULL`
    ];

    console.log(`准备执行 ${statements.length} 条SQL语句`);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completed = 0;
      let hasError = false;
      
      statements.forEach((statement, index) => {
        db.run(statement, (err) => {
          if (err) {
            // 如果是列已存在的错误，可以忽略
            if (err.message.includes('duplicate column name')) {
              console.warn(`⚠️  语句 ${index + 1} 警告（已忽略）:`, err.message);
            } else {
              console.error(`❌ 语句 ${index + 1} 失败:`, err.message);
              console.error('失败的语句:', statement.substring(0, 100) + '...');
              hasError = true;
            }
          } else {
            console.log(`✅ 语句 ${index + 1} 执行成功`);
          }
          
          completed++;
          
          if (completed === statements.length) {
            if (hasError) {
              db.run('ROLLBACK', (err) => {
                db.close();
                reject(new Error('存在执行错误，已回滚事务'));
              });
            } else {
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('提交事务失败:', err);
                  db.close();
                  reject(err);
                  return;
                }
                
                console.log('\n✨ 邮箱验证功能设置完成！');
                
                // 验证设置结果
                db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%email%'", (err, tables) => {
                  if (!err && tables) {
                    console.log('📋 创建的邮箱相关表:', tables.map(t => t.name).join(', '));
                  }
                  
                  db.all("SELECT key, value FROM system_config WHERE category = 'email_verification'", (err, configs) => {
                    if (!err && configs) {
                      console.log(`⚙️  插入的邮箱验证配置: ${configs.length} 条`);
                      configs.forEach(config => {
                        console.log(`   ${config.key}: ${config.value}`);
                      });
                    }
                    
                    db.close((err) => {
                      if (err) {
                        reject(err);
                      } else {
                        console.log('🔌 数据库连接已关闭');
                        resolve();
                      }
                    });
                  });
                });
              });
            }
          }
        });
      });
    });
  });
}

setupEmailVerification()
  .then(() => {
    console.log('\n🎉 邮箱验证功能设置成功！');
    console.log('\n📝 接下来你可以：');
    console.log('1. 在后台管理中启用邮箱验证功能');
    console.log('2. 配置SMTP邮件服务器');
    console.log('3. 测试邮箱验证流程');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 邮箱验证功能设置失败:', error.message);
    process.exit(1);
  });