'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { useConfig } from '../../lib/providers/config-provider';

export default function PrivacyPage() {
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
              {config.site_name} 隐私政策
            </h1>

            <h4 className="text-gray-600 dark:text-gray-400 mb-8">
              最后更新日期：2025年9月22日
            </h4>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              引言
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {config.site_name}（以下简称"我们"、"平台"或"服务"）深知隐私保护的重要性，并致力于保护用户的个人信息安全。本隐私政策详细说明了我们如何收集、使用、存储、共享和保护您的个人信息。使用我们的服务即表示您同意本隐私政策中描述的信息处理方式。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              1. 信息收集
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              1.1 您主动提供的信息
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>账户信息：</strong>注册时提供的用户名、电子邮箱、密码（加密存储）</li>
              <li><strong>个人资料：</strong>姓名、公司名称、联系电话（可选）</li>
              <li><strong>支付信息：</strong>订阅套餐时的支付方式、账单地址（通过第三方支付处理商处理）</li>
              <li><strong>API 使用数据：</strong>API 调用记录、请求内容、响应数据</li>
              <li><strong>通信记录：</strong>客服沟通、反馈意见、技术支持请求</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              1.2 自动收集的信息
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>设备信息：</strong>设备类型、操作系统、浏览器类型和版本</li>
              <li><strong>日志信息：</strong>IP 地址、访问时间、访问页面、点击链接、引用来源</li>
              <li><strong>使用数据：</strong>功能使用情况、API 调用频率、错误报告</li>
              <li><strong>Cookie 信息：</strong>会话标识、用户偏好设置、身份验证令牌</li>
              <li><strong>性能数据：</strong>响应时间、错误率、服务可用性指标</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              2. 信息使用目的
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们收集和使用您的信息用于以下目的：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>服务提供：</strong>创建和管理账户、处理 API 请求、提供技术支持</li>
              <li><strong>服务改进：</strong>分析使用模式、优化性能、开发新功能</li>
              <li><strong>安全保障：</strong>防止欺诈、检测异常活动、保护系统安全</li>
              <li><strong>账单处理：</strong>处理付款、发送账单、管理订阅</li>
              <li><strong>通信联络：</strong>发送服务通知、技术更新、营销信息（可退订）</li>
              <li><strong>法律合规：</strong>遵守法律要求、响应法律程序、保护合法权益</li>
              <li><strong>数据分析：</strong>生成汇总统计数据、进行市场研究（匿名化处理）</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              3. 信息共享与披露
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              3.1 我们不会出售您的个人信息
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              我们承诺永远不会出售、出租或以其他方式商业化您的个人信息。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              3.2 信息共享情形
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们仅在以下情况下共享您的信息：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>服务提供商：</strong>与帮助我们运营的第三方服务商共享（如支付处理、邮件发送、云存储）</li>
              <li><strong>法律要求：</strong>应法院命令、法律程序或政府要求进行披露</li>
              <li><strong>安全保护：</strong>为防止欺诈、保护用户安全或调查违规行为</li>
              <li><strong>用户同意：</strong>在获得您明确同意的情况下</li>
              <li><strong>业务转让：</strong>在合并、收购或资产出售时转移（会提前通知）</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              4. 数据安全措施
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们采用业界标准的安全措施保护您的信息：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>加密传输：</strong>使用 SSL/TLS 加密所有数据传输</li>
              <li><strong>加密存储：</strong>敏感信息采用加密存储（如密码使用 bcrypt）</li>
              <li><strong>访问控制：</strong>严格的内部访问权限管理和审计</li>
              <li><strong>安全审计：</strong>定期进行安全评估和漏洞扫描</li>
              <li><strong>数据备份：</strong>定期备份数据以防止数据丢失</li>
              <li><strong>事件响应：</strong>建立数据泄露应急响应机制</li>
              <li><strong>员工培训：</strong>对员工进行数据保护和隐私培训</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              5. 数据存储与保留
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              5.1 存储位置
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              您的数据主要存储在符合安全标准的云服务器上。部分服务可能涉及跨境数据传输，我们会确保符合相关法律要求。
            </p>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              5.2 保留期限
            </h5>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>账户信息：</strong>在账户有效期内及注销后法律要求的最短期限</li>
              <li><strong>交易记录：</strong>根据财务和税务要求保留（通常为7年）</li>
              <li><strong>API 日志：</strong>保留90天用于故障排查和安全分析</li>
              <li><strong>营销数据：</strong>直到您取消订阅或要求删除</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              6. Cookie 和跟踪技术
            </h3>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              6.1 Cookie 使用
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们使用以下类型的 Cookie：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>必要 Cookie：</strong>维持网站基本功能和安全性</li>
              <li><strong>功能 Cookie：</strong>记住您的偏好设置</li>
              <li><strong>分析 Cookie：</strong>了解网站使用情况（可选）</li>
              <li><strong>营销 Cookie：</strong>提供相关广告（可选）</li>
            </ul>

            <h5 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
              6.2 管理 Cookie
            </h5>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              您可以通过浏览器设置管理或删除 Cookie，但这可能影响某些功能的使用。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              7. 用户权利
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              根据适用法律，您享有以下权利：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>访问权：</strong>查看我们持有的您的个人信息</li>
              <li><strong>更正权：</strong>更正不准确或不完整的信息</li>
              <li><strong>删除权：</strong>要求删除您的个人信息（受法律限制）</li>
              <li><strong>限制处理权：</strong>限制我们处理您的信息</li>
              <li><strong>数据可携权：</strong>获取您的数据副本</li>
              <li><strong>反对权：</strong>反对某些类型的信息处理</li>
              <li><strong>撤回同意：</strong>撤回之前给予的同意</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              行使这些权利，请通过 {config.contact_email} 联系我们。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              8. 儿童隐私保护
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              我们的服务不面向18岁以下的未成年人。如果我们发现误收集了儿童的个人信息，将立即删除相关信息。如果您认为我们可能持有儿童的信息，请立即联系我们。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              9. 第三方链接和服务
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              我们的服务可能包含第三方网站或服务的链接。我们不对第三方的隐私实践负责，建议您查看其隐私政策。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              10. 国际数据传输
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              使用我们的服务可能涉及将您的信息传输到其他国家。我们会采取适当的保护措施，确保跨境传输符合适用的数据保护法律。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              11. 隐私政策更新
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们可能定期更新本隐私政策。重大变更时，我们会通过以下方式通知您：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>在网站上发布显著通知</li>
              <li>向您的注册邮箱发送通知</li>
              <li>在您下次登录时要求确认</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              继续使用服务即表示您接受更新后的隐私政策。
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              12. 数据泄露通知
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              如发生可能影响您个人信息安全的数据泄露事件，我们将：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>在72小时内通过邮件通知受影响用户</li>
              <li>在网站上发布事件说明</li>
              <li>采取补救措施减少影响</li>
              <li>配合相关部门的调查</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              13. 合规承诺
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              我们承诺遵守以下数据保护法规：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>《中华人民共和国个人信息保护法》</li>
              <li>《中华人民共和国网络安全法》</li>
              <li>《中华人民共和国数据安全法》</li>
              <li>欧盟《通用数据保护条例》(GDPR)（适用于欧盟用户）</li>
              <li>美国《加州消费者隐私法》(CCPA)（适用于加州用户）</li>
              <li>其他适用的国际数据保护法规</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              14. 联系我们
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              如您对本隐私政策有任何疑问、意见或请求，请通过以下方式联系我们：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>电子邮件：</strong>{config.contact_email}</li>
              <li><strong>联系页面：</strong><Link href="/contact" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">联系我们</Link></li>
              <li><strong>响应时间：</strong>我们将在收到请求后的30天内回复</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              15. 生效与同意
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              本隐私政策自2025年9月22日起生效。使用我们的服务即表示您已阅读、理解并同意本隐私政策的所有条款。如不同意，请停止使用我们的服务。
            </p>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6 mt-8">
              <p className="text-green-800 dark:text-green-200 text-sm">
                <strong>隐私承诺：</strong>我们承诺保护您的隐私权益，采用最高标准的安全措施保护您的个人信息。您的信任对我们至关重要。
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}