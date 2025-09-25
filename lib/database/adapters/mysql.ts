import mysql from 'mysql2/promise';
import { DatabaseAdapter, DatabaseStats } from './base';
import path from 'path';
import fs from 'fs';

// 动态导入 mysql2，如果不可用也不会阻塞
let mysqlModule: typeof mysql | null = null;
try {
  mysqlModule = require('mysql2/promise');
} catch (error) {
  console.warn('MySQL2 不可用，可能需要安装依赖');
}

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset?: string;
  timezone?: string;
}

export class MySQLAdapter implements DatabaseAdapter {
  private connection: mysql.Connection | null = null;
  private connected = false;
  private config: MySQLConfig;

  constructor(config?: Partial<MySQLConfig>) {
    // 默认配置
    this.config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'aiporxy',
      charset: 'utf8mb4',
      timezone: '+00:00',
      ...config
    };
  }

  async connect(): Promise<void> {
    if (!mysqlModule) {
      throw new Error('MySQL2 不可用，请安装 mysql2 依赖：npm install mysql2');
    }

    if (this.connected) return;

    try {
      // 创建 MySQL 连接
      this.connection = await mysqlModule.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        charset: this.config.charset,
        timezone: this.config.timezone,
        // 连接配置
        connectTimeout: 60000,
        multipleStatements: true, // 允许多语句执行
        dateStrings: false, // 返回日期对象而不是字符串
      });

      this.connected = true;

      console.log(`✅ MySQL 数据库连接已建立: ${this.config.host}:${this.config.port}/${this.config.database}`);
    } catch (error) {
      console.error('❌ MySQL 连接失败:', error);
      throw error;
    }
  }

  async get(sql: string, params?: any): Promise<any> {
    if (!this.connected) await this.connect();
    if (!this.connection) throw new Error('MySQL 连接未建立');

    try {
      // 转换 SQLite 语法为 MySQL 语法
      const mysqlQuery = this.convertSQLiteToMySQL(sql);

      // 更安全的参数处理
      let processedParams: any[] = [];
      if (params !== undefined && params !== null) {
        if (Array.isArray(params)) {
          processedParams = this.preprocessParams(params);
        } else if (typeof params === 'object') {
          processedParams = this.preprocessParams(Object.values(params));
        } else {
          processedParams = this.preprocessParams([params]);
        }
      }

      // 验证参数数量与占位符匹配
      const placeholderCount = (mysqlQuery.match(/\?/g) || []).length;
      if (processedParams.length !== placeholderCount) {
        console.error('参数数量不匹配:', {
          sql: mysqlQuery,
          expectedParams: placeholderCount,
          actualParams: processedParams.length,
          params: processedParams
        });
        throw new Error(`参数数量不匹配: 期望 ${placeholderCount} 个，实际 ${processedParams.length} 个`);
      }

      // 如果没有参数，使用空数组而不是 undefined
      const finalParams = processedParams.length > 0 ? processedParams : [];

      // 尝试使用 query 方法而不是 execute，某些 MySQL2 版本在 execute 时有问题
      let rows;
      if (finalParams.length === 0) {
        [rows] = await this.connection.query(mysqlQuery);
      } else {
        // 对于有参数的查询，先尝试 execute，失败后使用 query
        try {
          [rows] = await this.connection.execute(mysqlQuery, finalParams);
        } catch (error) {
          console.log('execute 失败，尝试使用 query 方法');
          [rows] = await this.connection.query(mysqlQuery, finalParams);
        }
      }

      // MySQL 返回数组，取第一个结果
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0];
      }
      return null;
    } catch (error) {
      console.error('MySQL 查询失败:', {
        sql,
        params,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  async all(sql: string, params?: any): Promise<any[]> {
    if (!this.connected) await this.connect();
    if (!this.connection) throw new Error('MySQL 连接未建立');

    try {
      const mysqlQuery = this.convertSQLiteToMySQL(sql);

      // 更安全的参数处理
      let processedParams: any[] = [];
      if (params !== undefined && params !== null) {
        if (Array.isArray(params)) {
          processedParams = this.preprocessParams(params);
        } else if (typeof params === 'object') {
          processedParams = this.preprocessParams(Object.values(params));
        } else {
          processedParams = this.preprocessParams([params]);
        }
      }

      // 验证参数数量与占位符匹配
      const placeholderCount = (mysqlQuery.match(/\?/g) || []).length;
      if (processedParams.length !== placeholderCount) {
        console.error('参数数量不匹配:', {
          sql: mysqlQuery,
          expectedParams: placeholderCount,
          actualParams: processedParams.length,
          params: processedParams
        });
        throw new Error(`参数数量不匹配: 期望 ${placeholderCount} 个，实际 ${processedParams.length} 个`);
      }

      // 如果没有参数，使用空数组而不是 undefined
      const finalParams = processedParams.length > 0 ? processedParams : [];

      console.log('最终执行参数:', {
        query: mysqlQuery,
        params: finalParams,
        paramTypes: finalParams.map(p => typeof p)
      });

      // 尝试使用 query 方法而不是 execute，某些 MySQL2 版本在 execute 时有问题
      let rows;
      if (finalParams.length === 0) {
        [rows] = await this.connection.query(mysqlQuery);
      } else {
        // 对于有参数的查询，先尝试 execute，失败后使用 query
        try {
          [rows] = await this.connection.execute(mysqlQuery, finalParams);
        } catch (error) {
          console.log('execute 失败，尝试使用 query 方法');
          [rows] = await this.connection.query(mysqlQuery, finalParams);
        }
      }
      return Array.isArray(rows) ? rows as any[] : [];
    } catch (error) {
      console.error('MySQL 查询失败:', {
        sql,
        params,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  async run(sql: string, params?: any): Promise<{ lastID?: number; changes?: number }> {
    if (!this.connected) await this.connect();
    if (!this.connection) throw new Error('MySQL 连接未建立');

    try {
      const mysqlQuery = this.convertSQLiteToMySQL(sql);

      // 更安全的参数处理
      let processedParams: any[] = [];
      if (params !== undefined && params !== null) {
        if (Array.isArray(params)) {
          processedParams = this.preprocessParams(params);
        } else if (typeof params === 'object') {
          processedParams = this.preprocessParams(Object.values(params));
        } else {
          processedParams = this.preprocessParams([params]);
        }
      }

      // 验证参数数量与占位符匹配
      const placeholderCount = (mysqlQuery.match(/\?/g) || []).length;
      if (processedParams.length !== placeholderCount) {
        console.error('参数数量不匹配:', {
          sql: mysqlQuery,
          expectedParams: placeholderCount,
          actualParams: processedParams.length,
          params: processedParams
        });
        throw new Error(`参数数量不匹配: 期望 ${placeholderCount} 个，实际 ${processedParams.length} 个`);
      }

      // 如果没有参数，使用空数组而不是 undefined
      const finalParams = processedParams.length > 0 ? processedParams : [];

      // 尝试使用 query 方法而不是 execute，某些 MySQL2 版本在 execute 时有问题
      let result;
      if (finalParams.length === 0) {
        [result] = await this.connection.query(mysqlQuery);
      } else {
        // 对于有参数的查询，先尝试 execute，失败后使用 query
        try {
          [result] = await this.connection.execute(mysqlQuery, finalParams);
        } catch (error) {
          console.log('execute 失败，尝试使用 query 方法');
          [result] = await this.connection.query(mysqlQuery, finalParams);
        }
      }

      // MySQL 执行结果
      const mysqlResult = result as mysql.ResultSetHeader;

      return {
        lastID: mysqlResult.insertId || undefined,
        changes: mysqlResult.affectedRows || 0
      };
    } catch (error) {
      console.error('MySQL 执行失败:', {
        sql,
        params,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  async exec(sql: string): Promise<void> {
    if (!this.connected) await this.connect();
    if (!this.connection) throw new Error('MySQL 连接未建立');

    try {
      const mysqlQuery = this.convertSQLiteToMySQL(sql);

      // 将 SQL 分解为单独的语句来执行，避免多语句执行问题
      const statements = this.splitSQLStatements(mysqlQuery);

      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement && !trimmedStatement.startsWith('--')) {
          // 检查是否是不支持预编译语句的命令
          if (this.isNonPreparedStatement(trimmedStatement)) {
            await this.connection.query(trimmedStatement);
          } else {
            await this.connection.execute(trimmedStatement);
          }
        }
      }
    } catch (error) {
      console.error('MySQL 执行失败:', error);
      throw error;
    }
  }

  // 检查是否是不支持预编译语句的 MySQL 命令
  private isNonPreparedStatement(sql: string): boolean {
    const upperSQL = sql.toUpperCase().trim();

    // 这些语句不支持预编译语句协议
    const nonPreparedStatements = [
      'SET',
      'START TRANSACTION',
      'BEGIN',
      'COMMIT',
      'ROLLBACK',
      'USE',
      'SHOW',
      'DESCRIBE',
      'DESC',
      'EXPLAIN'
    ];

    return nonPreparedStatements.some(stmt => upperSQL.startsWith(stmt));
  }

  // 将 SQL 脚本分解为单独的语句
  private splitSQLStatements(sql: string): string[] {
    // 移除注释行
    const cleanedSQL = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');

    // 按分号分割，但要考虑字符串中的分号
    const statements: string[] = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < cleanedSQL.length; i++) {
      const char = cleanedSQL[i];
      const nextChar = cleanedSQL[i + 1];

      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
        currentStatement += char;
      } else if (inString && char === stringChar && cleanedSQL[i - 1] !== '\\') {
        inString = false;
        stringChar = '';
        currentStatement += char;
      } else if (!inString && char === ';') {
        currentStatement += char;
        const trimmed = currentStatement.trim();
        if (trimmed) {
          statements.push(trimmed);
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }

    // 添加最后一个语句（如果没有分号结尾）
    const finalStatement = currentStatement.trim();
    if (finalStatement) {
      statements.push(finalStatement);
    }

    return statements;
  }

  async close(): Promise<void> {
    if (this.connection && this.connected) {
      await this.connection.end();
      this.connection = null;
      this.connected = false;
      console.log('🔒 MySQL 数据库连接已关闭');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async needsInitialization(): Promise<boolean> {
    try {
      if (!this.connected) await this.connect();

      // 检查是否存在关键表
      const result = await this.get(`
        SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [this.config.database]);

      return !result; // 如果没有 users 表，则需要初始化
    } catch (error) {
      console.error('检查 MySQL 数据库状态失败:', error);
      return true; // 出错时假设需要初始化
    }
  }

  async initializeIfNeeded(): Promise<void> {
    try {
      const needsInit = await this.needsInitialization();

      if (needsInit) {
        console.log('🔍 检测到 MySQL 数据库为空，开始自动初始化...');
        await this.initialize();
        console.log('🎉 MySQL 数据库自动初始化完成！');
      } else {
        // 只在非构建环境显示已初始化信息
        if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PHASE) {
          console.log('✅ MySQL 数据库已初始化，跳过自动初始化');
        }
      }
    } catch (error) {
      console.error('❌ MySQL 数据库自动初始化失败:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema-mysql.sql');
    const SEED_PATH = path.join(process.cwd(), 'database', 'seed-mysql.sql');

    try {
      console.log('🔧 正在初始化 MySQL 数据库架构...');

      // 执行 MySQL 专用 schema
      if (fs.existsSync(SCHEMA_PATH)) {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        await this.exec(schema);
        console.log('✅ MySQL 数据库架构已创建');
      } else {
        // 如果没有专门的 MySQL schema，转换 SQLite schema
        const sqliteSchemaPath = path.join(process.cwd(), 'database', 'schema.sql');
        if (fs.existsSync(sqliteSchemaPath)) {
          const sqliteSchema = fs.readFileSync(sqliteSchemaPath, 'utf8');
          const mysqlSchema = this.convertSchemaToMySQL(sqliteSchema);
          await this.exec(mysqlSchema);
          console.log('✅ 从 SQLite 架构转换的 MySQL 数据库架构已创建');
        } else {
          throw new Error('未找到数据库架构文件');
        }
      }

      // 执行 seed data
      if (fs.existsSync(SEED_PATH)) {
        const seedData = fs.readFileSync(SEED_PATH, 'utf8');
        await this.exec(seedData);
        console.log('✅ MySQL 初始化数据已导入');
      } else {
        // 转换 SQLite seed 数据
        const sqliteSeedPath = path.join(process.cwd(), 'database', 'seed.sql');
        if (fs.existsSync(sqliteSeedPath)) {
          const sqliteSeed = fs.readFileSync(sqliteSeedPath, 'utf8');
          const mysqlSeed = this.convertSQLiteToMySQL(sqliteSeed);
          await this.exec(mysqlSeed);
          console.log('✅ 从 SQLite 转换的初始化数据已导入');
        }
      }
    } catch (error) {
      console.error('❌ MySQL 数据库初始化失败:', error);
      throw error;
    }
  }

  async backup(backupPath?: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = backupPath || `mysql_backup_${this.config.database}_${timestamp}.sql`;

    try {
      // 获取所有表结构和数据
      const tables = await this.all(`
        SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
      `, [this.config.database]);

      let backupContent = `-- MySQL 数据库备份\n-- 数据库: ${this.config.database}\n-- 时间: ${new Date().toISOString()}\n\n`;
      backupContent += `USE \`${this.config.database}\`;\n\n`;

      for (const table of tables) {
        const tableName = table.TABLE_NAME;

        // 获取表结构
        const createTable = await this.get(`SHOW CREATE TABLE \`${tableName}\``);
        backupContent += `-- 表结构: ${tableName}\n`;
        backupContent += `${createTable['Create Table']};\n\n`;

        // 获取表数据
        const data = await this.all(`SELECT * FROM \`${tableName}\``);
        if (data.length > 0) {
          backupContent += `-- 表数据: ${tableName}\n`;
          const columns = Object.keys(data[0]);
          backupContent += `INSERT INTO \`${tableName}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES\n`;

          const values = data.map(row => {
            const rowValues = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
              if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
              return value;
            });
            return `(${rowValues.join(', ')})`;
          });

          backupContent += values.join(',\n') + ';\n\n';
        }
      }

      fs.writeFileSync(backup, backupContent);
      console.log('💾 MySQL 数据库已备份到:', backup);
    } catch (error) {
      console.error('❌ MySQL 备份失败:', error);
      throw error;
    }
  }

  async getStats(): Promise<DatabaseStats> {
    try {
      // 获取数据库大小
      const sizeResult = await this.get(`
        SELECT
          SUM(data_length + index_length) as size_bytes,
          COUNT(*) as table_count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
      `, [this.config.database]);

      // 获取索引数量
      const indexResult = await this.get(`
        SELECT COUNT(*) as index_count
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
      `, [this.config.database]);

      return {
        size: parseInt(sizeResult.size_bytes) || 0,
        tables: parseInt(sizeResult.table_count) || 0,
        indexes: parseInt(indexResult.index_count) || 0
      };
    } catch (error) {
      console.error('获取 MySQL 统计信息失败:', error);
      return {
        size: 0,
        tables: 0,
        indexes: 0
      };
    }
  }

  /**
   * 预处理参数，将JavaScript类型转换为MySQL兼容格式
   */
  private preprocessParams(params: any[]): any[] {
    if (!Array.isArray(params)) {
      return [];
    }

    return params.map((param, index) => {
      // 处理 null 和 undefined
      if (param === null || param === undefined) {
        return null;
      }

      // 处理日期时间：将ISO 8601格式转换为MySQL DATETIME格式
      if (param instanceof Date) {
        return param.toISOString().slice(0, 19).replace('T', ' ');
      }

      // 处理ISO字符串格式的日期
      if (typeof param === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(param)) {
        const date = new Date(param);
        if (!isNaN(date.getTime())) {
          return date.toISOString().slice(0, 19).replace('T', ' ');
        }
      }

      // 处理布尔值：MySQL使用1/0
      if (typeof param === 'boolean') {
        return param ? 1 : 0;
      }

      // 处理数字：确保是有效整数，特别是对 LIMIT/OFFSET
      if (typeof param === 'number') {
        if (isNaN(param) || !isFinite(param)) {
          return null;
        }
        // 对于整数参数，确保它们是整数类型
        return Number.isInteger(param) ? Math.floor(param) : param;
      }

      // 处理字符串：如果是数字字符串，转换为数字
      if (typeof param === 'string') {
        // 检查是否是纯数字字符串
        const numValue = Number(param);
        if (!isNaN(numValue) && isFinite(numValue) && /^\d+$/.test(param.trim())) {
          return Math.floor(numValue);
        }
        return param;
      }

      // 处理对象：转换为JSON字符串（如果不是Date）
      if (typeof param === 'object' && param !== null) {
        try {
          return JSON.stringify(param);
        } catch (error) {
          console.warn(`参数序列化失败 (index ${index}):`, error);
          return null;
        }
      }

      // 其他类型直接返回
      return param;
    });
  }

  // SQLite 语法转换为 MySQL 语法
  private convertSQLiteToMySQL(sql: string): string {
    let mysqlSQL = sql
      .replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT')
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT PRIMARY KEY AUTO_INCREMENT')
      .replace(/INTEGER PRIMARY KEY/gi, 'INT PRIMARY KEY')
      .replace(/INTEGER/gi, 'INT')
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
      .replace(/TEXT/gi, 'TEXT')
      .replace(/REAL/gi, 'DECIMAL(10,2)')
      .replace(/BLOB/gi, 'LONGBLOB')
      // 移除 SQLite 特有的语句
      .replace(/PRAGMA.*?;/gi, '')
      .replace(/BEGIN TRANSACTION/gi, 'START TRANSACTION')
      .replace(/END TRANSACTION/gi, 'COMMIT')
      // 正确处理布尔值：SQLite 使用 0/1，MySQL 也使用 0/1
      .replace(/\bFALSE\b/gi, '0')
      .replace(/\bTRUE\b/gi, '1')
      // 转换 SQLite 时间函数到 MySQL
      .replace(/datetime\s*\(\s*['"]now['"]\s*\)/gi, 'NOW()')
      .replace(/date\s*\(\s*['"]now['"]\s*\)/gi, 'CURDATE()')
      .replace(/time\s*\(\s*['"]now['"]\s*\)/gi, 'CURTIME()');

    // 移除 TEXT 类型字段的默认值（MySQL 不支持）
    mysqlSQL = mysqlSQL.replace(/\bTEXT\s+DEFAULT\s+'[^']*'/gi, 'TEXT');
    mysqlSQL = mysqlSQL.replace(/\bTEXT\s+DEFAULT\s+"[^"]*"/gi, 'TEXT');
    mysqlSQL = mysqlSQL.replace(/\bTEXT\s+DEFAULT\s+[^\s,)]+/gi, 'TEXT');

    // 处理 MySQL 保留关键字
    mysqlSQL = this.escapeReservedWords(mysqlSQL);

    return mysqlSQL;
  }

  // SQLite schema 转换为 MySQL schema
  private convertSchemaToMySQL(schema: string): string {
    let mysqlSchema = schema
      .replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT')
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT PRIMARY KEY AUTO_INCREMENT')
      .replace(/INTEGER PRIMARY KEY/gi, 'INT PRIMARY KEY')
      .replace(/INTEGER/gi, 'INT')
      .replace(/DATETIME/gi, 'DATETIME')
      .replace(/TEXT/gi, 'TEXT')
      .replace(/REAL/gi, 'DECIMAL(10,2)')
      .replace(/BLOB/gi, 'LONGBLOB')
      .replace(/PRAGMA.*?;/gi, '')
      .replace(/BEGIN TRANSACTION/gi, 'START TRANSACTION')
      .replace(/END TRANSACTION/gi, 'COMMIT')
      // 正确处理布尔值：SQLite 使用 0/1，MySQL 也使用 0/1
      .replace(/\bFALSE\b/gi, '0')
      .replace(/\bTRUE\b/gi, '1');

    // 移除 TEXT 类型字段的默认值（MySQL 不支持）
    mysqlSchema = mysqlSchema.replace(/\bTEXT\s+DEFAULT\s+'[^']*'/gi, 'TEXT');
    mysqlSchema = mysqlSchema.replace(/\bTEXT\s+DEFAULT\s+"[^"]*"/gi, 'TEXT');
    mysqlSchema = mysqlSchema.replace(/\bTEXT\s+DEFAULT\s+[^\s,)]+/gi, 'TEXT');

    // 添加 MySQL 特有的设置
    mysqlSchema = `SET FOREIGN_KEY_CHECKS = 0;\n${mysqlSchema}\nSET FOREIGN_KEY_CHECKS = 1;\n`;

    return mysqlSchema;
  }

  /**
   * 处理 MySQL 保留关键字，添加反引号
   */
  private escapeReservedWords(sql: string): string {
    // MySQL 常见保留关键字列表
    const reservedWords = [
      'key', 'order', 'group', 'index', 'table', 'database', 'schema',
      'column', 'constraint', 'check', 'references', 'user', 'password',
      'timestamp', 'date', 'time', 'year', 'month', 'day', 'hour', 'minute', 'second',
      'count', 'sum', 'max', 'min', 'avg', 'distinct', 'unique', 'primary',
      'foreign', 'default', 'null', 'not', 'auto_increment', 'comment'
    ];

    let escapedSQL = sql;

    // 为每个保留字添加反引号转义
    reservedWords.forEach(word => {
      // 使用更简单直接的方法：匹配所有 word 后面跟着操作符的情况
      // 匹配模式: word = | word < | word > | word IS | word IN | word LIKE 等
      const operatorRegex = new RegExp(`\b${word}\b(?=\s*[=<>!]|\s+(?:IS|IN|LIKE|BETWEEN|NOT))`, 'gi');
      escapedSQL = escapedSQL.replace(operatorRegex, `\`${word}\``);
      
      // 匹配 SELECT 子句中的列名: SELECT key, ...
      const selectRegex = new RegExp(`(SELECT\s+(?:[^,\s]+,\s*)*)\b${word}\b(?=\s*[,)]|\s+FROM)`, 'gi');
      escapedSQL = escapedSQL.replace(selectRegex, (match) => {
        return match.replace(new RegExp(`\b${word}\b`, 'gi'), `\`${word}\``);
      });
      
      // 匹配 ORDER BY 子句中的列名: ORDER BY key
      const orderByRegex = new RegExp(`(ORDER\s+BY\s+(?:[^,\s]+,\s*)*)\b${word}\b`, 'gi');
      escapedSQL = escapedSQL.replace(orderByRegex, (match) => {
        return match.replace(new RegExp(`\b${word}\b`, 'gi'), `\`${word}\``);
      });
      
      // 匹配 INSERT/UPDATE 中的列名: (key, other) 或 key = ?
      const columnRegex = new RegExp(`\(([^)]*\b${word}\b[^)]*)\)`, 'gi');
      escapedSQL = escapedSQL.replace(columnRegex, (match, columns) => {
        const escapedColumns = columns.replace(new RegExp(`\b${word}\b`, 'gi'), `\`${word}\``);
        return match.replace(columns, escapedColumns);
      });
    });

    return escapedSQL;
  }
}

// 检查 MySQL 是否可用
export function isMySQLAvailable(): boolean {
  return mysqlModule !== null && !!(
    process.env.MYSQL_HOST || process.env.DATABASE_URL?.includes('mysql')
  );
}

// 从环境变量或连接字符串解析 MySQL 配置
export function parseMySQLConfig(): MySQLConfig | null {
  // 支持 DATABASE_URL 格式: mysql://user:password@host:port/database
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // 移除前导 '/'
      };
    } catch (error) {
      console.error('解析 MySQL DATABASE_URL 失败:', error);
    }
  }

  // 独立环境变量
  if (process.env.MYSQL_HOST && process.env.MYSQL_DATABASE) {
    return {
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE,
    };
  }

  return null;
}