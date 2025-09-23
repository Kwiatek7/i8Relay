#!/usr/bin/env tsx

/**
 * 数据库初始化脚本
 * 用于初始化数据库架构和种子数据
 */

import path from 'path';
import fs from 'fs';

// 设置环境变量
process.env.DATABASE_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'aiporxy.db');

async function initDatabase() {
  console.log('🚀 开始初始化数据库...');

  try {
    // 动态导入模型（确保数据库连接已建立）
    const { getDb, DatabaseConnection } = await import('../lib/database/connection');

    // 建立数据库连接
    const db = await getDb();
    console.log('✅ 数据库连接已建立');

    // 获取数据库统计信息
    const stats = await DatabaseConnection.getStats();
    console.log('📊 数据库统计信息:');
    console.log(`   - 大小: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   - 表数量: ${stats.tables}`);
    console.log(`   - 索引数量: ${stats.indexes}`);
    console.log(`   - 页数: ${stats.pageCount}`);
    console.log(`   - 页大小: ${stats.pageSize} bytes`);

    // 测试基本查询
    console.log('\n🧪 测试基本数据库功能...');

    // 检查用户表
    const usersCount = await db.get("SELECT COUNT(*) as count FROM users") as { count: number };
    console.log(`   - 用户表记录数: ${usersCount.count}`);

    // 检查套餐表
    const plansCount = await db.get("SELECT COUNT(*) as count FROM plans") as { count: number };
    console.log(`   - 套餐表记录数: ${plansCount.count}`);

    // 检查配置表
    const siteConfigCount = await db.get("SELECT COUNT(*) as count FROM site_config") as { count: number };
    const systemConfigCount = await db.get("SELECT COUNT(*) as count FROM system_config") as { count: number };
    console.log(`   - 站点配置记录数: ${siteConfigCount.count}`);
    console.log(`   - 系统配置记录数: ${systemConfigCount.count}`);

    if (usersCount.count > 0) {
      // 测试演示用户
      console.log('\n👤 检查演示用户...');
      const demoUser = await db.get("SELECT * FROM users WHERE email = ?", ['demo@i8relay.com']);
      if (demoUser) {
        console.log(`   - 找到演示用户: ${demoUser.username} (${demoUser.email})`);
        console.log(`   - 当前套餐: ${demoUser.plan}`);
        console.log(`   - 余额: ¥${demoUser.balance}`);
      } else {
        console.log('   - 未找到演示用户');
      }
    }

    if (plansCount.count > 0) {
      // 测试套餐
      console.log('\n📦 检查可用套餐...');
      const plans = await db.all("SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order");
      console.log(`   - 找到 ${plans.length} 个激活的套餐:`);
      plans.forEach((plan: any) => {
        console.log(`     • ${plan.name}: ¥${plan.price}/${plan.billing_period}`);
      });
    }

    if (siteConfigCount.count > 0) {
      // 测试配置
      console.log('\n⚙️ 检查系统配置...');

      // 检查站点配置
      const siteConfig = await db.get("SELECT * FROM site_config WHERE id = 'default'");
      if (siteConfig) {
        console.log('   - 站点配置:');
        console.log(`     • 网站名称: ${siteConfig.site_name}`);
        console.log(`     • 网站描述: ${siteConfig.site_description}`);
        console.log(`     • 主题色: ${siteConfig.theme_primary_color}`);
        console.log(`     • 启用注册: ${siteConfig.enable_registration ? '是' : '否'}`);
      }

      // 检查部分系统配置
      const systemConfigs = await db.all("SELECT * FROM system_config WHERE category = 'site' LIMIT 3");
      if (systemConfigs.length > 0) {
        console.log('   - 系统配置示例:');
        systemConfigs.forEach((config: any) => {
          console.log(`     • ${config.key}: ${config.value}`);
        });
      }
    }

    console.log('\n✅ 数据库初始化测试完成！');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase().catch(console.error);
}

export { initDatabase };