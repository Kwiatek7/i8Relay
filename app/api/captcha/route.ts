import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // 生成简单的数学运算验证码
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let answer: number;
    let question: string;

    if (operator === '+') {
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
    } else {
      // 确保减法结果为正数
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      answer = larger - smaller;
      question = `${larger} - ${smaller}`;
    }

    // 使用JWT安全存储验证码答案，设置5分钟过期
    const token = jwt.sign(
      {
        answer: answer.toString(),
        timestamp: Date.now()
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '5m' }
    );

    return NextResponse.json({
      question: question,
      token: token
    });

  } catch (error) {
    console.error('生成验证码失败:', error);
    return NextResponse.json(
      { error: '生成验证码失败' },
      { status: 500 }
    );
  }
}

// 验证验证码
export async function POST(request: NextRequest) {
  try {
    const { token, userInput } = await request.json();

    if (!token || !userInput) {
      return NextResponse.json(
        { error: '参数不完整' },
        { status: 400 }
      );
    }

    // 验证JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as { answer: string; timestamp: number };

    // 检查验证码是否正确（不区分大小写）
    const isValid = decoded.answer === userInput.toLowerCase().trim();

    return NextResponse.json({
      valid: isValid,
      message: isValid ? '验证码正确' : '验证码错误'
    });

  } catch (error) {
    console.error('验证码验证失败:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: '验证码无效' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    );
  }
}