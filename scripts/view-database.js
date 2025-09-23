#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/aiporxy.db');
const db = new Database(dbPath);

console.log('=== 数据库表结构 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log('表:', tables.map(t => t.name));

console.log('\n=== 用户数据 ===');
try {
  const users = db.prepare("SELECT * FROM users LIMIT 10").all();
  console.log(`用户总数: ${users.length}`);
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role}) - 余额: ¥${user.balance} - 套餐: ${user.plan}`);
  });
} catch (e) {
  console.log('用户表查询错误:', e.message);
}

console.log('\n=== 套餐分类 ===');
try {
  const categories = db.prepare("SELECT * FROM plan_categories ORDER BY sort_order").all();
  console.log(`分类总数: ${categories.length}`);
  categories.forEach(cat => {
    console.log(`- ${cat.display_name} (${cat.name}) - 特色: ${cat.is_featured ? '是' : '否'}`);
  });
} catch (e) {
  console.log('套餐分类表查询错误:', e.message);
}

console.log('\n=== 套餐数据 ===');
try {
  const plans = db.prepare(`
    SELECT p.*, pc.display_name as category_name
    FROM plans p
    LEFT JOIN plan_categories pc ON p.category_id = pc.id
    ORDER BY p.sort_order
  `).all();
  console.log(`套餐总数: ${plans.length}`);
  plans.forEach(plan => {
    console.log(`- ${plan.name} (${plan.category_name}) - ¥${plan.price}/${plan.billing_period} - ${plan.is_active ? '启用' : '禁用'}`);
  });
} catch (e) {
  console.log('套餐表查询错误:', e.message);
}

console.log('\n=== 使用记录统计 ===');
try {
  const usageCount = db.prepare("SELECT COUNT(*) as count FROM usage_logs").get();
  console.log(`使用记录总数: ${usageCount.count}`);
} catch (e) {
  console.log('使用记录表查询错误:', e.message);
}

console.log('\n=== 账单记录统计 ===');
try {
  const billingCount = db.prepare("SELECT COUNT(*) as count FROM billing_records").get();
  console.log(`账单记录总数: ${billingCount.count}`);
} catch (e) {
  console.log('账单记录表查询错误:', e.message);
}

db.close();