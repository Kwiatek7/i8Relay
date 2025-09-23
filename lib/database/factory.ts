import { DatabaseAdapter, DatabaseType, DatabaseConfig } from './adapters/base';
import { SQLiteAdapter, isSQLiteAvailable } from './adapters/sqlite';
import { VercelPostgresAdapter, isVercelPostgresAvailable } from './adapters/vercel-postgres';

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

    // 1. 明确指定使用 Postgres
    if (dbType === 'postgres' || dbType === 'postgresql') {
      if (isVercelPostgresAvailable()) {
        console.log('🎯 环境变量指定使用 Postgres 数据库');
        return new VercelPostgresAdapter();
      } else {
        throw new Error('环境变量指定使用 Postgres，但未找到相关配置');
      }
    }

    // 2. 明确指定使用 SQLite
    if (dbType === 'sqlite') {
      if (isSQLiteAvailable()) {
        console.log('🎯 环境变量指定使用 SQLite 数据库');
        return new SQLiteAdapter(process.env.DATABASE_PATH);
      } else {
        throw new Error('环境变量指定使用 SQLite，但在当前环境中不可用');
      }
    }

    // 3. 自动检测：优先级 Vercel Postgres > SQLite
    if (isVercelPostgresAvailable()) {
      console.log('🚀 检测到 Vercel Postgres 环境，使用 Postgres 数据库');
      return new VercelPostgresAdapter();
    }

    if (isSQLiteAvailable()) {
      console.log('💾 使用 SQLite 数据库（本地开发环境）');
      return new SQLiteAdapter(process.env.DATABASE_PATH);
    }

    // 4. 都不可用时的错误
    throw new Error(`
      未找到可用的数据库适配器！

      请检查以下配置：
      1. 本地开发：确保安装了 sqlite3 依赖
      2. Vercel 部署：确保配置了 POSTGRES_URL 等环境变量
      3. 手动指定：设置 DATABASE_TYPE 环境变量为 'sqlite' 或 'postgres'

      当前环境：
      - SQLite 可用: ${isSQLiteAvailable()}
      - Vercel Postgres 可用: ${isVercelPostgresAvailable()}
      - 环境变量 DATABASE_TYPE: ${process.env.DATABASE_TYPE || '未设置'}
    `);
  }

  /**
   * 获取当前环境信息
   */
  static getEnvironmentInfo(): {
    sqliteAvailable: boolean;
    postgresAvailable: boolean;
    recommendedAdapter: string;
    currentConfig: any;
  } {
    const sqliteAvailable = isSQLiteAvailable();
    const postgresAvailable = isVercelPostgresAvailable();

    let recommendedAdapter = 'none';
    if (postgresAvailable) {
      recommendedAdapter = 'postgres';
    } else if (sqliteAvailable) {
      recommendedAdapter = 'sqlite';
    }

    return {
      sqliteAvailable,
      postgresAvailable,
      recommendedAdapter,
      currentConfig: {
        DATABASE_TYPE: process.env.DATABASE_TYPE,
        DATABASE_PATH: process.env.DATABASE_PATH,
        POSTGRES_URL: process.env.POSTGRES_URL ? '***configured***' : undefined,
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