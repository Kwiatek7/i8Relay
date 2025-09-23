import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createErrorResponse } from '../../../../lib/auth/middleware';
import { validateWebhookSignature } from '../../../../lib/stripe/client';
import { getDb } from '../../../../lib/database/connection';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Webhook 签名缺失');
      return createErrorResponse(new Error('缺少 Stripe 签名'), 400);
    }

    // 验证 Webhook 签名
    const event = await validateWebhookSignature(body, signature);
    if (!event) {
      console.error('Webhook 签名验证失败');
      return createErrorResponse(new Error('签名验证失败'), 401);
    }

    console.log(`处理 Stripe Webhook 事件: ${event.type}`);

    // 处理不同类型的事件
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`未处理的事件类型: ${event.type}`);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook 处理错误:', error);
    return createErrorResponse(new Error('Webhook 处理失败'), 500);
  }
}

/**
 * 处理支付成功事件
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDb();

  try {
    // 更新支付记录状态
    await db.run(`
      UPDATE billing_records
      SET status = 'completed',
          updated_at = ?,
          metadata = json_patch(metadata, ?)
      WHERE payment_id = ?
    `, [
      new Date().toISOString(),
      JSON.stringify({
        stripePaymentStatus: paymentIntent.status,
        stripeChargeId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null,
        completedAt: new Date().toISOString()
      }),
      paymentIntent.id
    ]);

    // 获取支付记录和用户信息
    const billingRecord = await db.get(`
      SELECT br.*, u.email as user_email
      FROM billing_records br
      JOIN users u ON br.user_id = u.id
      WHERE br.payment_id = ?
    `, [paymentIntent.id]);

    if (billingRecord) {
      // 如果是订阅支付，更新用户订阅状态
      if (billingRecord.type === 'subscription' && billingRecord.subscription_id) {
        await updateUserSubscription(billingRecord);
      }

      // 记录成功的支付事件
      console.log(`支付成功: 用户 ${billingRecord.user_email}, 金额 ${billingRecord.amount} ${billingRecord.currency}`);
    }

  } catch (error) {
    console.error('处理支付成功事件失败:', error);
    throw error;
  }
}

/**
 * 处理支付失败事件
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDb();

  try {
    await db.run(`
      UPDATE billing_records
      SET status = 'failed',
          updated_at = ?,
          metadata = json_patch(metadata, ?)
      WHERE payment_id = ?
    `, [
      new Date().toISOString(),
      JSON.stringify({
        stripePaymentStatus: paymentIntent.status,
        failureReason: paymentIntent.last_payment_error?.message || '支付失败',
        failedAt: new Date().toISOString()
      }),
      paymentIntent.id
    ]);

    console.log(`支付失败: PaymentIntent ${paymentIntent.id}`);

  } catch (error) {
    console.error('处理支付失败事件失败:', error);
    throw error;
  }
}

/**
 * 处理支付取消事件
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDb();

  try {
    await db.run(`
      UPDATE billing_records
      SET status = 'canceled',
          updated_at = ?,
          metadata = json_patch(metadata, ?)
      WHERE payment_id = ?
    `, [
      new Date().toISOString(),
      JSON.stringify({
        stripePaymentStatus: paymentIntent.status,
        canceledAt: new Date().toISOString()
      }),
      paymentIntent.id
    ]);

    console.log(`支付取消: PaymentIntent ${paymentIntent.id}`);

  } catch (error) {
    console.error('处理支付取消事件失败:', error);
    throw error;
  }
}

/**
 * 处理需要进一步操作的支付事件
 */
async function handlePaymentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDb();

  try {
    await db.run(`
      UPDATE billing_records
      SET status = 'requires_action',
          updated_at = ?,
          metadata = json_patch(metadata, ?)
      WHERE payment_id = ?
    `, [
      new Date().toISOString(),
      JSON.stringify({
        stripePaymentStatus: paymentIntent.status,
        requiresAction: true,
        nextAction: paymentIntent.next_action?.type || 'unknown'
      }),
      paymentIntent.id
    ]);

    console.log(`支付需要进一步操作: PaymentIntent ${paymentIntent.id}`);

  } catch (error) {
    console.error('处理支付需要操作事件失败:', error);
    throw error;
  }
}

/**
 * 处理客户创建事件
 */
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log(`Stripe 客户创建: ${customer.id}, Email: ${customer.email}`);
  // 可以在这里同步客户信息到本地数据库
}

/**
 * 处理客户更新事件
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log(`Stripe 客户更新: ${customer.id}, Email: ${customer.email}`);
  // 可以在这里同步更新的客户信息
}

/**
 * 处理发票支付成功事件
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`发票支付成功: ${invoice.id}, 金额: ${invoice.amount_paid}`);
  // 处理订阅相关的发票支付
}

/**
 * 处理发票支付失败事件
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`发票支付失败: ${invoice.id}, 金额: ${invoice.amount_due}`);
  // 处理订阅支付失败，可能需要暂停服务
}

/**
 * 更新用户订阅状态
 */
async function updateUserSubscription(billingRecord: any) {
  const db = await getDb();

  try {
    // 解析元数据获取套餐信息
    const metadata = JSON.parse(billingRecord.metadata || '{}');
    const planId = metadata.planId;

    if (planId) {
      // 获取套餐信息
      const plan = await db.get('SELECT * FROM plans WHERE id = ?', [planId]);

      if (plan) {
        // 计算新的过期时间
        const currentTime = new Date();
        const expiresAt = new Date(currentTime.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

        // 更新用户订阅信息
        await db.run(`
          UPDATE users
          SET subscription_plan_id = ?,
              subscription_expires_at = ?,
              updated_at = ?
          WHERE id = ?
        `, [
          planId,
          expiresAt.toISOString(),
          currentTime.toISOString(),
          billingRecord.user_id
        ]);

        console.log(`用户订阅更新成功: 用户 ${billingRecord.user_id}, 套餐 ${planId}, 过期时间 ${expiresAt.toISOString()}`);
      }
    }

  } catch (error) {
    console.error('更新用户订阅失败:', error);
    throw error;
  }
}