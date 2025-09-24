/**
 * 创建用户临时额度表
 */

import { getDb } from '../lib/database/connection';

async function createTemporaryQuotaTable() {
  console.log('🚀 开始创建用户临时额度表...');

  try {
    const db = await getDb();

    // 创建用户临时额度表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_temporary_quotas (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'consumed')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // 创建索引
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_temporary_quotas_user_id ON user_temporary_quotas(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_temporary_quotas_date ON user_temporary_quotas(DATE(created_at));
      CREATE INDEX IF NOT EXISTS idx_user_temporary_quotas_status ON user_temporary_quotas(status);
      CREATE INDEX IF NOT EXISTS idx_user_temporary_quotas_expires ON user_temporary_quotas(expires_at);
    `);

    console.log('✅ 用户临时额度表创建完成');

    // 检查表结构
    const tableInfo = await db.all("PRAGMA table_info(user_temporary_quotas)");
    console.log('📋 表结构:', tableInfo);

    // 检查索引
    const indexes = await db.all("PRAGMA index_list(user_temporary_quotas)");
    console.log('📑 索引列表:', indexes);

    console.log('🎉 数据库表创建成功！');

  } catch (error) {
    console.error('❌ 创建数据库表失败:', error);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  createTemporaryQuotaTable()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { createTemporaryQuotaTable };