const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 读取环境变量或使用默认值
const dbPath = process.env.DATABASE_URL || './database.sqlite';

console.log('🔧 初始化数据库...');

// 创建数据库连接
const db = new Database(dbPath);

try {
  // 读取schema.sql
  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('📋 执行数据库架构...');
  // 分割SQL语句并执行
  const statements = schema.split(';').filter(stmt => stmt.trim());
  statements.forEach(stmt => {
    if (stmt.trim()) {
      db.exec(stmt + ';');
    }
  });

  // 读取seed.sql
  const seedPath = path.join(__dirname, 'database', 'seed.sql');
  const seed = fs.readFileSync(seedPath, 'utf8');

  console.log('🌱 插入初始数据...');
  // 分割SQL语句并执行
  const seedStatements = seed.split(';').filter(stmt => stmt.trim());
  seedStatements.forEach(stmt => {
    if (stmt.trim()) {
      try {
        db.exec(stmt + ';');
      } catch (error) {
        // 忽略已存在的数据错误
        if (!error.message.includes('UNIQUE constraint failed')) {
          console.warn('警告:', error.message);
        }
      }
    }
  });

  console.log('✅ 数据库初始化完成！');
  console.log('🔑 默认管理员账号:');
  console.log('   邮箱: admin@i8relay.com');
  console.log('   密码: admin123');

} catch (error) {
  console.error('❌ 数据库初始化失败:', error);
} finally {
  db.close();
}