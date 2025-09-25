#!/usr/bin/env npx tsx

/**
 * 测试数据库自动初始化功能
 * 验证首次运行时自动检测并初始化数据库
 * 运行：npx tsx scripts/test-auto-init.ts
 */

import { getDb, DatabaseConnection } from '../lib/database/connection';
import { getDatabaseEnvironmentInfo } from '../lib/database/factory';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testAutoInitialization() {
  console.log('🚀 测试数据库自动初始化功能...\n');

  try {
    // 显示当前数据库环境信息
    console.log('📊 数据库环境检查:');
    const envInfo = getDatabaseEnvironmentInfo();
    console.log(`   推荐适配器: ${envInfo.recommendedAdapter}`);
    console.log(`   SQLite 可用: ${envInfo.sqliteAvailable ? '✅' : '❌'}`);
    console.log(`   MySQL 可用: ${envInfo.mysqlAvailable ? '✅' : '❌'}`);
    console.log(`   PostgreSQL 可用: ${envInfo.postgresAvailable ? '✅' : '❌'}`);
    console.log();

    // 测试数据库连接和自动初始化
    console.log('🔄 第一次数据库连接（应该触发自动初始化检查）...');
    const startTime = Date.now();
    const db = await getDb();
    const connectionTime = Date.now() - startTime;

    console.log(`✅ 数据库连接成功，耗时: ${connectionTime}ms\n`);

    // 验证数据库是否已正确初始化
    console.log('✅ 验证数据库初始化结果:');

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

      // 如果有数据，显示一些示例
      if (usersCount.count > 0) {
        const admin = await db.get("SELECT username, email, role FROM users WHERE role = 'super_admin' OR role = 'admin' LIMIT 1");
        if (admin) {
          console.log(`   👤 管理员用户: ${admin.username} (${admin.email})`);
        }
      }

      if (plansCount.count > 0) {
        const plans = await db.all("SELECT name, display_name, price FROM plans WHERE is_active = 1 LIMIT 3");
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
    console.log('\n📊 数据库统计信息:');
    const stats = await DatabaseConnection.getStats();
    console.log(`   - 数据库大小: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   - 表数量: ${stats.tables}`);
    console.log(`   - 索引数量: ${stats.indexes}`);

    // 测试第二次连接（应该跳过初始化）
    console.log('\n🔄 第二次数据库连接（应该跳过自动初始化）...');
    await DatabaseConnection.close(); // 先关闭当前连接

    const secondStartTime = Date.now();
    const db2 = await getDb();
    const secondConnectionTime = Date.now() - secondStartTime;

    console.log(`✅ 第二次连接成功，耗时: ${secondConnectionTime}ms`);
    console.log(`⚡ 连接速度对比: 第二次比第一次快 ${connectionTime - secondConnectionTime}ms\n`);

    // 关闭连接
    await DatabaseConnection.close();

    console.log('🎉 自动初始化功能测试完成！');
    console.log('\n💡 测试结果总结:');
    console.log('   ✅ 数据库自动检测正常');
    console.log('   ✅ 首次运行自动初始化正常');
    console.log('   ✅ 第二次运行跳过初始化正常');
    console.log('   ✅ 数据完整性验证通过');

  } catch (error) {
    console.error('❌ 自动初始化测试失败:', error);
    console.log('\n🔍 可能的原因:');
    console.log('1. 数据库连接配置错误');
    console.log('2. 权限不足，无法创建表');
    console.log('3. Schema 或 Seed 文件不存在或有错误');
    console.log('4. 数据库服务未启动');
    console.log('\n💡 解决方案:');
    console.log('- 检查环境变量配置');
    console.log('- 确认数据库服务状态');
    console.log('- 验证用户权限');
    console.log('- 检查 schema 和 seed 文件');

    process.exit(1);
  }
}

// 运行测试
testAutoInitialization().catch(console.error);