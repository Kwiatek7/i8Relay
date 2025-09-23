#!/usr/bin/env tsx

import { getDb } from '../lib/database/connection';

async function checkSchema() {
  const db = await getDb();

  console.log('=== 用户表结构 ===');
  try {
    const userSchema = await db.all("PRAGMA table_info(users)");
    console.log('用户表字段:', userSchema);
  } catch (e) {
    console.log('用户表不存在或查询失败:', (e as Error).message);
  }

  console.log('\n=== 套餐表结构 ===');
  try {
    const planSchema = await db.all("PRAGMA table_info(plans)");
    console.log('套餐表字段:', planSchema);
  } catch (e) {
    console.log('套餐表不存在或查询失败:', (e as Error).message);
  }

  console.log('\n=== 套餐分类表结构 ===');
  try {
    const categorySchema = await db.all("PRAGMA table_info(plan_categories)");
    console.log('套餐分类表字段:', categorySchema);
  } catch (e) {
    console.log('套餐分类表不存在或查询失败:', (e as Error).message);
  }

  console.log('\n=== 所有表 ===');
  try {
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('数据库中的表:', tables);
  } catch (e) {
    console.log('查询表失败:', (e as Error).message);
  }

  console.log('\n=== 现有用户数据 ===');
  try {
    const users = await db.all("SELECT id, username, email, role FROM users LIMIT 5");
    console.log('现有用户:', users);
  } catch (e) {
    console.log('用户查询失败:', (e as Error).message);
  }

  console.log('\n=== 现有套餐分类 ===');
  try {
    const categories = await db.all("SELECT * FROM plan_categories");
    console.log('现有分类:', categories);
  } catch (e) {
    console.log('分类查询失败:', (e as Error).message);
  }
}

checkSchema().catch(console.error);