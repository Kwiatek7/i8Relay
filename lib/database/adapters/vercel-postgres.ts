import { sql } from '@vercel/postgres';
import { DatabaseAdapter, DatabaseStats } from './base';
import path from 'path';
import fs from 'fs';

export class VercelPostgresAdapter implements DatabaseAdapter {
  private connected = false;

  constructor() {
    // Vercel Postgres 使用环境变量自动配置
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // 测试连接
      await sql`SELECT 1 as test`;
      this.connected = true;
      console.log('✅ Vercel Postgres 数据库连接已建立');
    } catch (error) {
      console.error('❌ Vercel Postgres 连接失败:', error);
      throw error;
    }
  }

  async get(sqlQuery: string, params?: any): Promise<any> {
    if (!this.connected) await this.connect();

    try {
      // 转换 SQLite 语法为 PostgreSQL 语法
      const pgQuery = this.convertSQLiteToPostgreSQL(sqlQuery);

      // Vercel Postgres 使用模板字符串
      const result = await sql.query(pgQuery, params ? Object.values(params) : []);
      return result.rows[0] || null;
    } catch (error) {
      console.error('查询失败:', error);
      throw error;
    }
  }

  async all(sqlQuery: string, params?: any): Promise<any[]> {
    if (!this.connected) await this.connect();

    try {
      const pgQuery = this.convertSQLiteToPostgreSQL(sqlQuery);
      const result = await sql.query(pgQuery, params ? Object.values(params) : []);
      return result.rows;
    } catch (error) {
      console.error('查询失败:', error);
      throw error;
    }
  }

  async run(sqlQuery: string, params?: any): Promise<{ lastID?: number; changes?: number }> {
    if (!this.connected) await this.connect();

    try {
      const pgQuery = this.convertSQLiteToPostgreSQL(sqlQuery);
      const result = await sql.query(pgQuery, params ? Object.values(params) : []);

      return {
        lastID: result.rows[0]?.id || undefined,
        changes: result.rowCount || 0
      };
    } catch (error) {
      console.error('执行失败:', error);
      throw error;
    }
  }

  async exec(sqlQuery: string): Promise<void> {
    if (!this.connected) await this.connect();

    try {
      const pgQuery = this.convertSQLiteToPostgreSQL(sqlQuery);
      await sql.query(pgQuery);
    } catch (error) {
      console.error('执行失败:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Vercel Postgres 连接自动管理
    this.connected = false;
    console.log('🔒 Vercel Postgres 数据库连接已关闭');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async initialize(): Promise<void> {
    const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema-postgres.sql');
    const SEED_PATH = path.join(process.cwd(), 'database', 'seed-postgres.sql');

    try {
      // 检查是否已经初始化
      const result = await this.get(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      `);

      if (!result) {
        console.log('🔧 正在初始化 Postgres 数据库架构...');

        // 执行 PostgreSQL schema
        if (fs.existsSync(SCHEMA_PATH)) {
          const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
          await this.exec(schema);
          console.log('✅ Postgres 数据库架构已创建');
        } else {
          // 如果没有专门的 PostgreSQL schema，转换 SQLite schema
          const sqliteSchemaPath = path.join(process.cwd(), 'database', 'schema.sql');
          if (fs.existsSync(sqliteSchemaPath)) {
            const sqliteSchema = fs.readFileSync(sqliteSchemaPath, 'utf8');
            const pgSchema = this.convertSchemaToPostgreSQL(sqliteSchema);
            await this.exec(pgSchema);
            console.log('✅ 从 SQLite 架构转换的 Postgres 数据库架构已创建');
          }
        }

        // 执行 seed data
        if (fs.existsSync(SEED_PATH)) {
          const seedData = fs.readFileSync(SEED_PATH, 'utf8');
          await this.exec(seedData);
          console.log('✅ Postgres 初始化数据已导入');
        } else {
          // 转换 SQLite seed 数据
          const sqliteSeedPath = path.join(process.cwd(), 'database', 'seed.sql');
          if (fs.existsSync(sqliteSeedPath)) {
            const sqliteSeed = fs.readFileSync(sqliteSeedPath, 'utf8');
            const pgSeed = this.convertSQLiteToPostgreSQL(sqliteSeed);
            await this.exec(pgSeed);
            console.log('✅ 从 SQLite 转换的初始化数据已导入');
          }
        }
      }
    } catch (error) {
      console.error('❌ Postgres 数据库初始化失败:', error);
      throw error;
    }
  }

  async getStats(): Promise<DatabaseStats> {
    const sizeResult = await this.get(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size_pretty,
             pg_database_size(current_database()) as size_bytes
    `);

    const tablesResult = await this.get(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const indexesResult = await this.get(`
      SELECT COUNT(*) as count FROM pg_indexes
      WHERE schemaname = 'public'
    `);

    return {
      size: parseInt(sizeResult.size_bytes) || 0,
      tables: parseInt(tablesResult.count) || 0,
      indexes: parseInt(indexesResult.count) || 0
    };
  }

  // SQLite 语法转换为 PostgreSQL 语法
  private convertSQLiteToPostgreSQL(sql: string): string {
    return sql
      .replace(/AUTOINCREMENT/gi, 'SERIAL')
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
      .replace(/PRAGMA.*?;/gi, '') // 移除 PRAGMA 语句
      .replace(/BEGIN TRANSACTION/gi, 'BEGIN')
      .replace(/END TRANSACTION/gi, 'COMMIT');
  }

  // SQLite schema 转换为 PostgreSQL schema
  private convertSchemaToPostgreSQL(schema: string): string {
    return schema
      .replace(/AUTOINCREMENT/gi, 'SERIAL')
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME/gi, 'TIMESTAMP')
      .replace(/TEXT/gi, 'TEXT')
      .replace(/REAL/gi, 'DECIMAL')
      .replace(/BLOB/gi, 'BYTEA')
      .replace(/PRAGMA.*?;/gi, '') // 移除 PRAGMA 语句
      .replace(/BEGIN TRANSACTION/gi, 'BEGIN')
      .replace(/END TRANSACTION/gi, 'COMMIT');
  }
}

// 检查 Vercel Postgres 是否可用
export function isVercelPostgresAvailable(): boolean {
  return !!(
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}