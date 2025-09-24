import crypto from 'crypto';
import { getDb } from './database/connection';
import { sendEmail } from './email';
import { configModel } from './database/models/config';

// 邮箱验证令牌接口
export interface EmailVerificationToken {
  id: string;
  user_id: string;
  email: string;
  token: string;
  token_hash: string;
  type: 'email_verification' | 'email_change';
  is_used: boolean;
  used_at?: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

// 邮箱验证服务类
export class EmailVerificationService {
  /**
   * 生成安全的验证令牌
   */
  private generateToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  /**
   * 发送验证邮件
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    username: string,
    type: 'email_verification' | 'email_change' = 'email_verification',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const db = await getDb();

    try {
      // 获取邮箱验证配置
      const emailConfig = await configModel.getEmailVerificationConfig();

      if (!emailConfig.enable_email_verification) {
        return { success: false, error: '邮箱验证功能未启用' };
      }

      // 检查是否在冷却期内
      const cooldownCheck = await db.get(`
        SELECT created_at
        FROM email_verification_tokens
        WHERE user_id = ? AND email = ? AND type = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, email, type]);

      if (cooldownCheck) {
        const lastSent = new Date(cooldownCheck.created_at);
        const now = new Date();
        const cooldownMinutes = emailConfig.resend_cooldown_minutes;
        const timeDiff = (now.getTime() - lastSent.getTime()) / (1000 * 60);

        if (timeDiff < cooldownMinutes) {
          const remainingMinutes = Math.ceil(cooldownMinutes - timeDiff);
          return {
            success: false,
            error: `请等待 ${remainingMinutes} 分钟后再重新发送`
          };
        }
      }

      // 使旧令牌失效
      await db.run(`
        UPDATE email_verification_tokens
        SET is_used = true, used_at = ?
        WHERE user_id = ? AND email = ? AND type = ? AND is_used = false
      `, [new Date().toISOString(), userId, email, type]);

      // 生成新令牌
      const { token, hash } = this.generateToken();
      const tokenId = crypto.randomUUID().replace(/-/g, '');

      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + emailConfig.verification_token_expires_hours);

      // 保存令牌
      await db.run(`
        INSERT INTO email_verification_tokens (
          id, user_id, email, token, token_hash, type, expires_at,
          max_attempts, ip_address, user_agent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tokenId, userId, email, token, hash, type, expiresAt.toISOString(),
        emailConfig.max_verification_attempts, ipAddress, userAgent,
        new Date().toISOString(), new Date().toISOString()
      ]);

      // 发送邮件
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
      const subject = await configModel.get('email_verification', 'verification_email_subject') || '请验证您的邮箱地址';

      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>邮箱验证</h2>
          <p>您好 ${username}，</p>
          <p>感谢您注册我们的服务。请点击下面的链接验证您的邮箱地址：</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              验证邮箱
            </a>
          </p>
          <p>或者复制以下链接到浏览器：</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p><small>此链接将在 ${emailConfig.verification_token_expires_hours} 小时后过期。</small></p>
        </div>
      `;

      const textContent = `
        您好 ${username}，

        感谢您注册我们的服务。请访问以下链接验证您的邮箱地址：

        ${verificationLink}

        此链接将在 ${emailConfig.verification_token_expires_hours} 小时后过期。
      `;

      await sendEmail({
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent
      });

      return { success: true };
    } catch (error) {
      console.error('发送验证邮件失败:', error);
      return { success: false, error: '发送邮件失败' };
    }
  }

  /**
   * 验证邮箱令牌
   */
  async verifyEmailToken(token: string): Promise<{
    success: boolean;
    error?: string;
    userId?: string;
    email?: string;
  }> {
    const db = await getDb();

    try {
      // 生成令牌哈希
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // 查找令牌
      const tokenRecord = await db.get(`
        SELECT * FROM email_verification_tokens
        WHERE token_hash = ? AND is_used = false
      `, [tokenHash]);

      if (!tokenRecord) {
        return { success: false, error: '无效的验证链接' };
      }

      // 检查是否过期
      if (new Date() > new Date(tokenRecord.expires_at)) {
        await db.run(`
          UPDATE email_verification_tokens
          SET is_used = true, used_at = ?
          WHERE id = ?
        `, [new Date().toISOString(), tokenRecord.id]);

        return { success: false, error: '验证链接已过期' };
      }

      // 检查尝试次数
      if (tokenRecord.attempts >= tokenRecord.max_attempts) {
        return { success: false, error: '验证尝试次数过多' };
      }

      // 更新尝试次数
      await db.run(`
        UPDATE email_verification_tokens
        SET attempts = attempts + 1, updated_at = ?
        WHERE id = ?
      `, [new Date().toISOString(), tokenRecord.id]);

      // 标记令牌为已使用
      await db.run(`
        UPDATE email_verification_tokens
        SET is_used = true, used_at = ?, updated_at = ?
        WHERE id = ?
      `, [new Date().toISOString(), new Date().toISOString(), tokenRecord.id]);

      // 更新用户验证状态
      if (tokenRecord.type === 'email_verification') {
        await db.run(`
          UPDATE users
          SET email_verified = true, email_verified_at = ?, status = 'active', updated_at = ?
          WHERE id = ?
        `, [new Date().toISOString(), new Date().toISOString(), tokenRecord.user_id]);
      } else if (tokenRecord.type === 'email_change') {
        await db.run(`
          UPDATE users
          SET email = ?, email_verified = true, email_verified_at = ?, updated_at = ?
          WHERE id = ?
        `, [tokenRecord.email, new Date().toISOString(), new Date().toISOString(), tokenRecord.user_id]);
      }

      return {
        success: true,
        userId: tokenRecord.user_id,
        email: tokenRecord.email
      };
    } catch (error) {
      console.error('验证令牌失败:', error);
      return { success: false, error: '验证失败' };
    }
  }

  /**
   * 检查用户邮箱验证状态
   */
  async checkUserEmailVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    verifiedAt?: string;
    email?: string;
  }> {
    const db = await getDb();

    try {
      const result = await db.get(`
        SELECT email_verified, email_verified_at, email
        FROM users
        WHERE id = ?
      `, [userId]);

      if (!result) {
        return { isVerified: false };
      }

      return {
        isVerified: Boolean(result.email_verified),
        verifiedAt: result.email_verified_at,
        email: result.email
      };
    } catch (error) {
      console.error('检查邮箱验证状态失败:', error);
      return { isVerified: false };
    }
  }

  /**
   * 清理过期令牌
   */
  async cleanupExpiredTokens(): Promise<number> {
    const db = await getDb();

    try {
      const result = await db.run(`
        DELETE FROM email_verification_tokens
        WHERE expires_at < ? OR (is_used = true AND used_at < ?)
      `, [new Date().toISOString(), new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()]);

      return result.changes || 0;
    } catch (error) {
      console.error('清理过期令牌失败:', error);
      return 0;
    }
  }
}

// 导出单例实例
export const emailVerificationService = new EmailVerificationService();