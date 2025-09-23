import { getDb } from './connection';
import type { AsyncDatabase } from './connection';

// 基础模型类，提供通用的CRUD操作
export abstract class BaseModel {
  protected abstract tableName: string;

  // 生成ID
  protected generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // 查询单条记录
  protected async findOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const db = await getDb();
      const result = await db.get(sql, params) as T | undefined;
      return result || null;
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }

  // 查询多条记录
  protected async findMany<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const db = await getDb();
      return await db.all(sql, params) as T[];
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }

  // 执行INSERT/UPDATE/DELETE
  protected async execute(sql: string, params: any[] = []): Promise<{
    changes: number;
    lastID?: number;
  }> {
    try {
      const db = await getDb();
      const result = await db.run(sql, params);
      return {
        changes: result.changes ?? 0,
        lastID: result.lastID
      };
    } catch (error) {
      console.error('数据库执行错误:', error);
      throw error;
    }
  }

  // 事务执行（手动实现，因为sqlite3不支持同步事务）
  protected async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const db = await getDb();
    try {
      await db.run('BEGIN TRANSACTION');
      const result = await fn();
      await db.run('COMMIT');
      return result;
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  // 分页查询
  protected async paginate<T>(
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      // 获取总数
      const totalResult = await this.findOne<{ count: number }>(countQuery, params);
      const total = totalResult?.count || 0;

      // 计算分页
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;

      // 查询数据
      const dataQuery = `${baseQuery} LIMIT ${pageSize} OFFSET ${offset}`;
      const data = await this.findMany<T>(dataQuery, params);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('分页查询错误:', error);
      throw error;
    }
  }

  // 通用的根据ID查询
  protected async findById<T>(id: string): Promise<T | null> {
    return await this.findOne<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  // 通用的根据ID删除
  protected async deleteById(id: string): Promise<boolean> {
    const result = await this.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  // 通用的检查记录是否存在
  protected async exists(field: string, value: any): Promise<boolean> {
    const result = await this.findOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${field} = ?`,
      [value]
    );
    return (result?.count || 0) > 0;
  }

  // 构建WHERE条件
  protected buildWhereClause(conditions: Record<string, any>): {
    whereClause: string;
    params: any[];
  } {
    const keys = Object.keys(conditions).filter(key => conditions[key] !== undefined);

    if (keys.length === 0) {
      return { whereClause: '', params: [] };
    }

    const whereClause = 'WHERE ' + keys.map(key => `${key} = ?`).join(' AND ');
    const params = keys.map(key => conditions[key]);

    return { whereClause, params };
  }

  // 构建UPDATE SET子句
  protected buildSetClause(data: Record<string, any>): {
    setClause: string;
    params: any[];
  } {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);

    if (keys.length === 0) {
      throw new Error('没有要更新的数据');
    }

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const params = keys.map(key => data[key]);

    return { setClause, params };
  }

  // 构建INSERT语句
  protected buildInsertQuery(tableName: string, data: Record<string, any>): {
    sql: string;
    params: any[];
  } {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);

    if (keys.length === 0) {
      throw new Error('没有要插入的数据');
    }

    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const params = keys.map(key => data[key]);

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

    return { sql, params };
  }

  // 获取当前时间戳
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // 日期格式化为YYYY-MM-DD
  protected formatDate(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  // 验证必填字段
  protected validateRequired(data: Record<string, any>, fields: string[]): void {
    const missingFields = fields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
    }
  }

  // 清理数据（移除undefined值）
  protected cleanData(data: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        cleaned[key] = data[key];
      }
    });
    return cleaned;
  }
}