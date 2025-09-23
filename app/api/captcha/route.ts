import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// 生成随机验证码文本
function generateCaptchaText(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成SVG验证码图片
function generateCaptchaSVG(text: string): string {
  const width = 120;
  const height = 40;

  // 随机颜色
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const bgColor = '#F8F9FA';

  // 随机干扰线
  let lines = '';
  for (let i = 0; i < 3; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
  }

  // 随机干扰点
  let dots = '';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    dots += `<circle cx="${x}" cy="${y}" r="1" fill="${color}" opacity="0.6"/>`;
  }

  // 文字
  let textElements = '';
  for (let i = 0; i < text.length; i++) {
    const x = 20 + i * 20 + (Math.random() - 0.5) * 5;
    const y = 25 + (Math.random() - 0.5) * 4;
    const rotation = (Math.random() - 0.5) * 15;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const fontSize = 18 + Math.random() * 4;

    textElements += `
      <text x="${x}" y="${y}"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            font-weight="bold"
            fill="${color}"
            transform="rotate(${rotation}, ${x}, ${y})"
            text-anchor="middle">
        ${text[i]}
      </text>`;
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      ${lines}
      ${dots}
      ${textElements}
    </svg>
  `;
}

export async function GET(request: NextRequest) {
  try {
    // 生成4位字母数字验证码
    const captchaText = generateCaptchaText();

    // 生成SVG图片
    const svgContent = generateCaptchaSVG(captchaText);

    // 将验证码答案存储在session或返回token
    const token = jwt.sign(
      {
        answer: captchaText,
        timestamp: Date.now()
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '5m' }
    );

    // 返回SVG图片
    const response = new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Set-Cookie': `captcha-token=${token}; HttpOnly; SameSite=Strict; Max-Age=300; Path=/`
      }
    });

    return response;

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
    const { userInput } = await request.json();

    if (!userInput) {
      return NextResponse.json(
        { error: '请输入验证码' },
        { status: 400 }
      );
    }

    // 从Cookie中获取验证码token
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      );
    }

    const tokenMatch = cookieHeader.match(/captcha-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      );
    }

    const token = tokenMatch[1];

    // 验证JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as { answer: string; timestamp: number };

    // 检查验证码是否正确（不区分大小写）
    const isValid = decoded.answer.toUpperCase() === userInput.toUpperCase().trim();

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

// 验证验证码的辅助函数
export async function verifyCaptcha(request: NextRequest, userInput: string): Promise<boolean> {
  try {
    // 从Cookie中获取验证码token
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return false;

    const tokenMatch = cookieHeader.match(/captcha-token=([^;]+)/);
    if (!tokenMatch) return false;

    const token = tokenMatch[1];

    // 验证JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as { answer: string; timestamp: number };

    // 检查验证码是否正确（不区分大小写）
    return decoded.answer.toUpperCase() === userInput.toUpperCase().trim();
  } catch (error) {
    return false;
  }
}