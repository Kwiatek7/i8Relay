import { getDb } from '../lib/database/connection';

async function testDatabaseFix() {
  try {
    console.log('🔧 测试数据库 SQLite 适配器修复...');

    const db = await getDb();

    // 测试 run 方法是否正确返回 lastID 和 changes
    console.log('📝 测试 INSERT 操作和 lastID 返回...');

    // 创建测试表
    await db.run(`
      CREATE TEMPORARY TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        value TEXT
      )
    `);

    // 测试插入操作
    const insertResult = await db.run(`
      INSERT INTO test_table (name, value)
      VALUES (?, ?)
    `, ['test_name', 'test_value']);

    console.log('✅ INSERT 结果:', insertResult);

    if (insertResult.lastID !== undefined) {
      console.log('✅ lastID 正确返回:', insertResult.lastID);
    } else {
      console.error('❌ lastID 仍然是 undefined');
      return false;
    }

    if (insertResult.changes !== undefined) {
      console.log('✅ changes 正确返回:', insertResult.changes);
    } else {
      console.error('❌ changes 仍然是 undefined');
      return false;
    }

    // 测试更新操作
    console.log('📝 测试 UPDATE 操作和 changes 返回...');
    const updateResult = await db.run(`
      UPDATE test_table
      SET value = ?
      WHERE id = ?
    `, ['updated_value', insertResult.lastID]);

    console.log('✅ UPDATE 结果:', updateResult);

    if (updateResult.changes !== undefined && updateResult.changes > 0) {
      console.log('✅ UPDATE changes 正确返回:', updateResult.changes);
    } else {
      console.error('❌ UPDATE changes 不正确:', updateResult.changes);
      return false;
    }

    // 验证数据是否正确插入
    const selectResult = await db.get(`
      SELECT * FROM test_table WHERE id = ?
    `, [insertResult.lastID]);

    console.log('✅ 查询结果:', selectResult);

    if (selectResult && selectResult.value === 'updated_value') {
      console.log('✅ 数据操作成功验证');
    } else {
      console.error('❌ 数据验证失败:', selectResult);
      return false;
    }

    console.log('🎉 SQLite 适配器修复测试通过！');
    return true;

  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    return false;
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  testDatabaseFix()
    .then(success => {
      if (success) {
        console.log('✅ 数据库修复验证成功');
        process.exit(0);
      } else {
        console.error('❌ 数据库修复验证失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 测试脚本执行失败:', error);
      process.exit(1);
    });
}

export { testDatabaseFix };