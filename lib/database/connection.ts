import { DatabaseAdapter } from './adapters/base';
import { createDatabaseAdapter, getDatabaseEnvironmentInfo } from './factory';

// 定义异步数据库接口（兼容原有代码）
export interface AsyncDatabase {
  get: (sql: string, params?: any) => Promise<any>;
  all: (sql: string, params?: any) => Promise<any[]>;
  run: (sql: string, params?: any) => Promise<{ lastID?: number; changes?: number }>;
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
}

// 创建单例数据库连接
class DatabaseConnection {
  private static adapter: DatabaseAdapter | null = null;
  private static instance: AsyncDatabase | null = null;
  private static isInitializing = false;
  private static initializationPromise: Promise<AsyncDatabase> | null = null;

  static async getInstance(): Promise<AsyncDatabase> {
    // 如果已经初始化完成，直接返回
    if (this.instance) {
      return this.instance;
    }

    // 如果正在初始化，等待初始化完成
    if (this.isInitializing && this.initializationPromise) {
      return this.initializationPromise;
    }

    // 开始初始化
    this.isInitializing = true;
    this.initializationPromise = this.performInitialization();

    try {
      const instance = await this.initializationPromise;
      this.isInitializing = false;
      return instance;
    } catch (error) {
      this.isInitializing = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  private static async performInitialization(): Promise<AsyncDatabase> {
    try {
      // 创建数据库适配器
      this.adapter = createDatabaseAdapter();

      // 连接数据库
      await this.adapter.connect();

      // 初始化数据库架构
      await this.adapter.initialize();

      // 创建兼容的接口包装器
      this.instance = {
        get: (sql: string, params?: any) => this.adapter!.get(sql, params),
        all: (sql: string, params?: any) => this.adapter!.all(sql, params),
        run: (sql: string, params?: any) => this.adapter!.run(sql, params),
        exec: (sql: string) => this.adapter!.exec(sql),
        close: () => this.adapter!.close()
      };

      // 只在非构建环境显示环境信息
      if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PHASE) {
        const envInfo = getDatabaseEnvironmentInfo();
        console.log('🎯 数据库环境信息:', {
          推荐适配器: envInfo.recommendedAdapter,
          SQLite可用: envInfo.sqliteAvailable,
          Postgres可用: envInfo.postgresAvailable
        });
      }

      return this.instance;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      // 重置状态，允许重试
      this.adapter = null;
      this.instance = null;
      throw error;
    }
  }

  static async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      this.instance = null;
      this.isInitializing = false;
      this.initializationPromise = null;
      console.log('🔒 数据库连接已关闭');
    }
  }

  // 备份数据库
  static async backup(backupPath?: string): Promise<void> {
    if (!this.adapter) {
      throw new Error('数据库未连接');
    }

    if (this.adapter.backup) {
      await this.adapter.backup(backupPath);
    } else {
      console.warn('当前数据库适配器不支持备份功能');
    }
  }

  // 获取数据库统计信息
  static async getStats(): Promise<{
    size: number;
    tables: number;
    indexes: number;
    pageCount?: number;
    pageSize?: number;
  }> {
    if (!this.adapter) {
      throw new Error('数据库未连接');
    }

    if (this.adapter.getStats) {
      return await this.adapter.getStats();
    } else {
      console.warn('当前数据库适配器不支持统计信息功能');
      return {
        size: 0,
        tables: 0,
        indexes: 0
      };
    }
  }

  // 获取当前适配器信息
  static getAdapterInfo() {
    return getDatabaseEnvironmentInfo();
  }
}

// 导出数据库连接类和获取实例的函数
export async function getDb(): Promise<AsyncDatabase> {
  return await DatabaseConnection.getInstance();
}

export { DatabaseConnection };
export default DatabaseConnection;