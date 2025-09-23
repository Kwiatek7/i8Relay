#!/usr/bin/env tsx

import { getDb } from '../lib/database/connection';

async function checkOtherTables() {
  const db = await getDb();

  console.log('=== 用户订阅表结构 ===');
  try {
    const subscriptionSchema = await db.all("PRAGMA table_info(user_subscriptions)");
    console.log('用户订阅表字段:', subscriptionSchema);
  } catch (e) {
    console.log('用户订阅表查询失败:', (e as Error).message);
  }

  console.log('\n=== 使用记录表结构 ===');
  try {
    const usageSchema = await db.all("PRAGMA table_info(usage_logs)");
    console.log('使用记录表字段:', usageSchema);
  } catch (e) {
    console.log('使用记录表查询失败:', (e as Error).message);
  }

  console.log('\n=== 账单记录表结构 ===');
  try {
    const billingSchema = await db.all("PRAGMA table_info(billing_records)");
    console.log('账单记录表字段:', billingSchema);
  } catch (e) {
    console.log('账单记录表查询失败:', (e as Error).message);
  }
}

checkOtherTables().catch(console.error);