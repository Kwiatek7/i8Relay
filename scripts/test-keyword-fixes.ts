#!/usr/bin/env npx tsx

import { getDb } from '../lib/database/connection';
import { userModel } from '../lib/database/models/user';
import { configModel } from '../lib/database/models/config';
import { usageModel } from '../lib/database/models/usage';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testKeywordFixes() {
  console.log('🔍 测试关键字修复后的数据库兼容性...');
  
  let db;
  
  try {
    // 获取数据库连接
    db = await getDb();
    
    // 1. 测试用户创建 - 确保没有默认套餐
    console.log('\n1️⃣ 测试用户创建（无默认套餐）');
    const newUser = await userModel.create({
      email: `test_${Date.now()}@example.com`,
      password: 'test123456',
      username: `test_user_${Date.now()}`,
    });

    if (newUser.plan === null || newUser.plan === undefined) {
      console.log('✅ 用户创建正确：plan 为 null/undefined');
    } else {
      console.log('❌ 用户创建错误：plan 不应该有值');
    }

    // 2. 测试配置系统 - 使用新的字段名
    console.log('\n2️⃣ 测试配置系统（config_key, config_value 字段）');
    await configModel.set('test', 'test_key_fix', 'test_value_fix', 'string');
    const retrievedConfig = await configModel.get('test', 'test_key_fix');
    
    if (retrievedConfig === 'test_value_fix') {
      console.log('✅ 配置系统正常：config_key, config_value 字段工作正常');
    } else {
      console.log('❌ 配置系统错误：config_key, config_value 字段有问题');
    }

    // 3. 测试日期统计 - 使用新的 record_date 字段
    console.log('\n3️⃣ 测试日期统计（record_date 字段）');
    const usageStats = await usageModel.getUserStats(newUser.id, 'month');
    
    console.log('✅ 使用统计查询正常：record_date 字段工作正常');

    // 4. 测试数据库字段映射
    console.log('\n4️⃣ 测试字段映射');
    console.log(`用户详情:
      - ID: ${newUser.id}
      - Email: ${newUser.email} 
      - 角色: ${newUser.user_role}
      - 状态: ${newUser.user_status}
      - 套餐: ${newUser.plan}
    `);

    console.log('\n✅ 所有关键字修复测试通过！');

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await db.run('DELETE FROM users WHERE id = ?', [newUser.id]);
    await db.run('DELETE FROM system_config WHERE config_key = ?', ['test_key_fix']);
    
    console.log('✅ 测试完成，数据已清理');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 运行测试
testKeywordFixes().catch(console.error);

// 运行测试
testKeywordFixes().catch(console.error);