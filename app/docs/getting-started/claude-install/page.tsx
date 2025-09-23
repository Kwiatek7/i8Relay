import React from 'react';
import { Copy, CheckCircle, AlertCircle, Terminal } from 'lucide-react';

export default function ClaudeInstallPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Claude Code 安装
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          在 VS Code 中安装 Claude Code 并通过 CTOK 配置为 OpenAI 兼容接口，快速上手团队内网或自建中转。
        </p>
      </div>

      {/* 安装 Node.js 章节 */}
      <div className="mb-12" id="install-nodejs">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Terminal className="h-6 w-6 mr-2 text-blue-600" />
          安装 Node.js (已安装可跳过)
        </h2>

        {/* Ubuntu/Debian 用户 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            # Ubuntu / Debian 用户
          </h3>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm">bash</span>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="text-green-300 space-y-1">
              <div>curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash</div>
              <div>sudo apt-get install -y nodejs</div>
              <div>node --version</div>
            </div>
          </div>
        </div>

        {/* macOS 用户 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            # macOS 用户
          </h3>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm">bash</span>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="text-green-300 space-y-1">
              <div>sudo xcode-select --install</div>
              <div>/bin/bash -c "$(curl -fsSL</div>
              <div>https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"</div>
              <div>brew install node</div>
              <div>node --version</div>
            </div>
          </div>
        </div>

        {/* 提示框 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>确保 Node.js 版本 ≥ 18.0</strong>
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                建议：如果你之前装过老版本的Node可能存在代码工具，白用版一个入口问题导致某些，建议重新用另一个入口再导致更多。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 如果安装其他的中转客户端cli */}
      <div className="mb-12" id="install-cli">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          如果安装其他的 中转客户端cli 记得先卸载 （可选）
        </h2>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-lg">
              1
            </span>
            <span className="ml-3">第一步：检查安装位置</span>
          </h3>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              首先检查是否已经安装了其他CLI工具，避免冲突：
            </p>

            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 text-sm">bash</span>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="text-green-300 space-y-1">
                <div># 检查现有安装</div>
                <div>which claude-cli</div>
                <div>which openai-cli</div>
                <div>npm list -g | grep -E "(claude|openai|ai)"</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>重要提示</strong>
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  如果发现已安装其他AI CLI工具，建议先卸载以避免命令冲突和配置问题。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 安装 Claude Code */}
      <div className="mb-12" id="install-claude-code">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          安装 Claude Code
        </h2>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              方式一：通过 VS Code 扩展市场安装（推荐）
            </h3>

            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-3 mt-0.5">1</span>
                <span>打开 VS Code</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-3 mt-0.5">2</span>
                <span>点击左侧扩展图标或按 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Ctrl+Shift+X</code></span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-3 mt-0.5">3</span>
                <span>搜索 "Claude Code" 并点击安装</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-3 mt-0.5">4</span>
                <span>重启 VS Code 使扩展生效</span>
              </li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              方式二：手动安装
            </h3>

            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 text-sm">bash</span>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="text-green-300 space-y-1">
                <div># 全局安装 Claude Code CLI</div>
                <div>npm install -g claude-code</div>
                <div></div>
                <div># 验证安装</div>
                <div>claude-code --version</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 配置 API 密钥 */}
      <div className="mb-12" id="configure-api">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          配置 API 密钥
        </h2>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                <strong>恭喜！</strong> 您已成功安装 Claude Code
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                接下来请按照配置指南设置您的 API 密钥和服务端点，即可开始使用强大的 AI 编程助手功能。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/docs/getting-started/configuration"
            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">配置指南</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              学习如何配置API密钥和服务端点
            </p>
          </a>

          <a
            href="/docs/getting-started/features"
            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">功能指南</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              了解 Claude Code 的强大功能
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}