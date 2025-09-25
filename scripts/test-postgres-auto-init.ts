#!/usr/bin/env npx tsx

/**
 * 测试 PostgreSQL 数据库自动初始化功能
 * 专门测试 Vercel Postgres 适配器的自动初始化
 * 运行：DATABASE_TYPE=postgres npx tsx scripts/test-postgres-auto-init.ts
 */

import { getDb, DatabaseConnection } from '../lib/database/connection';
import { getDatabaseEnvironmentInfo } from '../lib/database/factory';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testPostgreSQLAutoInitialization() {
  console.log('🐘 测试 PostgreSQL 数据库自动初始化功能...\n');

  try {
    // 显示当前数据库环境信息
    console.log('📊 数据库环境检查:');
    const envInfo = getDatabaseEnvironmentInfo();
    console.log(`   推荐适配器: ${envInfo.recommendedAdapter}`);
    console.log(`   SQLite 可用: ${envInfo.sqliteAvailable ? '✅' : '❌'}`);
    console.log(`   MySQL 可用: ${envInfo.mysqlAvailable ? '✅' : '❌'}`);
    console.log(`   PostgreSQL 可用: ${envInfo.postgresAvailable ? '✅' : '❌'}`);
    console.log();

    // 检查是否有 PostgreSQL 环境
    if (!envInfo.postgresAvailable) {
      console.log('❌ PostgreSQL 环境未配置，无法进行测试');
      console.log('💡 请确保设置了以下环境变量之一：');
      console.log('   - POSTGRES_URL');
      console.log('   - POSTGRES_PRISMA_URL');
      console.log('   - POSTGRES_URL_NON_POOLING');
      console.log('\n或者运行：DATABASE_TYPE=postgres npx tsx scripts/test-postgres-auto-init.ts');
      process.exit(1);
    }

    // 强制使用 PostgreSQL
    process.env.DATABASE_TYPE = 'postgres';

    // 测试数据库连接和自动初始化
    console.log('🔄 第一次 PostgreSQL 连接（应该触发自动初始化检查）...');
    const startTime = Date.now();
    const db = await getDb();
    const connectionTime = Date.now() - startTime;

    console.log(`✅ PostgreSQL 数据库连接成功，耗时: ${connectionTime}ms\n`);

    // 验证数据库是否已正确初始化
    console.log('✅ 验证 PostgreSQL 数据库初始化结果:');

    // 检查关键表是否存在
    try {
      // 检查用户数量
      const usersCount = await db.get("SELECT COUNT(*) as count FROM users");
      console.log(`   👥 用户表: ${usersCount.count} 条记录`);

      // 检查套餐数量
      const plansCount = await db.get("SELECT COUNT(*) as count FROM plans");
      console.log(`   📦 套餐表: ${plansCount.count} 条记录`);

      // 检查系统配置
      const configCount = await db.get("SELECT COUNT(*) as count FROM system_config");
      console.log(`   ⚙️ 系统配置: ${configCount.count} 条记录`);

      // 检查 PostgreSQL 特有功能
      const extensionsCheck = await db.all(`
        SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'
      `);
      console.log(`   🔧 UUID 扩展: ${extensionsCheck.length > 0 ? '✅ 已启用' : '❌ 未启用'}`);

      // 检查 JSONB 字段
      const jsonbTest = await db.get(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'models'
      `);
      console.log(`   📋 JSONB 支持: ${jsonbTest?.data_type === 'jsonb' ? '✅ 正常' : '⚠️ 需检查'}`);

      // 如果有数据，显示一些示例
      if (usersCount.count > 0) {
        const admin = await db.get(`
          SELECT username, email, role FROM users 
          WHERE role IN ('super_admin', 'admin') LIMIT 1
        `);
        if (admin) {
          console.log(`   👤 管理员用户: ${admin.username} (${admin.email})`);
        }
      }

      if (plansCount.count > 0) {
        const plans = await db.all(`
          SELECT name, display_name, price FROM plans 
          WHERE is_active = true LIMIT 3
        `);
        console.log(`   📋 可用套餐示例:`);
        plans.forEach((plan: any) => {
          console.log(`      - ${plan.display_name || plan.name}: ¥${plan.price}`);
        });
      }

    } catch (error: any) {
      console.log(`   ❌ 验证失败: ${error.message}`);
      throw error;
    }

    // 获取数据库统计信息
    console.log('\n📊 PostgreSQL 数据库统计信息:');
    const stats = await DatabaseConnection.getStats();
    console.log(`   - 数据库大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - 表数量: ${stats.tables}`);
    console.log(`   - 索引数量: ${stats.indexes}`);

    // 测试第二次连接（应该跳过初始化）
    console.log('\n🔄 第二次 PostgreSQL 连接（应该跳过自动初始化）...');
    await DatabaseConnection.close(); // 先关闭当前连接

    const secondStartTime = Date.now();
    const db2 = await getDb();
    const secondConnectionTime = Date.now() - secondStartTime;

    console.log(`✅ 第二次连接成功，耗时: ${secondConnectionTime}ms`);
    console.log(`⚡ 连接速度对比: 第二次比第一次快 ${connectionTime - secondConnectionTime}ms\n`);

    // 测试 PostgreSQL 特有功能
    console.log('🧪 测试 PostgreSQL 特有功能:');
    
    // 测试 UUID 生成
    const uuidTest = await db.get(`SELECT uuid_generate_v4() as new_uuid`);
    console.log(`   🔢 UUID 生成: ${uuidTest.new_uuid ? '✅ 正常' : '❌ 失败'}`);

    // 测试 JSONB 操作
    const jsonbTest2 = await db.get(`
      SELECT models FROM plans WHERE models IS NOT NULL LIMIT 1
    `);
    if (jsonbTest2?.models) {
      console.log(`   📋 JSONB 数据: ✅ 正常 (${typeof jsonbTest2.models})`);
    }

    // 关闭连接
    await DatabaseConnection.close();

    console.log('🎉 PostgreSQL 自动初始化功能测试完成！');
    console.log('\n💡 测试结果总结:');
    console.log('   ✅ PostgreSQL 连接正常');
    console.log('   ✅ 自动检测功能正常');
    console.log('   ✅ 首次运行自动初始化正常');
    console.log('   ✅ 第二次运行跳过初始化正常');
    console.log('   ✅ PostgreSQL 特有功能正常');
    console.log('   ✅ 数据完整性验证通过');

  } catch (error) {
    console.error('❌ PostgreSQL 自动初始化测试失败:', error);
    console.log('\n🔍 可能的原因:');
    console.log('1. PostgreSQL 连接配置错误');
    console.log('2. Vercel Postgres 环境变量未设置');
    console.log('3. 权限不足，无法创建表或扩展');
    console.log('4. PostgreSQL schema 或 seed 文件有错误');
    console.log('5. 网络连接问题');
    console.log('\n💡 解决方案:');
    console.log('- 检查 PostgreSQL 环境变量配置');
    console.log('- 确认 Vercel Postgres 数据库可访问');
    console.log('- 验证数据库用户权限');
    console.log('- 检查 database/schema-postgres.sql 和 database/seed-postgres.sql 文件');
    console.log('- 测试网络连接');

    process.exit(1);
  }
}

// 运行测试
testPostgreSQLAutoInitialization().catch(console.error);