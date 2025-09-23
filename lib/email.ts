import nodemailer from 'nodemailer';

// 邮件配置接口
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 邮件内容接口
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// 创建邮件传输器
function createTransporter(): nodemailer.Transporter {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  return nodemailer.createTransport(config);
}

// 发送邮件
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('邮件配置不完整，请检查 SMTP_USER 和 SMTP_PASS 环境变量');
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.NEXT_PUBLIC_SITE_NAME || 'i8Relay'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}

// 生成密码重置邮件模板
export function generatePasswordResetEmailTemplate(
  resetUrl: string,
  userEmail: string
): { subject: string; html: string; text: string } {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'i8Relay';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const subject = `${siteName} - 密码重置请求`;

  const html = `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>密码重置</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #007bff;">${siteName}</h1>
          <p style="margin: 10px 0 0 0;">密码重置请求</p>
        </div>

        <div class="content">
          <h2>您好！</h2>
          <p>我们收到了您在 <strong>${siteName}</strong> 重置密码的请求。</p>

          <p>请点击下面的按钮重置您的密码：</p>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" style="color: white;">重置密码</a>
          </div>

          <div class="warning">
            <p><strong>⚠️ 安全提醒：</strong></p>
            <ul>
              <li>此链接将在 <strong>1小时</strong> 后过期</li>
              <li>如果您没有申请密码重置，请忽略此邮件</li>
              <li>请勿将此邮件转发给他人</li>
            </ul>
          </div>

          <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
          <div class="code">${resetUrl}</div>

          <p>如果您有任何问题，请联系我们的客服团队。</p>
        </div>

        <div class="footer">
          <p>此邮件由 <a href="${siteUrl}">${siteName}</a> 自动发送，请勿回复</p>
          <p>邮箱：${userEmail}</p>
          <p>&copy; ${new Date().getFullYear()} ${siteName}. 保留所有权利。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${siteName} - 密码重置请求

您好！

我们收到了您在 ${siteName} 重置密码的请求。

请访问以下链接重置您的密码：
${resetUrl}

⚠️ 安全提醒：
- 此链接将在 1小时 后过期
- 如果您没有申请密码重置，请忽略此邮件
- 请勿将此邮件转发给他人

如果您有任何问题，请联系我们的客服团队。

此邮件由 ${siteName} 自动发送，请勿回复
邮箱：${userEmail}

© ${new Date().getFullYear()} ${siteName}. 保留所有权利。
  `;

  return { subject, html, text };
}

// 发送密码重置邮件
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;

  const { subject, html, text } = generatePasswordResetEmailTemplate(resetUrl, email);

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

// 生成欢迎邮件模板
export function generateWelcomeEmailTemplate(
  username: string,
  userEmail: string
): { subject: string; html: string; text: string } {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'i8Relay';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const subject = `欢迎加入 ${siteName}！`;

  const html = `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>欢迎加入</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #007bff;">${siteName}</h1>
          <p style="margin: 10px 0 0 0;">欢迎加入我们！</p>
        </div>

        <div class="content">
          <h2>欢迎，${username}！</h2>
          <p>感谢您注册 <strong>${siteName}</strong>，我们很高兴您的加入！</p>

          <div class="features">
            <h3>🎉 您现在可以：</h3>
            <ul>
              <li>🔑 使用多种 AI 模型</li>
              <li>📊 查看使用统计和成本分析</li>
              <li>💳 管理您的订阅和账单</li>
              <li>🔔 接收重要通知和更新</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${siteUrl}/dashboard" class="button" style="color: white;">开始使用</a>
          </div>

          <p>如果您有任何问题或需要帮助，请随时联系我们的客服团队。</p>
        </div>

        <div class="footer">
          <p>此邮件由 <a href="${siteUrl}">${siteName}</a> 自动发送</p>
          <p>邮箱：${userEmail}</p>
          <p>&copy; ${new Date().getFullYear()} ${siteName}. 保留所有权利。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${siteName} - 欢迎加入我们！

欢迎，${username}！

感谢您注册 ${siteName}，我们很高兴您的加入！

🎉 您现在可以：
- 🔑 使用多种 AI 模型
- 📊 查看使用统计和成本分析
- 💳 管理您的订阅和账单
- 🔔 接收重要通知和更新

立即开始使用：${siteUrl}/dashboard

如果您有任何问题或需要帮助，请随时联系我们的客服团队。

此邮件由 ${siteName} 自动发送
邮箱：${userEmail}

© ${new Date().getFullYear()} ${siteName}. 保留所有权利。
  `;

  return { subject, html, text };
}

// 发送欢迎邮件
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<boolean> {
  const { subject, html, text } = generateWelcomeEmailTemplate(username, email);

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}