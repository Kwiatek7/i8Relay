import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { userModel } from '../../../../lib/database/models/user';
import { sendPasswordResetEmail } from '../../../../lib/email';
import { verifyCaptcha } from '../../captcha/route';

// 生成密码重置令牌
function generateResetToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: 'password_reset',
      timestamp: Date.now()
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '1h' } // 1小时过期
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email, captchaCode } = await request.json();

    // 验证输入
    if (!email || !captchaCode) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL', message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证验证码
    const isCaptchaValid = await verifyCaptcha(request, captchaCode);
    if (!isCaptchaValid) {
      return NextResponse.json(
        { error: 'INVALID_CAPTCHA', message: '验证码错误，请重新输入' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await userModel.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: '该邮箱未注册' },
        { status: 404 }
      );
    }

    // 检查用户状态
    if (user.user_status !== 'active') {
      return NextResponse.json(
        { error: 'ACCOUNT_INACTIVE', message: '账户已被禁用，请联系客服' },
        { status: 403 }
      );
    }

    // 生成重置令牌
    const resetToken = generateResetToken(user.id, user.email);

    // 发送密码重置邮件
    const emailSent = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailSent) {
      console.error('密码重置邮件发送失败:', user.email);
      return NextResponse.json(
        { error: 'EMAIL_SEND_FAILED', message: '邮件发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 记录操作日志
    console.log(`密码重置邮件已发送给用户: ${user.email} (${user.id})`);

    // 清除验证码Cookie
    const response = NextResponse.json({
      success: true,
      message: '密码重置邮件已发送，请查收邮箱'
    });

    response.headers.set('Set-Cookie', 'captcha-token=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/');

    return response;

  } catch (error) {
    console.error('忘记密码请求失败:', error);

    // JWT相关错误
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'TOKEN_ERROR', message: '令牌生成失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取忘记密码页面状态（可选）
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: '忘记密码服务正常'
    });
  } catch (error) {
    console.error('获取忘记密码状态失败:', error);
    return NextResponse.json(
      { error: 'SERVICE_UNAVAILABLE', message: '服务暂时不可用' },
      { status: 503 }
    );
  }
}