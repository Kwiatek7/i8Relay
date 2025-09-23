import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// 数据库文件路径
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'aiporxy.db');
const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');
const SEED_PATH = path.join(process.cwd(), 'database', 'seed.sql');

// 定义异步数据库接口
export interface AsyncDatabase {
  get: (sql: string, params?: any) => Promise<any>;
  all: (sql: string, params?: any) => Promise<any[]>;
  run: (sql: string, params?: any) => Promise<sqlite3.RunResult>;
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
}

// 创建单例数据库连接
class DatabaseConnection {
  private static instance: AsyncDatabase | null = null;

  static async getInstance(): Promise<AsyncDatabase> {
    if (!this.instance) {
      // 确保数据目录存在
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 创建数据库连接
      const db = new sqlite3.Database(DB_PATH);

      // 将sqlite3的回调方法转换为Promise
      const asyncDb = db as any as AsyncDatabase;
      asyncDb.get = promisify(db.get.bind(db));
      asyncDb.all = promisify(db.all.bind(db));
      asyncDb.run = promisify(db.run.bind(db));
      asyncDb.exec = promisify(db.exec.bind(db));
      asyncDb.close = promisify(db.close.bind(db));

      this.instance = asyncDb;

      // 启用外键约束
      await this.instance.exec('PRAGMA foreign_keys = ON');

      // 设置性能优化选项
      await this.instance.exec('PRAGMA journal_mode = WAL');
      await this.instance.exec('PRAGMA synchronous = NORMAL');
      await this.instance.exec('PRAGMA cache_size = 1000');
      await this.instance.exec('PRAGMA temp_store = memory');

      // 初始化数据库架构
      await this.initializeSchema();

      console.log('✅ SQLite数据库连接已建立:', DB_PATH);
    }

    return this.instance;
  }

  private static async initializeSchema(): Promise<void> {
    if (!this.instance) return;

    try {
      // 检查是否已经初始化
      const result = await this.instance.get(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='users'
      `);

      if (!result) {
        console.log('🔧 正在初始化数据库架构...');

        // 执行schema.sql
        if (fs.existsSync(SCHEMA_PATH)) {
          const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
          await this.instance.exec(schema);
          console.log('✅ 数据库架构已创建');
        }

        // 执行seed.sql
        if (fs.existsSync(SEED_PATH)) {
          const seedData = fs.readFileSync(SEED_PATH, 'utf8');
          await this.instance.exec(seedData);
          console.log('✅ 初始化数据已导入');
        }
      }
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
      console.log('🔒 数据库连接已关闭');
    }
  }

  // 备份数据库
  static async backup(backupPath?: string): Promise<void> {
    if (!this.instance) {
      throw new Error('数据库未连接');
    }

    const backup = backupPath || `${DB_PATH}.backup.${Date.now()}`;
    // sqlite3不支持内置backup方法，使用文件复制
    fs.copyFileSync(DB_PATH, backup);
    console.log('💾 数据库已备份到:', backup);
  }

  // 获取数据库统计信息
  static async getStats(): Promise<{
    size: number;
    tables: number;
    indexes: number;
    pageCount: number;
    pageSize: number;
  }> {
    if (!this.instance) {
      throw new Error('数据库未连接');
    }

    const sizeResult = await this.instance.get('PRAGMA page_count') as { page_count: number };
    const pageSizeResult = await this.instance.get('PRAGMA page_size') as { page_size: number };

    const tablesResult = await this.instance.get(`
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `) as { count: number };

    const indexesResult = await this.instance.get(`
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `) as { count: number };

    return {
      size: sizeResult.page_count * pageSizeResult.page_size,
      tables: tablesResult.count,
      indexes: indexesResult.count,
      pageCount: sizeResult.page_count,
      pageSize: pageSizeResult.page_size
    };
  }
}

// 导出数据库连接类和获取实例的函数
export async function getDb(): Promise<AsyncDatabase> {
  return await DatabaseConnection.getInstance();
}

export { DatabaseConnection };
export default DatabaseConnection;