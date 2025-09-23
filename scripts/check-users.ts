import { getDb } from '../lib/database/connection';

async function checkUsers() {
  try {
    const db = await getDb();

    console.log('检查现有用户...');
    const users = await db.all('SELECT id, username, role FROM users LIMIT 10');
    console.log('现有用户:', users);

    if (users.length === 0) {
      console.log('❌ 没有找到用户，需要先创建一个系统用户');
    } else {
      console.log('✅ 找到用户，可以使用第一个用户作为系统默认用户');
    }

  } catch (error) {
    console.error('检查用户失败:', error);
  }
}

checkUsers();