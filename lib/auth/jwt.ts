import jwt from 'jsonwebtoken';
import { configModel } from '../database/models';

export interface JwtPayload {
  userId: string;
  email: string;
  user_role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JwtManager {
  private static instance: JwtManager;
  private jwtSecret: string | null = null;

  static getInstance(): JwtManager {
    if (!this.instance) {
      this.instance = new JwtManager();
    }
    return this.instance;
  }

  // 获取JWT密钥
  private async getJwtSecret(): Promise<string> {
    if (!this.jwtSecret) {
      this.jwtSecret = await configModel.getJwtSecret();
    }
    return this.jwtSecret;
  }

  // 生成访问令牌
  async generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    const secret = await this.getJwtSecret();
    const expiresIn: string = process.env.JWT_EXPIRES_IN || '24h';

    return jwt.sign(payload, secret, {
      expiresIn,
      issuer: 'i8relay',
      audience: 'i8relay-users'
    } as jwt.SignOptions);
  }

  // 生成刷新令牌
  async generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    const secret = await this.getJwtSecret();
    const expiresIn: string = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

    return jwt.sign(
      {
        ...payload,
        type: 'refresh'
      },
      secret,
      {
        expiresIn,
        issuer: 'i8relay',
        audience: 'i8relay-refresh'
      } as jwt.SignOptions
    );
  }

  // 生成令牌对
  async generateTokenPair(
    userId: string,
    email: string,
    user_role: string,
    sessionId: string
  ): Promise<TokenPair> {
    const payload = { userId, email, user_role, sessionId };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload)
    ]);

    // 计算过期时间（秒）
    const expiresIn = this.parseExpirationTime(process.env.JWT_EXPIRES_IN || '24h');

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  // 验证访问令牌
  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const secret = await this.getJwtSecret();
      const decoded = jwt.verify(token, secret, {
        issuer: 'i8relay',
        audience: 'i8relay-users'
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token无效');
      } else {
        throw new Error('Token验证失败');
      }
    }
  }

  // 验证刷新令牌
  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      const secret = await this.getJwtSecret();
      const decoded = jwt.verify(token, secret, {
        issuer: 'i8relay',
        audience: 'i8relay-refresh'
      }) as JwtPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('令牌类型错误');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('刷新令牌已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('刷新令牌无效');
      } else {
        throw new Error('刷新令牌验证失败');
      }
    }
  }

  // 解码令牌（不验证签名）
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  // 检查令牌是否即将过期（30分钟内）
  isTokenExpiringSoon(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    // 如果30分钟内过期，返回true
    return timeUntilExpiry < 30 * 60;
  }

  // 生成随机会话ID
  generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // 解析过期时间字符串为秒数
  private parseExpirationTime(expiresIn: string): number {
    const units: Record<string, number> = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800
    };

    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    if (!match) {
      return 24 * 3600; // 默认24小时
    }

    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || 3600);
  }

  // 从Authorization头中提取token
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

// 导出单例实例
export const jwtManager = JwtManager.getInstance();