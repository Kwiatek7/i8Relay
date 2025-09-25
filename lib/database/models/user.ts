import bcrypt from 'bcryptjs';
import { BaseModel } from '../base-model';
import type { User } from '../../types';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  user_role?: 'user' | 'admin' | 'super_admin';
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  phone?: string;
  company?: string;
  avatar?: string;
  balance?: number;
  current_plan_id?: string;
  plan_expires_at?: string;
  user_status?: 'active' | 'inactive' | 'banned' | 'pending';
}

export interface UserFilter {
  status?: string;
  role?: string;
  plan_id?: string;
  email?: string;
  search?: string; // 搜索用户名或邮箱
}

export class UserModel extends BaseModel {
  protected tableName = 'users';

  // 创建用户
  async create(userData: CreateUserData): Promise<User> {
    this.validateRequired(userData, ['username', 'email', 'password']);

    // 检查邮箱是否已存在
    if (await this.exists('email', userData.email)) {
      throw new Error('该邮箱已被注册');
    }

    // 生成密码hash和salt
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // 生成API密钥
    const apiKey = `sk-${this.generateId()}`;

    const user = {
      id: this.generateId(),
      username: userData.username,
      email: userData.email,
      password_hash: passwordHash,
      salt,
      user_role: userData.user_role || 'user',
      user_status: 'active',
      phone: userData.phone || null,
      company: userData.company || null,
      api_key: apiKey,
      current_plan_id: null, // 用户创建时无套餐
      balance: 0.0000,
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0.0000,
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp()
    };

    const { sql, params } = this.buildInsertQuery(this.tableName, user);
    await this.execute(sql, params);

    // 返回用户信息（不包含敏感信息）
    return this.formatUser(user);
  }

  // 根据ID查询用户
  async findUserById(id: string): Promise<User | null> {
    const user = await this.findOne<any>(`
      SELECT u.*, p.display_name as plan_name
      FROM users u
      LEFT JOIN plans p ON u.current_plan_id = p.id
      WHERE u.id = ?
    `, [id]);

    return user ? this.formatUser(user) : null;
  }

  // 根据邮箱查询用户
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.findOne<any>(`
      SELECT u.*, p.display_name as plan_name
      FROM users u
      LEFT JOIN plans p ON u.current_plan_id = p.id
      WHERE u.email = ?
    `, [email]);

    return user ? this.formatUser(user) : null;
  }

  // 根据API密钥查询用户
  async findByApiKey(apiKey: string): Promise<User | null> {
    const user = await this.findOne<any>(`
      SELECT u.*, p.display_name as plan_name
      FROM users u
      LEFT JOIN plans p ON u.current_plan_id = p.id
      WHERE u.api_key = ?
    `, [apiKey]);

    return user ? this.formatUser(user) : null;
  }

  // 验证用户密码
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findOne<any>(`
      SELECT u.*, p.display_name as plan_name
      FROM users u
      LEFT JOIN plans p ON u.current_plan_id = p.id
      WHERE u.email = ? AND u.user_status = 'active'
    `, [email]);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? this.formatUser(user) : null;
  }

  // 更新用户信息
  async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    const cleanData = this.cleanData({
      ...updateData,
      updated_at: this.getCurrentTimestamp()
    });

    if (Object.keys(cleanData).length === 0) {
      throw new Error('没有要更新的数据');
    }

    // 如果更新邮箱，检查是否已被使用
    if (updateData.email) {
      const existingUser = await this.findOne<{ id: string }>(`
        SELECT id FROM users WHERE email = ? AND id != ?
      `, [updateData.email, id]);

      if (existingUser) {
        throw new Error('该邮箱已被其他用户使用');
      }
    }

    const { setClause, params } = this.buildSetClause(cleanData);
    const result = await this.execute(`
      UPDATE ${this.tableName} SET ${setClause} WHERE id = ?
    `, [...params, id]);

    if ((result.changes ?? 0) === 0) {
      return null;
    }

    return await this.findById(id);
  }

  // 更改密码
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findOne<{ password_hash: string }>(`
      SELECT password_hash FROM ${this.tableName} WHERE id = ?
    `, [id]);

    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证当前密码
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new Error('当前密码错误');
    }

    // 生成新密码hash
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    const result = await this.execute(`
      UPDATE ${this.tableName}
      SET password_hash = ?, salt = ?, updated_at = ?
      WHERE id = ?
    `, [newPasswordHash, salt, this.getCurrentTimestamp(), id]);

    return (result.changes ?? 0) > 0;
  }

  // 更新登录时间
  async updateLastLogin(id: string): Promise<void> {
    await this.execute(`
      UPDATE ${this.tableName}
      SET last_login_at = ?
      WHERE id = ?
    `, [this.getCurrentTimestamp(), id]);
  }

  // 分页查询用户列表
  async findUsers(filter: UserFilter = {}, page: number = 1, pageSize: number = 20): Promise<{
    data: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    // 构建查询条件
    if (filter.status) {
      whereConditions.push('u.user_status = ?');
      params.push(filter.status);
    }

    if (filter.role) {
      whereConditions.push('u.user_role = ?');
      params.push(filter.role);
    }

    if (filter.plan_id) {
      whereConditions.push('u.current_plan_id = ?');
      params.push(filter.plan_id);
    }

    if (filter.email) {
      whereConditions.push('u.email = ?');
      params.push(filter.email);
    }

    if (filter.search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const baseQuery = `
      SELECT u.*, p.display_name as plan_name
      FROM users u
      LEFT JOIN plans p ON u.current_plan_id = p.id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM users u
      ${whereClause}
    `;

    const result = await this.paginate<any>(baseQuery, countQuery, params, page, pageSize);

    return {
      ...result,
      data: result.data.map(user => this.formatUser(user))
    };
  }

  // 删除用户
  async delete(id: string): Promise<boolean> {
    // 检查是否有关联的订阅或账单记录
    const hasSubscriptions = await this.findOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM user_subscriptions WHERE user_id = ?
    `, [id]);

    const hasBillingRecords = await this.findOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM billing_records WHERE user_id = ?
    `, [id]);

    if ((hasSubscriptions?.count || 0) > 0 || (hasBillingRecords?.count || 0) > 0) {
      // 有关联记录时，只更新状态为已删除，而不是物理删除
      const result = await this.execute(`
        UPDATE ${this.tableName}
        SET user_status = 'inactive', updated_at = ?
        WHERE id = ?
      `, [this.getCurrentTimestamp(), id]);

      return (result.changes ?? 0) > 0;
    }

    // 没有关联记录时，可以物理删除
    return await this.deleteById(id);
  }

  // 获取用户统计信息
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    newToday: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats = await this.findOne<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN user_status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN user_status != 'active' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_this_month,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_today
      FROM ${this.tableName}
    `, [startOfMonth.toISOString(), startOfDay.toISOString()]);

    return {
      total: stats?.total || 0,
      active: stats?.active || 0,
      inactive: stats?.inactive || 0,
      newThisMonth: stats?.new_this_month || 0,
      newToday: stats?.new_today || 0
    };
  }

  // 格式化用户信息（移除敏感信息）
  private formatUser(user: any): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      plan: user.plan_name || user.current_plan_id || 'claude-code-free',
      balance: parseFloat(user.balance) || 0,
      apiKey: user.api_key,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // 可以添加其他需要的字段
      user_role: user.user_role,
      user_status: user.user_status,
      phone: user.phone,
      company: user.company,
      total_requests: user.total_requests || 0,
      total_tokens: user.total_tokens || 0,
      total_cost: parseFloat(user.total_cost) || 0,
      last_login_at: user.last_login_at,
      plan_expires_at: user.plan_expires_at
    };
  }
}

// 导出单例实例
export const userModel = new UserModel();