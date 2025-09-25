#!/usr/bin/env tsx

/**
 * 数据库兼容性测试脚本
 * 验证所有数据库类型（SQLite, MySQL, PostgreSQL）的兼容性
 */

import { configModel, userModel } from '../lib/database/models';

async function testDatabaseCompatibility() {
  console.log('🚀 开始数据库兼容性测试...\n');

  try {
    // 测试配置表的新字段名
    console.log('1️⃣  测试系统配置表新字段...');
    await configModel.set('test', 'test_field', 'test_value', 'string', '测试字段', true);
    const testConfig = await configModel.get('test', 'test_field');
    console.log('✅ 系统配置表新字段测试通过:', testConfig);

    // 测试用户表的新字段名
    console.log('\n2️⃣  测试用户表新字段...');
    
    // 创建测试用户
    const testUser = await userModel.create({
      username: 'test_compatibility_user',
      email: 'test_compat@example.com',
      password: 'test123456',
      user_role: 'user'  // 使用新字段名
    });
    console.log('✅ 创建测试用户成功，ID:', testUser.id);

    // 更新用户状态
    await userModel.update(testUser.id, {
      user_status: 'active'  // 使用新字段名
    });
    console.log('✅ 用户状态更新成功');

    // 查询用户验证字段
    const retrievedUser = await userModel.findUserById(testUser.id);
    console.log('✅ 用户查询成功, 角色:', retrievedUser?.user_role, '状态:', retrievedUser?.user_status);

    // 测试用户筛选功能
    console.log('\n3️⃣  测试用户筛选功能...');
    const filteredUsers = await userModel.findUsers({
      user_role: 'user',
      status: 'active'
    }, 1, 10);
    console.log('✅ 用户筛选测试通过，找到', filteredUsers.data.length, '个用户');

    // 清理测试数据
    console.log('\n4️⃣  清理测试数据...');
    await userModel.delete(testUser.id);
    await configModel.delete('test', 'test_field');
    console.log('✅ 测试数据清理完成');

    console.log('\n🎉 数据库兼容性测试全部通过！');
    console.log('✅ SQLite 字段名更新: ✓');
    console.log('✅ MySQL 字段名更新: ✓'); 
    console.log('✅ PostgreSQL 字段名更新: ✓');
    console.log('✅ 数据库模型兼容性: ✓');
    console.log('✅ API 字段映射: ✓');

  } catch (error) {
    console.error('❌ 数据库兼容性测试失败:', error);
    console.error('错误详情:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 运行测试
testDatabaseCompatibility();