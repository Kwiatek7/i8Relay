import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { getDb } from '../../../lib/database/connection';

interface ContactFormData {
  name: string;
  position: string;
  email: string;
  description: string;
  captchaCode: string;
  captchaToken: string;
}

interface SmtpConfig {
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  contact_form_email: string;
}

// 从数据库获取SMTP配置
async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const db = await getDb();
    const config = await db.get('SELECT smtp_enabled, smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, contact_form_email FROM site_config WHERE id = ?', ['default']);

    if (!config) {
      return null;
    }

    return {
      smtp_enabled: !!config.smtp_enabled,
      smtp_host: config.smtp_host || '',
      smtp_port: config.smtp_port || 587,
      smtp_user: config.smtp_user || '',
      smtp_password: config.smtp_password || '',
      smtp_secure: !!config.smtp_secure,
      contact_form_email: config.contact_form_email || '',
    };
  } catch (error) {
    console.error('获取SMTP配置失败:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // 验证必填字段
    const { name, position, email, description, captchaCode, captchaToken } = body;

    if (!name || !position || !email || !description || !captchaCode || !captchaToken) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 获取SMTP配置
    const smtpConfig = await getSmtpConfig();
    if (!smtpConfig || !smtpConfig.smtp_enabled) {
      return NextResponse.json(
        { error: '邮件服务未启用，请联系管理员' },
        { status: 503 }
      );
    }

    // 验证SMTP配置完整性
    if (!smtpConfig.smtp_host || !smtpConfig.smtp_user || !smtpConfig.smtp_password) {
      return NextResponse.json(
        { error: '邮件服务配置不完整，请联系管理员' },
        { status: 503 }
      );
    }

    // 验证验证码
    try {
      const decoded = jwt.verify(
        captchaToken,
        process.env.JWT_SECRET || 'default-secret'
      ) as { answer: string; timestamp: number };

      if (decoded.answer !== captchaCode.toLowerCase().trim()) {
        return NextResponse.json(
          { error: '验证码错误，请重新输入' },
          { status: 400 }
        );
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: '验证码已过期，请重新获取' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: '验证码无效，请重新获取' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证描述长度
    if (description.length > 2000) {
      return NextResponse.json(
        { error: '需求描述不能超过2000个字符' },
        { status: 400 }
      );
    }

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port,
      secure: smtpConfig.smtp_secure, // true for 465, false for other ports
      auth: {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_password,
      },
    });

    // 邮件内容
    const mailOptions = {
      from: `"${name}" <${smtpConfig.smtp_user}>`,
      to: smtpConfig.contact_form_email || smtpConfig.smtp_user,
      subject: `【联系我们】来自${name}的咨询`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">新的联系表单提交</h2>

          <div style="margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-bottom: 10px;">基本信息</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">姓名：</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">职位：</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${position}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">邮箱：</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #4F46E5;">${email}</a></td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-bottom: 10px;">需求描述</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #4F46E5;">
              ${description.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-radius: 5px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>提交时间：</strong> ${new Date().toLocaleString('zh-CN')}
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
            此邮件由联系表单自动发送，请勿直接回复此邮件。如需回复，请直接联系 ${email}
          </div>
        </div>
      `,
      replyTo: email,
    };

    // 发送邮件
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: '提交成功，我们会尽快与您联系！' },
      { status: 200 }
    );

  } catch (error) {
    console.error('联系表单提交错误:', error);

    return NextResponse.json(
      { error: '提交失败，请稍后重试或直接联系我们' },
      { status: 500 }
    );
  }
}