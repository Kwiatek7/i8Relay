#!/usr/bin/env npx tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb } from '../lib/database/connection';

async function migrateAddAIAccounts() {
  console.log('开始执行AI账号管理系统数据库迁移...');
  
  try {
    const db = await getDb();
    
    // 读取架构文件
    const schemaPath = join(process.cwd(), 'database/ai-accounts-schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // 分割并执行每个SQL语句
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`准备执行 ${statements.length} 个SQL语句...`);
    
    for (const statement of statements) {
      await db.run(statement);
    }
    
    console.log('✅ AI账号管理系统表结构创建完成');
    
    // 读取种子数据文件
    const seedPath = join(process.cwd(), 'database/ai-accounts-seed.sql');
    const seedData = readFileSync(seedPath, 'utf-8');
    
    // 分割并执行种子数据
    const seedStatements = seedData
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`准备执行 ${seedStatements.length} 个种子数据语句...`);
    
    for (const statement of seedStatements) {
      await db.run(statement);
    }
    
    console.log('✅ AI账号管理系统种子数据导入完成');
    
    // 验证迁移结果
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN (
        'ai_accounts', 
        'user_account_bindings', 
        'account_usage_logs', 
        'account_health_checks', 
        'plan_account_quotas'
      )
    `);
    
    console.log('已创建的表:', tables.map(t => t.name).join(', '));
    
    // 检查AI账号数量
    const accountCount = await db.get('SELECT COUNT(*) as count FROM ai_accounts');
    console.log(`AI账号池中共有 ${accountCount.count} 个账号`);
    
    // 检查绑定数量
    const bindingCount = await db.get('SELECT COUNT(*) as count FROM user_account_bindings');
    console.log(`用户专属绑定共有 ${bindingCount.count} 个`);
    
    // 检查配额配置
    const quotaCount = await db.get('SELECT COUNT(*) as count FROM plan_account_quotas');
    console.log(`套餐配额配置共有 ${quotaCount.count} 个`);
    
    console.log('\n🎉 AI账号分级管理系统迁移成功完成！');
    console.log('\n功能说明:');
    console.log('1. 普通套餐用户：从公共AI账号池随机分配');
    console.log('2. 拼车套餐用户：绑定专属AI账号，享受稳定服务');
    console.log('3. 支持账号健康监控和自动故障转移');
    console.log('4. 提供详细的使用统计和成本追踪\n');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateAddAIAccounts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateAddAIAccounts };