import { BaseModel } from '../base-model';
import bcrypt from 'bcryptjs';

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  refresh_token_hash: string | null;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
  last_used_at: string;
}

export interface CreateSessionData {
  user_id: string;
  access_token: string;
  refresh_token: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  expires_in: number; // 秒数
}

export class SessionModel extends BaseModel {
  protected tableName = 'user_sessions';

  // 创建会话
  async create(sessionData: CreateSessionData): Promise<UserSession> {
    this.validateRequired(sessionData, ['user_id', 'access_token', 'refresh_token', 'expires_in']);

    // 生成token哈希
    const tokenHash = await bcrypt.hash(sessionData.access_token, 10);
    const refreshTokenHash = await bcrypt.hash(sessionData.refresh_token, 10);

    // 计算过期时间
    const expiresAt = new Date(Date.now() + sessionData.expires_in * 1000);

    const session = {
      id: this.generateId(),
      user_id: sessionData.user_id,
      token_hash: tokenHash,
      refresh_token_hash: refreshTokenHash,
      device_info: sessionData.device_info || null,
      ip_address: sessionData.ip_address || null,
      user_agent: sessionData.user_agent || null,
      expires_at: expiresAt.toISOString(),
      created_at: this.getCurrentTimestamp(),
      last_used_at: this.getCurrentTimestamp()
    };

    const { sql, params } = this.buildInsertQuery(this.tableName, session);
    await this.execute(sql, params);

    return session;
  }

  // 根据token查找会话
  async findByToken(token: string): Promise<UserSession | null> {
    // 获取所有未过期的会话
    const sessions = await this.findMany<UserSession>(`
      SELECT * FROM ${this.tableName}
      WHERE expires_at > datetime('now')
      ORDER BY last_used_at DESC
    `);

    // 逐个验证token
    for (const session of sessions) {
      try {
        const isValid = await bcrypt.compare(token, session.token_hash);
        if (isValid) {
          // 更新最后使用时间
          await this.updateLastUsed(session.id);
          return session;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  // 根据刷新token查找会话
  async findByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    // 获取所有未过期的会话
    const sessions = await this.findMany<UserSession>(`
      SELECT * FROM ${this.tableName}
      WHERE expires_at > datetime('now') AND refresh_token_hash IS NOT NULL
      ORDER BY last_used_at DESC
    `);

    // 逐个验证刷新token
    for (const session of sessions) {
      try {
        if (session.refresh_token_hash) {
          const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);
          if (isValid) {
            return session;
          }
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  // 更新会话token
  async updateTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<boolean> {
    try {
      const tokenHash = await bcrypt.hash(accessToken, 10);
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const result = await this.execute(`
        UPDATE ${this.tableName}
        SET
          token_hash = ?,
          refresh_token_hash = ?,
          expires_at = ?,
          last_used_at = ?
        WHERE id = ?
      `, [
        tokenHash,
        refreshTokenHash,
        expiresAt.toISOString(),
        this.getCurrentTimestamp(),
        sessionId
      ]);

      return result.changes > 0;
    } catch {
      return false;
    }
  }

  // 更新最后使用时间
  async updateLastUsed(sessionId: string): Promise<void> {
    this.execute(`
      UPDATE ${this.tableName}
      SET last_used_at = ?
      WHERE id = ?
    `, [this.getCurrentTimestamp(), sessionId]);
  }

  // 删除会话（登出）
  async delete(sessionId: string): Promise<boolean> {
    return this.deleteById(sessionId);
  }

  // 删除用户的所有会话
  async deleteAllUserSessions(userId: string): Promise<number> {
    const result = await this.execute(`
      DELETE FROM ${this.tableName}
      WHERE user_id = ?
    `, [userId]);

    return result.changes;
  }

  // 删除用户的其他会话（保留当前会话）
  async deleteOtherUserSessions(userId: string, currentSessionId: string): Promise<number> {
    const result = await this.execute(`
      DELETE FROM ${this.tableName}
      WHERE user_id = ? AND id != ?
    `, [userId, currentSessionId]);

    return result.changes;
  }

  // 获取用户的活跃会话列表
  async getUserActiveSessions(userId: string): Promise<Array<{
    id: string;
    device_info: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    last_used_at: string;
    is_current?: boolean;
  }>> {
    const sessions = await this.findMany<UserSession>(`
      SELECT
        id, device_info, ip_address, user_agent,
        created_at, last_used_at
      FROM ${this.tableName}
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY last_used_at DESC
    `, [userId]);

    return sessions.map(session => ({
      id: session.id,
      device_info: session.device_info,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      created_at: session.created_at,
      last_used_at: session.last_used_at
    }));
  }

  // 清理过期会话
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.execute(`
      DELETE FROM ${this.tableName}
      WHERE expires_at <= datetime('now')
    `);

    return result.changes;
  }

  // 获取会话统计信息
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    todayLogins: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats = await this.findOne<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN expires_at <= datetime('now') THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as today_logins
      FROM ${this.tableName}
    `, [startOfDay.toISOString()]);

    return {
      total: stats?.total || 0,
      active: stats?.active || 0,
      expired: stats?.expired || 0,
      todayLogins: stats?.today_logins || 0
    };
  }

  // 检查会话是否有效
  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.findOne<{ expires_at: string }>(`
      SELECT expires_at FROM ${this.tableName}
      WHERE id = ?
    `, [sessionId]);

    if (!session) {
      return false;
    }

    return new Date(session.expires_at) > new Date();
  }

  // 延长会话时间
  async extendSession(sessionId: string, additionalSeconds: number): Promise<boolean> {
    const session = await this.findOne<{ expires_at: string }>(`
      SELECT expires_at FROM ${this.tableName}
      WHERE id = ?
    `, [sessionId]);

    if (!session) {
      return false;
    }

    const newExpiresAt = new Date(new Date(session.expires_at).getTime() + additionalSeconds * 1000);

    const result = await this.execute(`
      UPDATE ${this.tableName}
      SET expires_at = ?, last_used_at = ?
      WHERE id = ?
    `, [newExpiresAt.toISOString(), this.getCurrentTimestamp(), sessionId]);

    return result.changes > 0;
  }
}

// 导出单例实例
export const sessionModel = new SessionModel();