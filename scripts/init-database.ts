#!/usr/bin/env tsx

/**
 * 数据库初始化脚本
 * 使用新的架构创建数据库表和种子数据
 */

import fs from 'fs';
import path from 'path';
import { getDb } from '../lib/database/connection';

async function initDatabase() {
  console.log('🚀 开始数据库初始化...\n');

  const db = await getDb();

  try {
    // 读取架构文件
    console.log('1️⃣  读取数据库架构文件...');
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ 架构文件读取成功');

    // 执行架构创建
    console.log('2️⃣  创建数据库表...');
    await db.exec(schema);
    console.log('✅ 数据库表创建成功');

    // 读取种子数据文件
    console.log('3️⃣  读取种子数据文件...');
    const seedPath = path.join(process.cwd(), 'database', 'seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    console.log('✅ 种子数据文件读取成功');

    // 插入种子数据
    console.log('4️⃣  插入种子数据...');
    await db.exec(seedData);
    console.log('✅ 种子数据插入成功');

    // 验证初始化结果
    console.log('5️⃣  验证初始化结果...');
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const planCount = await db.get('SELECT COUNT(*) as count FROM plans');
    const configCount = await db.get('SELECT COUNT(*) as count FROM system_config');

    console.log('✅ 初始化验证完成:');
    console.log('   - 用户数:', userCount?.count || 0);
    console.log('   - 套餐数:', planCount?.count || 0);
    console.log('   - 配置数:', configCount?.count || 0);

    console.log('\n🎉 数据库初始化完成！');
    console.log('🔑 默认管理员账户: admin@i8relay.com / admin123456');
    console.log('👤 演示用户1: demo@i8relay.com / password123');
    console.log('👤 演示用户2: demo2@i8relay.com / password123');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    console.error('错误详情:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 运行初始化
initDatabase();