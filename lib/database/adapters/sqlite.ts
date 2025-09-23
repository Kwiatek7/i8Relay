import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { DatabaseAdapter, DatabaseStats } from './base';

// 动态导入 sqlite3，在 Vercel 环境中会失败但不会阻塞
let sqlite3: any = null;
try {
  sqlite3 = require('sqlite3');
} catch (error) {
  console.warn('SQLite3 不可用，可能在 Vercel 环境中');
}

export class SQLiteAdapter implements DatabaseAdapter {
  private db: any = null;
  private connected = false;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'aiporxy.db');
  }

  async connect(): Promise<void> {
    if (!sqlite3) {
      throw new Error('SQLite3 不可用，请在支持的环境中使用或切换到其他数据库');
    }

    if (this.connected) return;

    // 确保数据目录存在
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建数据库连接
    this.db = new sqlite3.Database(this.dbPath);

    // 将回调方法转换为 Promise
    this.db.get = promisify(this.db.get.bind(this.db));
    this.db.all = promisify(this.db.all.bind(this.db));
    this.db.run = promisify(this.db.run.bind(this.db));
    this.db.exec = promisify(this.db.exec.bind(this.db));
    this.db.close = promisify(this.db.close.bind(this.db));

    this.connected = true;

    // 启用外键约束和性能优化
    await this.exec('PRAGMA foreign_keys = ON');
    await this.exec('PRAGMA journal_mode = WAL');
    await this.exec('PRAGMA synchronous = NORMAL');
    await this.exec('PRAGMA cache_size = 1000');
    await this.exec('PRAGMA temp_store = memory');

    console.log('✅ SQLite 数据库连接已建立:', this.dbPath);
  }

  async get(sql: string, params?: any): Promise<any> {
    if (!this.connected) await this.connect();
    return await this.db.get(sql, params);
  }

  async all(sql: string, params?: any): Promise<any[]> {
    if (!this.connected) await this.connect();
    return await this.db.all(sql, params);
  }

  async run(sql: string, params?: any): Promise<{ lastID?: number; changes?: number }> {
    if (!this.connected) await this.connect();
    const result = await this.db.run(sql, params);
    return {
      lastID: result.lastID,
      changes: result.changes
    };
  }

  async exec(sql: string): Promise<void> {
    if (!this.connected) await this.connect();
    await this.db.exec(sql);
  }

  async close(): Promise<void> {
    if (this.db && this.connected) {
      await this.db.close();
      this.connected = false;
      console.log('🔒 SQLite 数据库连接已关闭');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async initialize(): Promise<void> {
    const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');
    const SEED_PATH = path.join(process.cwd(), 'database', 'seed.sql');

    try {
      // 检查是否已经初始化
      const result = await this.get(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='users'
      `);

      if (!result) {
        console.log('🔧 正在初始化 SQLite 数据库架构...');

        // 执行 schema.sql
        if (fs.existsSync(SCHEMA_PATH)) {
          const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
          await this.exec(schema);
          console.log('✅ 数据库架构已创建');
        }

        // 执行 seed.sql
        if (fs.existsSync(SEED_PATH)) {
          const seedData = fs.readFileSync(SEED_PATH, 'utf8');
          await this.exec(seedData);
          console.log('✅ 初始化数据已导入');
        }
      }
    } catch (error) {
      console.error('❌ SQLite 数据库初始化失败:', error);
      throw error;
    }
  }

  async backup(backupPath?: string): Promise<void> {
    const backup = backupPath || `${this.dbPath}.backup.${Date.now()}`;
    fs.copyFileSync(this.dbPath, backup);
    console.log('💾 SQLite 数据库已备份到:', backup);
  }

  async getStats(): Promise<DatabaseStats> {
    const sizeResult = await this.get('PRAGMA page_count') as { page_count: number };
    const pageSizeResult = await this.get('PRAGMA page_size') as { page_size: number };

    const tablesResult = await this.get(`
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `) as { count: number };

    const indexesResult = await this.get(`
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

// 检查 SQLite 是否可用
export function isSQLiteAvailable(): boolean {
  return sqlite3 !== null;
}