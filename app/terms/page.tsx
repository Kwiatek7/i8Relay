'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { useConfig } from '../../lib/providers/config-provider';

export default function TermsPage() {
  const { config } = useConfig();

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="py-16 px-5 mt-14">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-sm prose-blue dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              {config.site_name} 使用条款
            </h1>

            <h4 className="text-gray-600 dark:text-gray-400 mb-8">
              生效日期：2025年9月22日
            </h4>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              1. 服务条款接受
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              欢迎使用 {config.site_name}（以下简称"本服务"或"平台"）。{config.site_name} 是一个专业的 AI 模型中转服务平台，提供包括 Claude、GPT、Gemini 等多种 AI 模型的 API 接入服务。通过访问或使用本服务，您（以下简称"用户"或"您"）即表示同意接受并遵守本使用条款的所有内容。如您不同意本条款的任何内容，请立即停止使用本服务。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              2. 服务描述
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {config.site_name} 提供以下服务：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>多种 AI 模型的 API 中转服务（包括但不限于 Claude、GPT、Gemini 等）</li>
              <li>统一的 API 接口管理</li>
              <li>用量统计和监控功能</li>
              <li>账户管理和订阅套餐服务</li>
              <li>技术支持和文档服务</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              3. 账户注册与管理
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              3.1 注册要求
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>用户必须提供真实、准确、最新的注册信息</li>
              <li>用户必须年满18周岁或在其所在司法管辖区达到法定年龄</li>
              <li>每个用户只能注册一个账户，除非获得我们的明确许可</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              3.2 账户安全
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>用户负责维护账户密码和 API 密钥的安全性</li>
              <li>任何通过您的账户进行的活动均由您负责</li>
              <li>发现账户被未授权使用时，应立即通知我们</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              4. 使用规范
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              4.1 合法使用
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              用户同意将本服务仅用于合法目的，并遵守所有适用的法律法规。用户必须同时遵守各AI服务提供商的服务条款和使用政策，包括但不限于：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Anthropic Claude 的使用条款和可接受使用政策</li>
              <li>OpenAI GPT 的使用条款和使用政策</li>
              <li>Google Gemini 的服务条款和AI原则</li>
              <li>其他接入的AI模型服务商的相关协议</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              违反上述任何服务商的条款可能导致您的账户被暂停或终止。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              4.2 禁止行为
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-4">用户不得：</p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>违反任何适用的法律法规或本条款</li>
              <li>侵犯他人的知识产权、隐私权或其他合法权益</li>
              <li>传播恶意软件、病毒或其他有害代码</li>
              <li>进行网络攻击、数据爬取或其他恶意行为</li>
              <li>滥用 API 接口或试图绕过使用限制</li>
              <li>转售、分享或非法分发服务访问权限</li>
              <li>生成或传播违法、有害、威胁、辱骂、骚扰、诽谤、色情或其他不当内容</li>
              <li>冒充他人或虚假陈述您与任何人或实体的关系</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              5. 付费服务与订阅
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              5.1 订阅套餐
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>本服务提供多种订阅套餐，具体内容和价格以平台公布为准</li>
              <li>订阅费用需预付，按所选套餐周期收取</li>
              <li>套餐内容、价格可能调整，调整前会提前通知用户</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              5.2 支付方式
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>支持信用卡、支付宝、微信支付等多种支付方式</li>
              <li>所有支付信息将通过安全加密传输</li>
              <li>用户需确保支付信息的准确性和有效性</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              5.3 退款政策
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              订阅套餐一经购买，不支持退款。请在购买前仔细了解套餐内容和使用条款。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              6. API 使用限制
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              6.1 速率限制
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>每个套餐有相应的请求速率限制</li>
              <li>超出限制可能导致服务暂时不可用</li>
              <li>持续违反限制可能导致账户被暂停或终止</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              6.2 使用配额
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>根据订阅套餐设定每月使用配额</li>
              <li>超出配额需要升级套餐或购买额外配额</li>
              <li>未使用的配额不会累积到下个周期</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              7. 知识产权
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              7.1 平台权利
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {config.site_name} 及其相关标识、界面设计、功能和文档等均为我们或授权方的知识产权，受相关法律保护。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              7.2 用户内容
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>用户对其通过服务生成或上传的内容保留所有权</li>
              <li>用户授予我们为提供服务所必需的使用许可</li>
              <li>用户保证其内容不侵犯第三方权利</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              8. 隐私保护
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              我们重视用户隐私保护。关于我们如何收集、使用和保护您的个人信息，请参阅我们的
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
                隐私政策
              </Link>
              。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              9. 服务变更与中断
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>我们保留随时修改、暂停或终止服务的权利</li>
              <li>计划性维护将提前通知用户</li>
              <li>紧急维护可能无法提前通知</li>
              <li>服务中断期间，我们将尽力减少对用户的影响</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              10. 免责声明
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              10.1 服务可用性
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              本服务按"现状"和"可用"基础提供。我们不保证服务将不间断、无错误或完全安全。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              10.2 AI 输出内容
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>AI 生成的内容可能包含错误或不准确信息</li>
              <li>用户应独立验证 AI 输出的准确性和适用性</li>
              <li>我们不对 AI 生成内容的准确性、完整性或适用性负责</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              11. 责任限制
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              在法律允许的最大范围内，{config.site_name} 及其关联方不对因使用或无法使用本服务而产生的任何间接、偶然、特殊、后果性或惩罚性损害负责，包括但不限于利润损失、数据丢失或业务中断。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              12. 赔偿条款
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              用户同意为因其违反本条款或使用本服务而产生的任何索赔、损失、责任和费用（包括合理的律师费）向 {config.site_name} 及其关联方提供赔偿、辩护并使其免受损害。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              13. 条款修改
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>我们保留随时修改本条款的权利</li>
              <li>重大修改将通过电子邮件或平台公告通知用户</li>
              <li>继续使用服务即表示接受修改后的条款</li>
              <li>如不同意修改，用户应停止使用服务</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              14. 账户终止
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              14.1 用户终止
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              用户可随时通过账户设置或联系客服终止账户。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              14.2 平台终止
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              如用户违反本条款，我们有权立即暂停或终止其账户，无需事先通知。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              15. 争议解决
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>本条款受中华人民共和国法律管辖</li>
              <li>因本条款产生的争议应首先通过友好协商解决</li>
              <li>协商不成的，应提交至有管辖权的人民法院解决</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              16. 其他条款
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              16.1 完整协议
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              本条款构成用户与 {config.site_name} 之间关于服务使用的完整协议。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              16.2 可分割性
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              如本条款的任何条款被认定为无效或不可执行，其余条款仍然有效。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              16.3 不弃权
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              我们未能执行本条款的任何权利或条款不构成对该权利或条款的放弃。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              17. 联系方式
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              如对本条款有任何疑问，请通过以下方式联系我们：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-8 space-y-2">
              <li>电子邮件：{config.contact_email}</li>
              <li>联系页面：<Link href="/contact" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">联系我们</Link></li>
            </ul>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mt-8">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>重要提示：</strong>使用我们的服务即表示您已阅读、理解并同意本使用条款。如果您对条款有任何疑问，请在使用服务前联系我们。
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}