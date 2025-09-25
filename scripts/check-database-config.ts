#!/usr/bin/env npx tsx

/**
 * 检查数据库配置环境
 * 运行：npx tsx scripts/check-database-config.ts
 */

import { getDatabaseEnvironmentInfo } from '../lib/database/factory';
import { isMySQLAvailable, parseMySQLConfig } from '../lib/database/adapters/mysql';
import { isVercelPostgresAvailable } from '../lib/database/adapters/vercel-postgres';
import { isSQLiteAvailable } from '../lib/database/adapters/sqlite';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

function checkDatabaseConfig() {
  console.log('🔍 数据库配置检查\n');

  // 获取环境信息
  const envInfo = getDatabaseEnvironmentInfo();

  console.log('📊 数据库适配器可用性：');
  console.log(`   SQLite:     ${envInfo.sqliteAvailable ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`   MySQL:      ${envInfo.mysqlAvailable ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`   PostgreSQL: ${envInfo.postgresAvailable ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`   推荐使用:   ${envInfo.recommendedAdapter}\n`);

  console.log('🔧 环境变量配置：');
  Object.entries(envInfo.currentConfig).forEach(([key, value]) => {
    if (value !== undefined) {
      console.log(`   ${key}: ${value}`);
    }
  });
  console.log();

  // 详细检查每个数据库
  if (envInfo.mysqlAvailable) {
    console.log('🐬 MySQL 详细配置：');
    const mysqlConfig = parseMySQLConfig();
    if (mysqlConfig) {
      console.log(`   ✅ 连接配置完整`);
      console.log(`   📍 主机: ${mysqlConfig.host}:${mysqlConfig.port}`);
      console.log(`   🗄️ 数据库: ${mysqlConfig.database}`);
      console.log(`   👤 用户: ${mysqlConfig.user}`);
      console.log(`   🔐 密码: ${mysqlConfig.password ? '***已设置***' : '未设置'}`);
      console.log(`   💡 建议使用命令测试连接: npx tsx scripts/test-mysql-connection.ts`);
    } else {
      console.log(`   ❌ 配置解析失败`);
    }
    console.log();
  }

  if (envInfo.postgresAvailable) {
    console.log('🐘 PostgreSQL 详细配置：');
    console.log(`   ✅ Vercel Postgres 环境检测到`);
    console.log(`   💡 适用于 Vercel 部署环境`);
    console.log();
  }

  if (envInfo.sqliteAvailable) {
    console.log('💾 SQLite 详细配置：');
    console.log(`   ✅ SQLite3 模块可用`);
    console.log(`   📁 数据库路径: ${process.env.DATABASE_PATH || './data/aiporxy.db'}`);
    console.log(`   💡 适用于本地开发环境`);
    console.log();
  }

  // 配置建议
  console.log('💡 配置建议：');

  if (!envInfo.mysqlAvailable && !envInfo.postgresAvailable && !envInfo.sqliteAvailable) {
    console.log('   ❌ 没有找到可用的数据库配置！');
    console.log('   📝 请参考 .env.example 配置数据库连接');
    console.log();
  } else {
    if (envInfo.recommendedAdapter === 'mysql') {
      console.log('   🎯 当前环境最适合使用 MySQL');
      console.log('   🚀 运行 npx tsx scripts/test-mysql-connection.ts 测试连接');
      console.log('   ✨ 运行 pnpm run db:init 初始化数据库');
    } else if (envInfo.recommendedAdapter === 'postgres') {
      console.log('   🎯 当前环境最适合使用 PostgreSQL (Vercel)');
      console.log('   ✨ 运行 pnpm run db:init 初始化数据库');
    } else if (envInfo.recommendedAdapter === 'sqlite') {
      console.log('   🎯 当前环境使用 SQLite (开发环境)');
      console.log('   ✨ 运行 pnpm run db:init 初始化数据库');
    }
  }

  console.log('\n📚 更多信息请参考项目文档 CLAUDE.md');
}

// 运行检查
checkDatabaseConfig();