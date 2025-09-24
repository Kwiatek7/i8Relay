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
      // 将多语句SQL分割并逐一执行
      const statements = this.splitSQLStatements(sqlQuery);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await sql.query(statement);
        }
      }
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

  async needsInitialization(): Promise<boolean> {
    try {
      if (!this.connected) await this.connect();

      // 检查是否存在关键表
      const result = await this.get(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      `);

      return !result; // 如果没有 users 表，则需要初始化
    } catch (error) {
      console.error('检查 PostgreSQL 数据库状态失败:', error);
      return true; // 出错时假设需要初始化
    }
  }

  async initializeIfNeeded(): Promise<void> {
    try {
      const needsInit = await this.needsInitialization();

      if (needsInit) {
        console.log('🔍 检测到 PostgreSQL 数据库为空，开始自动初始化...');
        await this.initialize();
        console.log('🎉 PostgreSQL 数据库自动初始化完成！');
      } else {
        // 只在非构建环境显示已初始化信息
        if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PHASE) {
          console.log('✅ PostgreSQL 数据库已初始化，跳过自动初始化');
        }
      }
    } catch (error) {
      console.error('❌ PostgreSQL 数据库自动初始化失败:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema-postgres.sql');
    const SEED_PATH = path.join(process.cwd(), 'database', 'seed-postgres.sql');

    try {
      console.log('🔧 正在初始化 PostgreSQL 数据库架构...');

      // 优先使用 PostgreSQL 专用架构文件
      if (fs.existsSync(SCHEMA_PATH)) {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        await this.executePostgreSQLSchema(schema);
        console.log('✅ PostgreSQL 数据库架构已创建');
      } else {
        // 如果没有专门的 PostgreSQL schema，转换 SQLite schema
        const sqliteSchemaPath = path.join(process.cwd(), 'database', 'schema.sql');
        if (fs.existsSync(sqliteSchemaPath)) {
          const sqliteSchema = fs.readFileSync(sqliteSchemaPath, 'utf8');
          const pgSchema = this.convertSchemaToPostgreSQL(sqliteSchema);
          await this.executePostgreSQLSchema(pgSchema);
          console.log('✅ 从 SQLite 架构转换的 PostgreSQL 数据库架构已创建');
        } else {
          throw new Error('未找到数据库架构文件');
        }
      }

      // 优先使用 PostgreSQL 专用种子数据文件
      if (fs.existsSync(SEED_PATH)) {
        const seedData = fs.readFileSync(SEED_PATH, 'utf8');
        await this.executePostgreSQLSeed(seedData);
        console.log('✅ PostgreSQL 初始化数据已导入');
      } else {
        // 转换 SQLite seed 数据
        const sqliteSeedPath = path.join(process.cwd(), 'database', 'seed.sql');
        if (fs.existsSync(sqliteSeedPath)) {
          const sqliteSeed = fs.readFileSync(sqliteSeedPath, 'utf8');
          const pgSeed = this.convertSQLiteToPostgreSQL(sqliteSeed);
          await this.executePostgreSQLSeed(pgSeed);
          console.log('✅ 从 SQLite 转换的初始化数据已导入');
        } else {
          throw new Error('未找到数据库种子文件');
        }
      }
    } catch (error) {
      console.error('❌ PostgreSQL 数据库初始化失败:', error);
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

  /**
   * 执行 PostgreSQL 架构文件
   */
  private async executePostgreSQLSchema(schema: string): Promise<void> {
    // 先启用UUID扩展
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    } catch (error) {
      console.warn('⚠️ UUID 扩展可能已存在或无法启用:', error);
    }

    // 分割并执行架构语句
    const statements = this.splitSQLStatements(schema);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement && !this.isCommentOrEmpty(trimmedStatement)) {
        try {
          await sql.query(trimmedStatement);
        } catch (error) {
          console.error(`执行架构语句失败: ${trimmedStatement.substring(0, 100)}...`);
          throw error;
        }
      }
    }
  }

  /**
   * 执行 PostgreSQL 种子数据文件
   */
  private async executePostgreSQLSeed(seedData: string): Promise<void> {
    const statements = this.splitSQLStatements(seedData);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement && !this.isCommentOrEmpty(trimmedStatement)) {
        try {
          await sql.query(trimmedStatement);
        } catch (error) {
          // 对于种子数据，可能存在重复插入的情况，适当忽略某些错误
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('duplicate key') &&
              !errorMessage.includes('already exists')) {
            console.error(`执行种子数据语句失败: ${trimmedStatement.substring(0, 100)}...`);
            throw error;
          } else {
            console.log('🔄 跳过重复数据插入');
          }
        }
      }
    }
  }

  /**
   * 分割SQL语句
   */
  private splitSQLStatements(sql: string): string[] {
    // 移除注释并分割语句
    return sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !this.isCommentOrEmpty(statement));
  }

  /**
   * 检查是否为注释或空行
   */
  private isCommentOrEmpty(statement: string): boolean {
    const trimmed = statement.trim();
    return trimmed === '' || 
           trimmed.startsWith('--') || 
           trimmed.startsWith('/*') ||
           /^\s*$/.test(trimmed);
  }

  /**
   * SQLite 语法转换为 PostgreSQL 语法（用于动态转换）
   */
  private convertSQLiteToPostgreSQL(sql: string): string {
    return sql
      .replace(/AUTOINCREMENT/gi, 'SERIAL')
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
      .replace(/PRAGMA.*?;/gi, '') // 移除 PRAGMA 语句
      .replace(/BEGIN TRANSACTION/gi, 'BEGIN')
      .replace(/END TRANSACTION/gi, 'COMMIT')
      // 处理 SQLite 特有的语法
      .replace(/IF NOT EXISTS/gi, 'IF NOT EXISTS')
      .replace(/REPLACE\s+INTO/gi, 'INSERT INTO ... ON CONFLICT ... DO UPDATE SET');
  }

  /**
   * SQLite schema 转换为 PostgreSQL schema（用于架构转换）
   */
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
      .replace(/END TRANSACTION/gi, 'COMMIT')
      // 添加UUID扩展
      .replace(/^/, 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n');
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