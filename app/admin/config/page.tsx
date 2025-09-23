'use client';

import { useEffect, useState } from 'react';
import { useConfig } from '../../../lib/providers/config-provider';

interface SiteConfig {
  site_name: string;
  site_name_split_index?: number;
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_logo: string;
  primary_color: string;
  secondary_color: string;
  contact_email: string;
  company_address: string;
  footer_text: string;
  enable_registration: boolean;

  // SMTP邮件配置
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  contact_form_email: string;
}

export default function AdminConfig() {
  const { config: globalConfig, refreshConfig } = useConfig();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
      } else {
        console.error('API返回错误:', response.status, response.statusText);
        setMessage('获取配置失败');
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      setMessage('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMessage('配置保存成功');
        // 刷新全局配置
        await refreshConfig();
        // 刷新页面以应用更改
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error?.message || '保存失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SiteConfig, value: string | boolean | number) => {
    if (!config) return;
    setConfig({
      ...config,
      [field]: value,
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/6 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-red-600">配置加载失败</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">网站配置</h1>
        <p className="text-gray-600">管理网站的基本设置和外观</p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-md ${message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="space-y-6">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    网站名称
                  </label>
                  <input
                    type="text"
                    value={config.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入网站名称"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    预览效果: {
                      config.site_name_split_index && config.site_name_split_index > 0 && config.site_name_split_index < config.site_name.length ? (
                        <>
                          <span>{config.site_name.substring(0, config.site_name_split_index)}</span>
                          <span className="text-blue-600">{config.site_name.substring(config.site_name_split_index)}</span>
                        </>
                      ) : config.site_name
                    }
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    网站名称分割点 (可选)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={config.site_name.length}
                    value={config.site_name_split_index || ''}
                    onChange={(e) => handleChange('site_name_split_index', e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入分割位置索引"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    指定网站名称的分割点位置，用于前台显示时的颜色效果。例如 "i7Relay" 输入 2 会分割成 "i7" 和 "Relay"
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    网站标题
                  </label>
                  <input
                    type="text"
                    value={config.site_title}
                    onChange={(e) => handleChange('site_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入网站标题"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    网站描述
                  </label>
                  <textarea
                    value={config.site_description}
                    onChange={(e) => handleChange('site_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入网站描述"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    关键词
                  </label>
                  <input
                    type="text"
                    value={config.site_keywords}
                    onChange={(e) => handleChange('site_keywords', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="用逗号分隔"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    网站Logo URL
                  </label>
                  <input
                    type="url"
                    value={config.site_logo}
                    onChange={(e) => handleChange('site_logo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* 外观设置 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">外观设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    主色调
                  </label>
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    辅助色调
                  </label>
                  <input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 联系信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">联系信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系邮箱
                  </label>
                  <input
                    type="email"
                    value={config.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公司地址
                  </label>
                  <input
                    type="text"
                    value={config.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入公司地址"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    页脚文本
                  </label>
                  <input
                    type="text"
                    value={config.footer_text}
                    onChange={(e) => handleChange('footer_text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="版权信息等"
                  />
                </div>
              </div>
            </div>

            {/* 功能设置 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">功能设置</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable_registration"
                    checked={config.enable_registration}
                    onChange={(e) => handleChange('enable_registration', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enable_registration" className="ml-2 text-sm font-medium text-gray-700">
                    开放用户注册
                  </label>
                </div>
              </div>
            </div>

            {/* SMTP邮件配置 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">邮件配置</h3>
              <div className="space-y-4">
                {/* SMTP开关 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smtp_enabled"
                    checked={config.smtp_enabled}
                    onChange={(e) => handleChange('smtp_enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="smtp_enabled" className="ml-2 text-sm font-medium text-gray-700">
                    启用SMTP邮件服务
                  </label>
                </div>

                {/* SMTP配置详情 */}
                {config.smtp_enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP服务器
                        </label>
                        <input
                          type="text"
                          value={config.smtp_host}
                          onChange={(e) => handleChange('smtp_host', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP端口
                        </label>
                        <input
                          type="number"
                          value={config.smtp_port}
                          onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="587"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP用户名
                        </label>
                        <input
                          type="text"
                          value={config.smtp_user}
                          onChange={(e) => handleChange('smtp_user', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="your-email@gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP密码
                        </label>
                        <input
                          type="password"
                          value={config.smtp_password}
                          onChange={(e) => handleChange('smtp_password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="应用专用密码或授权码"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          联系表单接收邮箱
                        </label>
                        <input
                          type="email"
                          value={config.contact_form_email}
                          onChange={(e) => handleChange('contact_form_email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="contact@example.com"
                        />
                        <p className="mt-1 text-xs text-gray-500">留空则使用SMTP用户名作为接收邮箱</p>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="smtp_secure"
                          checked={config.smtp_secure}
                          onChange={(e) => handleChange('smtp_secure', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="smtp_secure" className="ml-2 text-sm font-medium text-gray-700">
                          使用SSL/TLS加密（端口465）
                        </label>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">配置提示</h4>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Gmail: 使用应用专用密码，需先开启两步验证</li>
                              <li>QQ邮箱: 开启SMTP服务并获取授权码</li>
                              <li>一般端口：587（STARTTLS）或 465（SSL）</li>
                              <li>配置保存后，联系表单将使用此SMTP设置发送邮件</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* 保存按钮 */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}