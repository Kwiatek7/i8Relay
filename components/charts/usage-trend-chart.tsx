"use client";

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';

interface UsageTrendData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreated: number;
  cacheRead: number;
  totalTokens: number;
  requests: number;
  cost: number;
}

interface UsageTrendChartProps {
  data: UsageTrendData[];
  className?: string;
}

// 格式化数字显示
const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export function UsageTrendChart({ data, className = "" }: UsageTrendChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-lg font-medium">暂无数据</div>
          <div className="text-sm mt-2">请稍后再试</div>
        </div>
      </div>
    );
  }

  // 数据准备
  const dates = data.map(item => item.date);
  const inputTokens = data.map(item => item.inputTokens);
  const outputTokens = data.map(item => item.outputTokens);
  const cacheCreated = data.map(item => item.cacheCreated);
  const cacheRead = data.map(item => item.cacheRead);
  const costs = data.map(item => item.cost);
  const requests = data.map(item => item.requests);

  // ECharts 配置
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: isDark ? '#9ca3af' : '#6b7280'
        }
      },
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#4b5563' : '#e5e7eb',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151'
      },
      formatter: function(params: any) {
        const dataIndex = params[0].dataIndex;
        const item = data[dataIndex];
        return `
          <div style="font-weight: bold; margin-bottom: 8px;">${item.date}</div>
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: #3b82f6; border-radius: 50%; margin-right: 8px;"></span>
            输入: <strong>${item.inputTokens.toLocaleString()}</strong>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; margin-right: 8px;"></span>
            输出: <strong>${item.outputTokens.toLocaleString()}</strong>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: #f59e0b; border-radius: 50%; margin-right: 8px;"></span>
            缓存创建: <strong>${item.cacheCreated.toLocaleString()}</strong>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: #8b5cf6; border-radius: 50%; margin-right: 8px;"></span>
            缓存读取: <strong>${item.cacheRead.toLocaleString()}</strong>
          </div>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid ${isDark ? '#4b5563' : '#e5e7eb'};">
          <div style="margin-bottom: 4px;">费用: <strong>$${item.cost.toFixed(4)}</strong></div>
          <div>请求: <strong>${item.requests.toLocaleString()}</strong></div>
        `;
      }
    },
    legend: {
      data: ['输入', '输出', '缓存创建', '缓存读取', '费用'],
      top: '5%',
      textStyle: {
        color: isDark ? '#9ca3af' : '#6b7280'
      }
    },
    grid: {
      top: '15%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow'
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#4b5563' : '#d1d5db'
          }
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 12
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Tokens',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#4b5563' : '#d1d5db'
          }
        },
        axisLabel: {
          formatter: formatNumber,
          color: isDark ? '#9ca3af' : '#6b7280'
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6'
          }
        }
      },
      {
        type: 'value',
        name: '费用 ($)',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#ef4444'
          }
        },
        axisLabel: {
          formatter: '${value}',
          color: '#ef4444'
        }
      }
    ],
    series: [
      {
        name: '缓存读取',
        type: 'bar',
        stack: 'tokens',
        emphasis: {
          focus: 'series'
        },
        data: cacheRead,
        itemStyle: {
          color: '#8b5cf6',
          borderRadius: [0, 0, 4, 4]
        }
      },
      {
        name: '缓存创建',
        type: 'bar',
        stack: 'tokens',
        emphasis: {
          focus: 'series'
        },
        data: cacheCreated,
        itemStyle: {
          color: '#f59e0b'
        }
      },
      {
        name: '输出',
        type: 'bar',
        stack: 'tokens',
        emphasis: {
          focus: 'series'
        },
        data: outputTokens,
        itemStyle: {
          color: '#10b981'
        }
      },
      {
        name: '输入',
        type: 'bar',
        stack: 'tokens',
        emphasis: {
          focus: 'series'
        },
        data: inputTokens,
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '费用',
        type: 'line',
        yAxisIndex: 1,
        data: costs,
        lineStyle: {
          color: '#ef4444',
          width: 3
        },
        itemStyle: {
          color: '#ef4444',
          borderWidth: 3,
          borderColor: '#ffffff'
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 5,
            shadowBlur: 10,
            shadowColor: 'rgba(239, 68, 68, 0.6)'
          }
        },
        smooth: true
      }
    ]
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactECharts
        option={option}
        style={{
          height: '380px',
          width: '100%'
        }}
        opts={{
          renderer: 'canvas'
        }}
      />

      {/* 自定义图例 */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="w-4 h-4 bg-[#3b82f6] rounded shadow-sm" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">输入</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="w-4 h-4 bg-[#10b981] rounded shadow-sm" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">输出</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="w-4 h-4 bg-[#f59e0b] rounded shadow-sm" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">缓存创建</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="w-4 h-4 bg-[#8b5cf6] rounded shadow-sm" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">缓存读取</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="w-4 h-1 bg-[#ef4444] rounded-full shadow-sm" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">费用</span>
        </div>
      </div>
    </div>
  );
}