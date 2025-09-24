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
      const enhancedError = this.enhanceError(error, 'QUERY', sqlQuery);
      console.error('查询失败:', enhancedError.message);
      throw enhancedError;
    }
  }

  async all(sqlQuery: string, params?: any): Promise<any[]> {
    if (!this.connected) await this.connect();

    try {
      const pgQuery = this.convertSQLiteToPostgreSQL(sqlQuery);
      const result = await sql.query(pgQuery, params ? Object.values(params) : []);
      return result.rows;
    } catch (error) {
      const enhancedError = this.enhanceError(error, 'QUERY', sqlQuery);
      console.error('查询失败:', enhancedError.message);
      throw enhancedError;
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
      const enhancedError = this.enhanceError(error, 'EXECUTE', sqlQuery);
      console.error('执行失败:', enhancedError.message);
      throw enhancedError;
    }
  }

  async exec(sqlQuery: string): Promise<void> {
    if (!this.connected) await this.connect();

    try {
      // 将多语句SQL分割并逐一执行
      const statements = this.splitSQLStatements(sqlQuery);

      for (const statement of statements) {
        if (statement.trim()) {
          await this.executeWithRetry(statement, 'EXECUTE');
        }
      }
    } catch (error) {
      const enhancedError = this.enhanceError(error, 'BATCH_EXECUTE', sqlQuery);
      console.error('批量执行失败:', enhancedError.message);
      throw enhancedError;
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
      console.log('🔍 检查数据库架构完整性...');

      // 1. 检查关键表是否存在
      const requiredTables = ['users', 'plans', 'plan_categories', 'system_config'];

      for (const tableName of requiredTables) {
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

      // 2. 检查关键约束是否存在（这是造成重复初始化的主要原因）
      console.log('🔍 检查关键约束是否存在...');
      const constraintResult = await sql`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND constraint_name = 'fk_users_current_plan'
        AND constraint_type = 'FOREIGN KEY'
      `;

      if (constraintResult.rows.length === 0) {
        console.log('❌ 关键外键约束 fk_users_current_plan 不存在，需要初始化数据库');
        return true;
      } else {
        console.log('✅ 关键外键约束存在');
      }

      // 3. 检查关键索引是否存在
      console.log('🔍 检查关键索引是否存在...');
      const indexResult = await sql`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = 'idx_users_email'
      `;

      if (indexResult.rows.length === 0) {
        console.log('❌ 关键索引 idx_users_email 不存在，需要初始化数据库');
        return true;
      } else {
        console.log('✅ 关键索引存在');
      }

      // 4. 检查是否有基础数据
      console.log('🔍 检查基础配置数据...');
      const configResult = await sql`
        SELECT COUNT(*) as count FROM system_config WHERE category = 'site'
      `;

      if (parseInt(configResult.rows[0]?.count || '0') === 0) {
        console.log('❌ 基础配置数据缺失，需要初始化数据库');
        return true;
      } else {
        console.log('✅ 基础配置数据存在');
      }

      console.log('🎉 数据库架构完整，跳过初始化');
      return false;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 检查 PostgreSQL 数据库状态失败:', errorMessage);

      if (error instanceof Error && 'code' in error) {
        console.error('错误详情:', {
          code: (error as any).code,
          message: errorMessage,
          detail: (error as any).detail
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
          const enhancedError = this.enhanceError(error, 'SCHEMA_EXECUTE', trimmedStatement);

          // 检查是否为可忽略的架构错误（如重复创建）
          if (this.isIgnorableSchemaError(error)) {
            console.log(`🔄 跳过已存在的架构元素（正常行为）: ${trimmedStatement.substring(0, 80)}...`);
            continue;
          }

          console.error(`❌ 执行架构语句失败:`);
          console.error(`   语句: ${trimmedStatement.substring(0, 200)}...`);
          console.error(`   错误: ${enhancedError.message}`);
          console.error(`   建议: ${enhancedError.suggestion || '检查SQL语法和表依赖关系'}`);

          throw new Error(`PostgreSQL 架构执行失败: ${enhancedError.message}`);
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
          const enhancedError = this.enhanceError(error, 'SEED_EXECUTE', trimmedStatement);

          if (this.isIgnorableError(error)) {
            skippedCount++;
            console.log('🔄 跳过重复数据插入（正常行为）');
          } else {
            console.error(`❌ 执行种子数据语句失败:`);
            console.error(`   语句: ${trimmedStatement.substring(0, 200)}...`);
            console.error(`   错误: ${enhancedError.message}`);
            console.error(`   建议: ${enhancedError.suggestion || '检查数据格式和约束'}`);

            throw new Error(`PostgreSQL 种子数据执行失败: ${enhancedError.message}`);
          }
        }
      }
    }
    
    console.log(`🎉 PostgreSQL 种子数据执行完成，成功执行 ${executedCount} 个语句，跳过 ${skippedCount} 个重复语句`);
  }

  /**
   * 智能分割SQL语句，正确处理多行语句和嵌套结构
   */
  private splitSQLStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inComment = false;
    let inMultiLineComment = false;
    let parenthesesDepth = 0;

    const lines = sql.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 跳过纯注释行
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }

      // 处理多行注释
      if (trimmedLine.startsWith('/*')) {
        inMultiLineComment = true;
        continue;
      }
      if (inMultiLineComment) {
        if (trimmedLine.endsWith('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }

      // 逐字符分析
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];

        // 处理注释
        if (!inSingleQuote && !inDoubleQuote && char === '-' && nextChar === '-') {
          break; // 跳过行的其余部分
        }

        // 处理引号
        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
        } else if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
        }

        // 如果在引号内，直接添加字符
        if (inSingleQuote || inDoubleQuote) {
          currentStatement += char;
          continue;
        }

        // 处理括号
        if (char === '(') {
          parenthesesDepth++;
        } else if (char === ')') {
          parenthesesDepth--;
        }

        // 处理分号
        if (char === ';' && parenthesesDepth === 0) {
          // 语句结束
          currentStatement += char;
          const statement = currentStatement.trim();
          if (statement && !this.isCommentOrEmpty(statement)) {
            statements.push(statement);
          }
          currentStatement = '';
          continue;
        }

        currentStatement += char;
      }

      // 添加换行符（除非在引号内）
      if (!inSingleQuote && !inDoubleQuote) {
        currentStatement += '\n';
      }
    }

    // 处理最后一个语句（如果没有以分号结尾）
    if (currentStatement.trim() && !this.isCommentOrEmpty(currentStatement.trim())) {
      statements.push(currentStatement.trim());
    }

    // 过滤并清理语句
    return statements
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !this.isCommentOrEmpty(stmt))
      .map(stmt => {
        // 移除多余的空白字符，但保留必要的空格
        return stmt.replace(/\s+/g, ' ').trim();
      });
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
   * 增强错误信息，提供更有用的调试信息和解决建议
   */
  private enhanceError(error: any, operation: string, sql?: string): { message: string; code?: string; suggestion?: string } {
    const errorCode = error?.code;
    const errorMessage = error instanceof Error ? error.message : String(error);
    let suggestion = '';

    // PostgreSQL 常见错误码处理
    switch (errorCode) {
      case '42P01': // relation does not exist
        suggestion = '表不存在，请检查表名是否正确，或确保数据库架构已正确初始化';
        break;
      case '42701': // duplicate column
        suggestion = '列名重复，请检查表定义中是否有重复的列名';
        break;
      case '42P07': // relation already exists
        suggestion = '表已存在，这通常是正常的，可能是重复初始化';
        break;
      case '42710': // constraint already exists
        suggestion = '约束已存在，这通常是正常的，可能是重复创建外键或约束';
        break;
      case '23505': // unique violation
        suggestion = '唯一性约束冲突，数据可能已存在';
        break;
      case '23503': // foreign key violation
        suggestion = '外键约束违反，请检查引用的表和数据是否存在';
        break;
      case '42703': // undefined column
        suggestion = '列不存在，请检查列名是否正确';
        break;
      case '08006': // connection failure
        suggestion = '数据库连接失败，请检查网络连接和数据库服务状态';
        break;
      case '53300': // too many connections
        suggestion = '数据库连接数过多，请稍后重试';
        break;
      default:
        suggestion = '请检查SQL语法和数据库状态';
    }

    const enhancedMessage = `[${operation}] ${errorMessage}${errorCode ? ` (错误码: ${errorCode})` : ''}`;

    return {
      message: enhancedMessage,
      code: errorCode,
      suggestion
    };
  }

  /**
   * 检查是否为可忽略的错误（通常是重复数据插入）
   */
  private isIgnorableError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code;

    // PostgreSQL 重复数据相关的错误码和消息
    const ignorableCodes = ['23505']; // unique violation
    const ignorableMessages = [
      'duplicate key',
      'already exists',
      'unique constraint',
      'duplicate',
      'violates unique constraint'
    ];

    return ignorableCodes.includes(errorCode) ||
           ignorableMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()));
  }

  /**
   * 检查是否为可忽略的架构错误（通常是重复创建表、索引、约束等）
   */
  private isIgnorableSchemaError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code;

    // PostgreSQL 架构相关的可忽略错误码
    const ignorableSchemaErrors = [
      '42P07', // relation already exists (table, index)
      '42710', // constraint already exists
      '42P06', // schema already exists
      '42723', // role already exists
    ];

    const ignorableSchemaMessages = [
      'already exists',
      'relation already exists',
      'constraint already exists',
      'index already exists',
      'duplicate object'
    ];

    return ignorableSchemaErrors.includes(errorCode) ||
           ignorableSchemaMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()));
  }

  /**
   * 带重试的执行方法，用于处理临时性错误
   */
  private async executeWithRetry(statement: string, operation: string, maxRetries = 2): Promise<any> {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await sql.query(statement);
      } catch (error) {
        lastError = error;
        const errorCode = (error as any)?.code;

        // 只对特定的临时性错误进行重试
        const retryableCodes = ['53300', '08006', '08001']; // connection issues

        if (attempt <= maxRetries && retryableCodes.includes(errorCode)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ ${operation} 失败，${delay}ms后重试 (${attempt}/${maxRetries}): ${errorMessage}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    throw lastError;
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