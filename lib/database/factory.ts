import { DatabaseAdapter, DatabaseType, DatabaseConfig } from './adapters/base';
import { SQLiteAdapter, isSQLiteAvailable } from './adapters/sqlite';
import { VercelPostgresAdapter, isVercelPostgresAvailable } from './adapters/vercel-postgres';
import { MySQLAdapter, isMySQLAvailable, parseMySQLConfig } from './adapters/mysql';

/**
 * 数据库工厂类
 * 根据环境和配置自动选择合适的数据库适配器
 */
export class DatabaseFactory {
  /**
   * 检测并创建合适的数据库适配器
   */
  static createAdapter(config?: DatabaseConfig): DatabaseAdapter {
    // 如果明确指定了数据库类型
    if (config?.type) {
      return this.createAdapterByType(config.type, config);
    }

    // 自动检测最佳数据库适配器
    return this.createAdapterByEnvironment();
  }

  /**
   * 根据指定类型创建适配器
   */
  private static createAdapterByType(type: DatabaseType, config: DatabaseConfig): DatabaseAdapter {
    switch (type) {
      case DatabaseType.SQLITE:
        if (!isSQLiteAvailable()) {
          throw new Error('SQLite 在当前环境中不可用');
        }
        return new SQLiteAdapter(config.path);

      case DatabaseType.POSTGRES:
        if (!isVercelPostgresAvailable()) {
          throw new Error('Postgres 配置在当前环境中不可用');
        }
        return new VercelPostgresAdapter();

      case DatabaseType.MYSQL:
        if (!isMySQLAvailable()) {
          throw new Error('MySQL 配置在当前环境中不可用');
        }
        const mysqlConfig = parseMySQLConfig() || {
          host: config.host || 'localhost',
          port: config.port || 3306,
          user: config.username || 'root',
          password: config.password || '',
          database: config.database || 'aiporxy'
        };
        return new MySQLAdapter(mysqlConfig);

      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }

  /**
   * 根据环境自动选择适配器
   */
  private static createAdapterByEnvironment(): DatabaseAdapter {
    // 检查环境变量中的数据库配置
    const dbType = process.env.DATABASE_TYPE?.toLowerCase();

    // 1. 明确指定使用 MySQL
    if (dbType === 'mysql') {
      if (isMySQLAvailable()) {
        console.log('🎯 环境变量指定使用 MySQL 数据库');
        const mysqlConfig = parseMySQLConfig();
        return new MySQLAdapter(mysqlConfig);
      } else {
        throw new Error('环境变量指定使用 MySQL，但未找到相关配置');
      }
    }

    // 2. 明确指定使用 Postgres
    if (dbType === 'postgres' || dbType === 'postgresql') {
      if (isVercelPostgresAvailable()) {
        console.log('🎯 环境变量指定使用 Postgres 数据库');
        return new VercelPostgresAdapter();
      } else {
        throw new Error('环境变量指定使用 Postgres，但未找到相关配置');
      }
    }

    // 3. 明确指定使用 SQLite
    if (dbType === 'sqlite') {
      if (isSQLiteAvailable()) {
        console.log('🎯 环境变量指定使用 SQLite 数据库');
        return new SQLiteAdapter(process.env.DATABASE_PATH);
      } else {
        throw new Error('环境变量指定使用 SQLite，但在当前环境中不可用');
      }
    }

    // 4. 自动检测：优先级 MySQL > Vercel Postgres > SQLite
    if (isMySQLAvailable()) {
      console.log('🐬 检测到 MySQL 环境，使用 MySQL 数据库');
      const mysqlConfig = parseMySQLConfig();
      return new MySQLAdapter(mysqlConfig);
    }

    if (isVercelPostgresAvailable()) {
      console.log('🚀 检测到 Vercel Postgres 环境，使用 Postgres 数据库');
      return new VercelPostgresAdapter();
    }

    if (isSQLiteAvailable()) {
      // 只在非构建环境显示日志
      if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PHASE) {
        console.log('💾 使用 SQLite 数据库（本地开发环境）');
      }
      return new SQLiteAdapter(process.env.DATABASE_PATH);
    }

    // 5. 都不可用时的错误
    throw new Error(`
      未找到可用的数据库适配器！

      请检查以下配置：
      1. MySQL: 设置 MYSQL_* 环境变量或 DATABASE_URL (mysql://)
      2. Postgres (Vercel): 配置 POSTGRES_URL 等环境变量
      3. SQLite (本地开发): 确保安装了 sqlite3 依赖
      4. 手动指定: 设置 DATABASE_TYPE 为 'mysql', 'postgres' 或 'sqlite'

      当前环境：
      - MySQL 可用: ${isMySQLAvailable()}
      - Vercel Postgres 可用: ${isVercelPostgresAvailable()}
      - SQLite 可用: ${isSQLiteAvailable()}
      - 环境变量 DATABASE_TYPE: ${process.env.DATABASE_TYPE || '未设置'}
    `);
  }

  /**
   * 获取当前环境信息
   */
  static getEnvironmentInfo(): {
    sqliteAvailable: boolean;
    postgresAvailable: boolean;
    mysqlAvailable: boolean;
    recommendedAdapter: string;
    currentConfig: any;
  } {
    const sqliteAvailable = isSQLiteAvailable();
    const postgresAvailable = isVercelPostgresAvailable();
    const mysqlAvailable = isMySQLAvailable();

    let recommendedAdapter = 'none';
    if (mysqlAvailable) {
      recommendedAdapter = 'mysql';
    } else if (postgresAvailable) {
      recommendedAdapter = 'postgres';
    } else if (sqliteAvailable) {
      recommendedAdapter = 'sqlite';
    }

    return {
      sqliteAvailable,
      postgresAvailable,
      mysqlAvailable,
      recommendedAdapter,
      currentConfig: {
        DATABASE_TYPE: process.env.DATABASE_TYPE,
        DATABASE_PATH: process.env.DATABASE_PATH,
        DATABASE_URL: process.env.DATABASE_URL ? '***configured***' : undefined,
        POSTGRES_URL: process.env.POSTGRES_URL ? '***configured***' : undefined,
        MYSQL_HOST: process.env.MYSQL_HOST,
        MYSQL_DATABASE: process.env.MYSQL_DATABASE,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    };
  }
}

// 便捷导出函数
export function createDatabaseAdapter(config?: DatabaseConfig): DatabaseAdapter {
  return DatabaseFactory.createAdapter(config);
}

export function getDatabaseEnvironmentInfo() {
  return DatabaseFactory.getEnvironmentInfo();
}