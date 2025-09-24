import { NextRequest, NextResponse } from 'next/server';
import { emailVerificationService } from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const body = await request.json();
    const { token } = body;

    // 验证token参数
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: '请提供有效的验证令牌' },
        { status: 400 }
      );
    }

    // 获取IP地址
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // 验证令牌
    const result = await emailVerificationService.verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '邮箱验证成功',
      data: {
        userId: result.userId,
        email: result.email
      }
    });

  } catch (error) {
    console.error('验证邮箱API错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// GET方法支持通过URL参数验证
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: '请提供有效的验证令牌' },
        { status: 400 }
      );
    }

    // 获取IP地址
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // 验证令牌
    const result = await emailVerificationService.verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '邮箱验证成功',
      data: {
        userId: result.userId,
        email: result.email
      }
    });

  } catch (error) {
    console.error('验证邮箱API错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}