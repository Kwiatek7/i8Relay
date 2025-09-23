import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userModel } from '../../../../lib/database/models/user';

// 重置令牌的数据结构
interface ResetTokenPayload {
  userId: string;
  email: string;
  type: string;
  timestamp: number;
}

// 验证密码强度
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: '密码至少需要8个字符' };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: '密码必须包含大小写字母和数字' };
  }

  return { valid: true };
}

// 验证重置令牌
function verifyResetToken(token: string): ResetTokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as ResetTokenPayload;

    // 检查令牌类型
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    console.error('重置令牌验证失败:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, action, newPassword } = await request.json();

    // 验证必需参数
    if (!token || !action) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必需参数' },
        { status: 400 }
      );
    }

    // 验证重置令牌
    const tokenPayload = verifyResetToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'TOKEN_INVALID', message: '重置链接无效或已过期' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const user = await userModel.findUserById(tokenPayload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查邮箱是否匹配
    if (user.email !== tokenPayload.email) {
      return NextResponse.json(
        { error: 'EMAIL_MISMATCH', message: '令牌与用户邮箱不匹配' },
        { status: 400 }
      );
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'ACCOUNT_INACTIVE', message: '账户已被禁用，请联系客服' },
        { status: 403 }
      );
    }

    // 处理不同的操作
    switch (action) {
      case 'validate':
        // 验证令牌有效性
        return NextResponse.json({
          success: true,
          userEmail: user.email,
          message: '令牌有效'
        });

      case 'reset':
        // 重置密码
        if (!newPassword) {
          return NextResponse.json(
            { error: 'MISSING_PASSWORD', message: '请输入新密码' },
            { status: 400 }
          );
        }

        // 验证新密码强度
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
          return NextResponse.json(
            { error: 'WEAK_PASSWORD', message: passwordValidation.message },
            { status: 400 }
          );
        }

        // 生成新密码哈希
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // 更新用户密码
        const updateResult = await userModel.update(user.id, {
          // 注意：这里需要直接操作数据库，因为userModel的update方法可能不包含密码字段
        });

        // 直接执行SQL更新密码
        const { getDb } = await import('../../../../lib/database/connection');
        const db = await getDb();

        const result = await db.run(`
          UPDATE users
          SET password_hash = ?, salt = ?, updated_at = ?
          WHERE id = ?
        `, [passwordHash, salt, new Date().toISOString(), user.id]);

        if ((result.changes ?? 0) === 0) {
          return NextResponse.json(
            { error: 'UPDATE_FAILED', message: '密码更新失败' },
            { status: 500 }
          );
        }

        // 记录操作日志
        console.log(`用户 ${user.email} (${user.id}) 成功重置密码`);

        return NextResponse.json({
          success: true,
          message: '密码重置成功，请使用新密码登录'
        });

      default:
        return NextResponse.json(
          { error: 'INVALID_ACTION', message: '无效的操作类型' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('密码重置处理失败:', error);

    // JWT 过期错误
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: '重置链接已过期，请重新申请' },
        { status: 400 }
      );
    }

    // JWT 无效错误
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'TOKEN_INVALID', message: '重置链接无效' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取重置密码页面状态（可选）
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'NO_TOKEN', message: '缺少重置令牌' },
        { status: 400 }
      );
    }

    // 验证令牌
    const tokenPayload = verifyResetToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'TOKEN_INVALID', message: '重置链接无效或已过期' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const user = await userModel.findUserById(tokenPayload.userId);
    if (!user || user.email !== tokenPayload.email) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: '用户不存在或邮箱不匹配' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      userEmail: user.email,
      message: '令牌有效'
    });

  } catch (error) {
    console.error('令牌验证失败:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: '重置链接已过期' },
        { status: 400 }
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'TOKEN_INVALID', message: '重置链接无效' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}