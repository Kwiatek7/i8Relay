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
      
      // 自动初始化数据库（如果需要）
      await this.initializeIfNeeded();
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
      console.log('🔍 检查数据库表是否存在...');

      // 检查关键表是否存在
      const tables = ['users', 'plans', 'plan_categories', 'system_config'];
      
      for (const tableName of tables) {
        const result = await sql`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ${tableName}
        `;
        
        if (result.rows.length === 0) {
          console.log(`❌ 关键表 '${tableName}' 不存在，需要初始化数据库`);
          return true;
        } else {
          console.log(`✅ 表 '${tableName}' 存在`);
        }
      }

      console.log('✅ 所有关键表都存在，数据库已初始化');
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 检查 PostgreSQL 数据库状态失败:', errorMessage);
      
      if (error instanceof Error && 'code' in error) {
        console.error('错误详情:', {
          code: (error as any).code,
          message: errorMessage
        });
      }
      
      console.log('⚠️ 由于检查失败，假设需要初始化数据库');
      return true; // 出错时假设需要初始化
    }
  }

  async initializeIfNeeded(): Promise<void> {
    try {
      console.log('🔍 正在检查 PostgreSQL 数据库状态...');
      const needsInit = await this.needsInitialization();

      if (needsInit) {
        console.log('🔍 检测到 PostgreSQL 数据库为空，开始自动初始化...');
        await this.initialize();
        console.log('🎉 PostgreSQL 数据库自动初始化完成！');
      } else {
        console.log('✅ PostgreSQL 数据库已初始化，跳过自动初始化');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ PostgreSQL 数据库自动初始化失败:', errorMessage);
      
      // 在生产环境中，如果初始化失败，我们应该抛出错误
      // 但也要提供有用的调试信息
      if (error instanceof Error && 'code' in error) {
        console.error('错误详情:', {
          code: (error as any).code,
          detail: (error as any).detail,
          hint: (error as any).hint,
          position: (error as any).position,
          where: (error as any).where
        });
      }
      
      throw new Error(`PostgreSQL 初始化失败: ${errorMessage}`);
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
    console.log('🔧 开始执行 PostgreSQL 架构语句...');
    
    // 先启用UUID扩展
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
      console.log('✅ UUID 扩展已启用');
    } catch (error) {
      console.warn('⚠️ UUID 扩展可能已存在或无法启用:', error);
    }

    // 分割并执行架构语句
    const statements = this.splitSQLStatements(schema);
    console.log(`📝 准备执行 ${statements.length} 个架构语句`);
    
    let executedCount = 0;
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement && !this.isCommentOrEmpty(trimmedStatement)) {
        try {
          console.log(`🔄 执行语句 ${executedCount + 1}/${statements.length}: ${trimmedStatement.substring(0, 80)}...`);
          await sql.query(trimmedStatement);
          executedCount++;
          console.log(`✅ 语句执行成功`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ 执行架构语句失败:`);
          console.error(`   语句: ${trimmedStatement.substring(0, 200)}...`);
          console.error(`   错误: ${errorMessage}`);
          
          if (error instanceof Error && 'code' in error) {
            console.error('   错误详情:', {
              code: (error as any).code,
              detail: (error as any).detail,
              hint: (error as any).hint
            });
          }
          
          throw new Error(`PostgreSQL 架构执行失败: ${errorMessage}`);
        }
      }
    }
    
    console.log(`🎉 PostgreSQL 架构执行完成，成功执行 ${executedCount} 个语句`);
  }

  /**
   * 执行 PostgreSQL 种子数据文件
   */
  private async executePostgreSQLSeed(seedData: string): Promise<void> {
    console.log('🌱 开始执行 PostgreSQL 种子数据...');
    
    const statements = this.splitSQLStatements(seedData);
    console.log(`📝 准备执行 ${statements.length} 个种子数据语句`);
    
    let executedCount = 0;
    let skippedCount = 0;
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement && !this.isCommentOrEmpty(trimmedStatement)) {
        try {
          console.log(`🔄 执行种子数据 ${executedCount + skippedCount + 1}/${statements.length}: ${trimmedStatement.substring(0, 80)}...`);
          await sql.query(trimmedStatement);
          executedCount++;
          console.log(`✅ 种子数据执行成功`);
        } catch (error) {
          // 对于种子数据，可能存在重复插入的情况，适当忽略某些错误
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('duplicate key') &&
              !errorMessage.includes('already exists') &&
              !errorMessage.includes('unique constraint')) {
            console.error(`❌ 执行种子数据语句失败:`);
            console.error(`   语句: ${trimmedStatement.substring(0, 200)}...`);
            console.error(`   错误: ${errorMessage}`);
            
            if (error instanceof Error && 'code' in error) {
              console.error('   错误详情:', {
                code: (error as any).code,
                detail: (error as any).detail,
                hint: (error as any).hint
              });
            }
            
            throw new Error(`PostgreSQL 种子数据执行失败: ${errorMessage}`);
          } else {
            skippedCount++;
            console.log('🔄 跳过重复数据插入（正常行为）');
          }
        }
      }
    }
    
    console.log(`🎉 PostgreSQL 种子数据执行完成，成功执行 ${executedCount} 个语句，跳过 ${skippedCount} 个重复语句`);
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