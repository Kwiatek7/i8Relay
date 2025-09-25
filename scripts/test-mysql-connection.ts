#!/usr/bin/env npx tsx

/**
 * 测试 MySQL 数据库连接和初始化
 * 运行：npx tsx scripts/test-mysql-connection.ts
 */

import { MySQLAdapter, isMySQLAvailable, parseMySQLConfig } from '../lib/database/adapters/mysql';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testMySQLConnection() {
  console.log('🧪 开始测试 MySQL 连接...\n');

  try {
    // 检查 MySQL 是否可用
    console.log('1. 检查 MySQL 可用性...');
    if (!isMySQLAvailable()) {
      console.log('❌ MySQL 不可用。请设置以下环境变量之一：');
      console.log('   - MYSQL_HOST 和 MYSQL_DATABASE');
      console.log('   - DATABASE_URL (格式：mysql://user:password@host:port/database)');
      console.log('\n💡 提示：复制 .env.example 为 .env.local 并配置 MySQL 连接信息');
      return;
    }
    console.log('✅ MySQL 配置检测通过\n');

    // 解析配置
    console.log('2. 解析 MySQL 配置...');
    const config = parseMySQLConfig();
    if (!config) {
      console.log('❌ 无法解析 MySQL 配置');
      return;
    }
    console.log('✅ MySQL 配置解析成功:');
    console.log(`   - 主机: ${config.host}:${config.port}`);
    console.log(`   - 数据库: ${config.database}`);
    console.log(`   - 用户: ${config.user}\n`);

    // 创建适配器并连接
    console.log('3. 创建 MySQL 适配器...');
    const adapter = new MySQLAdapter(config);

    console.log('4. 尝试连接数据库...');
    await adapter.connect();
    console.log('✅ 数据库连接成功\n');

    // 测试基础操作
    console.log('5. 测试基础数据库操作...');

    // 创建测试表
    await adapter.exec(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 测试表创建成功');

    // 插入测试数据
    const insertResult = await adapter.run(
      'INSERT INTO test_connection (name) VALUES (?)',
      ['MySQL 连接测试']
    );
    console.log('✅ 测试数据插入成功，ID:', insertResult.lastID);

    // 查询测试数据
    const testRow = await adapter.get(
      'SELECT * FROM test_connection WHERE id = ?',
      [insertResult.lastID]
    );
    console.log('✅ 测试数据查询成功:', testRow);

    // 清理测试表
    await adapter.exec('DROP TABLE test_connection');
    console.log('✅ 测试表清理完成');

    // 关闭连接
    await adapter.close();
    console.log('✅ 数据库连接已关闭\n');

    console.log('🎉 MySQL 连接测试完全成功！数据库适配器运行正常。\n');
    console.log('💡 现在可以使用以下命令初始化完整数据库：');
    console.log('   pnpm run db:init');

  } catch (error) {
    console.error('❌ MySQL 连接测试失败:', error);
    console.log('\n🔍 排查建议:');
    console.log('1. 确认 MySQL 服务器正在运行');
    console.log('2. 检查网络连接和防火墙设置');
    console.log('3. 验证数据库用户权限');
    console.log('4. 确认数据库是否存在');
    process.exit(1);
  }
}

// 运行测试
testMySQLConnection().catch(console.error);