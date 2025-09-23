'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { useConfig } from '../../lib/providers/config-provider';

export default function ServiceAgreementPage() {
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
              {config.site_name} 服务协议
            </h1>

            <h4 className="text-gray-600 dark:text-gray-400 mb-8">
              生效日期：2025年9月22日
            </h4>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              1. 协议概述
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              本服务协议（以下简称"本协议"）是您与 {config.site_name}（以下简称"本平台"、"我们"）之间关于使用 {config.site_name} AI API 中转服务的法律协议。本协议详细规定了服务内容、双方权利义务、服务质量保证等重要条款。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              2. 服务内容和范围
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              2.1 核心服务
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>AI API 中转服务：</strong>提供多种主流 AI 模型的统一 API 接入</li>
              <li><strong>支持的 AI 模型：</strong>Claude、GPT、Gemini、及其他合作伙伴的 AI 模型</li>
              <li><strong>统一接口管理：</strong>一个 API 密钥访问多种 AI 服务</li>
              <li><strong>用量监控：</strong>实时用量统计、历史记录查询</li>
              <li><strong>账户管理：</strong>用户注册、登录、套餐管理</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              2.2 技术支持服务
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>技术文档和开发指南</li>
              <li>API 接入技术支持</li>
              <li>故障排查和问题解决</li>
              <li>服务状态监控和通知</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              3. 服务质量保证
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              3.1 可用性保证
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>服务可用率：</strong>承诺月度服务可用率不低于 99.5%</li>
              <li><strong>响应时间：</strong>API 平均响应时间不超过 2 秒（不包括 AI 模型处理时间）</li>
              <li><strong>并发处理：</strong>支持高并发请求处理</li>
              <li><strong>负载均衡：</strong>智能负载分配确保服务稳定</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              3.2 数据安全保证
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>采用企业级安全传输协议（SSL/TLS）</li>
              <li>API 密钥加密存储和传输</li>
              <li>定期安全漏洞扫描和修复</li>
              <li>数据备份和灾难恢复机制</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              4. 用户权利和义务
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              4.1 用户权利
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>服务使用权：</strong>在订阅期内享有服务使用权</li>
              <li><strong>技术支持：</strong>享受相应等级的技术支持服务</li>
              <li><strong>数据控制权：</strong>对通过 API 传输的数据享有控制权</li>
              <li><strong>账户管理权：</strong>管理账户信息和 API 密钥</li>
              <li><strong>服务监控权：</strong>查看服务使用情况和统计数据</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              4.2 用户义务
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>合法使用：</strong>仅将服务用于合法目的，遵守相关法律法规</li>
              <li><strong>信息真实：</strong>提供真实、准确的注册和账户信息</li>
              <li><strong>费用支付：</strong>按时支付服务费用</li>
              <li><strong>安全保护：</strong>妥善保管 API 密钥，防止泄露</li>
              <li><strong>合规使用：</strong>遵守各 AI 模型提供商的使用政策</li>
              <li><strong>资源合理使用：</strong>不得滥用服务资源或进行恶意攻击</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              5. 平台权利和义务
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              5.1 平台权利
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>服务管理权：</strong>管理和优化服务质量</li>
              <li><strong>规则制定权：</strong>制定和修改服务使用规则</li>
              <li><strong>违规处理权：</strong>对违规行为进行处理，包括暂停或终止服务</li>
              <li><strong>费用收取权：</strong>按照公布的价格收取服务费用</li>
              <li><strong>数据分析权：</strong>分析汇总的服务使用数据（匿名化处理）</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              5.2 平台义务
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>服务提供义务：</strong>按照协议约定提供稳定的 API 服务</li>
              <li><strong>安全保障义务：</strong>采取必要措施保护用户数据安全</li>
              <li><strong>通知义务：</strong>及时通知服务变更、维护等重要信息</li>
              <li><strong>技术支持义务：</strong>提供必要的技术支持和文档</li>
              <li><strong>隐私保护义务：</strong>保护用户隐私信息不被泄露</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              6. 费用和支付
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              6.1 计费方式
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>套餐计费：</strong>按照选择的套餐进行月度或年度计费</li>
              <li><strong>用量计费：</strong>部分服务按照实际使用量计费</li>
              <li><strong>预付费模式：</strong>服务费用需要预先支付</li>
              <li><strong>透明计费：</strong>提供详细的费用明细和使用统计</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              6.2 支付条款
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>支持多种支付方式：信用卡、支付宝、微信支付等</li>
              <li>订阅费用在订阅期开始时收取</li>
              <li>超出套餐限制的用量将按标准费率收费</li>
              <li>费用支付失败可能导致服务暂停</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              7. 服务变更和终止
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              7.1 服务变更
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>功能更新：</strong>我们可能会更新或增加新功能</li>
              <li><strong>价格调整：</strong>价格调整将提前 30 天通知</li>
              <li><strong>服务升级：</strong>技术升级可能导致短暂服务中断</li>
              <li><strong>政策变更：</strong>使用政策变更将及时通知用户</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              7.2 服务终止
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>用户主动终止：</strong>用户可随时取消订阅或删除账户</li>
              <li><strong>平台终止：</strong>因违规行为或其他原因，平台可终止服务</li>
              <li><strong>数据处理：</strong>服务终止后，用户数据将在合理期限内删除</li>
              <li><strong>费用处理：</strong>已支付费用的处理将按照退款政策执行</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              8. 服务中断和维护
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              8.1 计划维护
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>定期系统维护将提前 24 小时通知</li>
              <li>维护时间通常安排在低峰时段</li>
              <li>维护期间服务可能暂时不可用</li>
              <li>紧急维护可能无法提前通知</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              8.2 不可抗力
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              因自然灾害、政府行为、网络攻击等不可抗力因素导致的服务中断，我们将尽力恢复服务但不承担相关责任。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              9. 知识产权
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>平台知识产权：</strong>{config.site_name} 平台的所有技术、设计、商标等知识产权归我们所有</li>
              <li><strong>用户数据权利：</strong>用户对其输入的数据保留所有权</li>
              <li><strong>第三方权利：</strong>用户应确保使用服务不侵犯第三方知识产权</li>
              <li><strong>授权使用：</strong>用户授权我们为提供服务而处理其数据</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              10. 违约责任
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              10.1 用户违约
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>违反使用规定可能导致服务暂停或终止</li>
              <li>恶意攻击或滥用服务将承担相应法律责任</li>
              <li>拖欠费用将导致服务暂停，并可能产生滞纳金</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              10.2 平台违约
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>未达到承诺的服务可用率，将提供服务时长补偿</li>
              <li>重大服务故障将根据影响程度提供相应赔偿</li>
              <li>数据泄露将承担相应责任并提供必要补救措施</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              11. 争议解决
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>协商解决：</strong>争议发生时，双方应首先通过友好协商解决</li>
              <li><strong>调解机制：</strong>协商不成可申请第三方调解</li>
              <li><strong>法律途径：</strong>调解无效时，可向有管辖权的人民法院提起诉讼</li>
              <li><strong>适用法律：</strong>本协议适用中华人民共和国法律</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              12. 协议修改和生效
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              12.1 协议修改
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>我们保留修改本协议的权利</li>
              <li>重要修改将提前 30 天通知用户</li>
              <li>继续使用服务即表示接受修改后的协议</li>
              <li>如不接受修改，用户可选择终止服务</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              12.2 协议生效
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              本协议自用户同意并开始使用服务时生效，直至用户停止使用服务或协议被终止。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              13. 其他条款
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>完整协议：</strong>本协议与使用条款、隐私政策共同构成完整的服务协议</li>
              <li><strong>条款独立性：</strong>协议任何条款无效不影响其他条款的效力</li>
              <li><strong>语言版本：</strong>本协议以中文版本为准</li>
              <li><strong>条款优先级：</strong>本协议与其他文件冲突时，以本协议为准</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              14. 联系方式
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              如对本服务协议有任何疑问，请通过以下方式联系我们：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-8 space-y-2">
              <li><strong>电子邮件：</strong>{config.contact_email}</li>
              <li><strong>联系页面：</strong><Link href="/contact" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">联系我们</Link></li>
              <li><strong>使用条款：</strong><Link href="/terms" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">使用条款</Link></li>
              <li><strong>隐私政策：</strong><Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">隐私政策</Link></li>
            </ul>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6 mt-8">
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                <strong>服务承诺：</strong>我们承诺为您提供稳定、安全、高质量的 AI API 中转服务，并不断优化服务体验。您的满意是我们持续改进的动力。
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}