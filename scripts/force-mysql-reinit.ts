#!/usr/bin/env npx tsx

/**
 * 强制重新初始化 MySQL 数据库
 * 会删除现有表并重新创建架构和数据
 * 运行：npx tsx scripts/force-mysql-reinit.ts
 */

import { MySQLAdapter, isMySQLAvailable, parseMySQLConfig } from '../lib/database/adapters/mysql';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function forceReinitMySQL() {
  console.log('⚠️  强制重新初始化 MySQL 数据库...\n');

  try {
    // 检查 MySQL 是否可用
    if (!isMySQLAvailable()) {
      console.log('❌ MySQL 不可用。请设置 MySQL 环境变量');
      return;
    }

    // 解析配置
    const config = parseMySQLConfig();
    if (!config) {
      console.log('❌ 无法解析 MySQL 配置');
      return;
    }

    console.log(`⚠️  即将重新初始化数据库: ${config.host}:${config.port}/${config.database}`);
    console.log('⚠️  这将删除所有现有数据！\n');

    // 创建适配器并连接
    const adapter = new MySQLAdapter(config);
    await adapter.connect();
    console.log('✅ MySQL 数据库连接成功\n');

    // 获取现有表列表
    const existingTables = await adapter.all(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
    `, [config.database]);

    if (existingTables.length > 0) {
      console.log(`🗑️  删除现有的 ${existingTables.length} 个表...`);

      // 禁用外键检查
      await adapter.exec('SET FOREIGN_KEY_CHECKS = 0');

      // 删除所有表
      for (const table of existingTables) {
        const tableName = table.TABLE_NAME;
        console.log(`   - 删除表: ${tableName}`);
        await adapter.exec(`DROP TABLE IF EXISTS \`${tableName}\``);
      }

      // 重新启用外键检查
      await adapter.exec('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ 所有表已删除\n');
    }

    // 执行 schema
    console.log('🔧 创建数据库架构...');
    const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema-mysql.sql');

    if (fs.existsSync(SCHEMA_PATH)) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      await adapter.exec(schema);
      console.log('✅ MySQL 数据库架构已创建');
    } else {
      // 如果没有专门的 MySQL schema，转换 SQLite schema
      const sqliteSchemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      if (fs.existsSync(sqliteSchemaPath)) {
        const sqliteSchema = fs.readFileSync(sqliteSchemaPath, 'utf8');
        const mysqlSchema = adapter['convertSchemaToMySQL'](sqliteSchema);
        await adapter.exec(mysqlSchema);
        console.log('✅ 从 SQLite 架构转换的 MySQL 数据库架构已创建');
      } else {
        throw new Error('未找到数据库架构文件');
      }
    }

    // 执行 seed data
    console.log('🌱 导入种子数据...');
    const SEED_PATH = path.join(process.cwd(), 'database', 'seed-mysql.sql');

    if (fs.existsSync(SEED_PATH)) {
      const seedData = fs.readFileSync(SEED_PATH, 'utf8');
      await adapter.exec(seedData);
      console.log('✅ MySQL 初始化数据已导入');
    } else {
      // 转换 SQLite seed 数据
      const sqliteSeedPath = path.join(process.cwd(), 'database', 'seed.sql');
      if (fs.existsSync(sqliteSeedPath)) {
        const sqliteSeed = fs.readFileSync(sqliteSeedPath, 'utf8');
        const mysqlSeed = adapter['convertSQLiteToMySQL'](sqliteSeed);
        await adapter.exec(mysqlSeed);
        console.log('✅ 从 SQLite 转换的初始化数据已导入');
      }
    }

    // 验证结果
    console.log('\n📊 验证初始化结果...');

    // 检查表创建情况
    const tables = await adapter.all(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [config.database]);

    console.log(`✅ 创建了 ${tables.length} 个表:`);
    tables.forEach((table: any, index: number) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });

    // 检查关键表的数据
    const criticalTables = ['users', 'plans', 'site_config', 'system_config'];
    console.log('\n🔍 数据导入情况:');

    for (const tableName of criticalTables) {
      try {
        const count = await adapter.get(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`   ✅ ${tableName}: ${count.count} 条记录`);

        // 显示一些关键数据
        if (count.count > 0 && tableName === 'users') {
          const admin = await adapter.get(`SELECT username, email, role FROM \`${tableName}\` WHERE role = 'super_admin' LIMIT 1`);
          if (admin) {
            console.log(`      👤 管理员: ${admin.username} (${admin.email})`);
          }
        }

        if (count.count > 0 && tableName === 'plans') {
          const plans = await adapter.get(`SELECT COUNT(*) as active_count FROM \`${tableName}\` WHERE is_active = 1`);
          console.log(`      📦 活跃套餐: ${plans.active_count} 个`);
        }
      } catch (error) {
        console.log(`   ❌ ${tableName}: 查询失败`);
      }
    }

    // 获取数据库统计信息
    const stats = await adapter.getStats();
    console.log('\n📊 数据库统计信息:');
    console.log(`   - 数据库大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - 表数量: ${stats.tables}`);
    console.log(`   - 索引数量: ${stats.indexes}`);

    // 关闭连接
    await adapter.close();

    console.log('\n🎉 MySQL 数据库重新初始化完成！');
    console.log('\n💡 现在可以使用以下账户登录:');
    console.log('   - 管理员: admin@i8relay.com / admin123');
    console.log('   - 演示用户1: demo@i8relay.com / demo123');
    console.log('   - 演示用户2: demo2@i8relay.com / demo123');

  } catch (error) {
    console.error('❌ MySQL 重新初始化失败:', error);
    console.log('\n🔍 请检查:');
    console.log('1. MySQL 服务器是否运行');
    console.log('2. 用户是否有足够权限（CREATE、DROP、INSERT 等）');
    console.log('3. 数据库是否存在');
    console.log('4. schema 和 seed 文件语法是否正确');
    process.exit(1);
  }
}

// 运行重新初始化
forceReinitMySQL().catch(console.error);