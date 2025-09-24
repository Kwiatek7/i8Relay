// 数据库适配器基础接口
export interface DatabaseAdapter {
  // 基础查询方法
  get(sql: string, params?: any): Promise<any>;
  all(sql: string, params?: any): Promise<any[]>;
  run(sql: string, params?: any): Promise<{ lastID?: number; changes?: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;

  // 连接管理
  connect(): Promise<void>;
  isConnected(): boolean;

  // 数据库特定功能
  initialize(): Promise<void>;
  needsInitialization(): Promise<boolean>;  // 检查是否需要初始化
  initializeIfNeeded(): Promise<void>;     // 智能初始化
  backup?(backupPath?: string): Promise<void>;
  getStats?(): Promise<DatabaseStats>;
}

export interface DatabaseStats {
  size: number;
  tables: number;
  indexes: number;
  pageCount?: number;
  pageSize?: number;
}

// 数据库类型枚举
export enum DatabaseType {
  SQLITE = 'sqlite',
  POSTGRES = 'postgres',
  MYSQL = 'mysql'
}

// 数据库配置接口
export interface DatabaseConfig {
  type: DatabaseType;
  path?: string;        // SQLite 文件路径
  url?: string;         // PostgreSQL/MySQL 连接字符串
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}