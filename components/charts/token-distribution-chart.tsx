"use client";

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';

interface TokenData {
  name: string;
  value: number;
  color: string;
}

interface TokenDistributionChartProps {
  data: TokenData[];
  className?: string;
}

export function TokenDistributionChart({ data, className = "" }: TokenDistributionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 计算总数
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-32 h-32 border-8 border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm">暂无数据</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 转换数据格式为 ECharts 所需
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    itemStyle: {
      color: item.color
    }
  }));

  // ECharts 配置
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const percentage = params.percent.toFixed(1);
        return `
          <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${params.color}; border-radius: 50%; margin-right: 8px;"></span>
            数量: <strong>${params.value.toLocaleString()}</strong>
          </div>
          <div>占比: <strong>${percentage}%</strong></div>
        `;
      },
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#4b5563' : '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151'
      },
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
    },
    legend: {
      show: false
    },
    series: [
      {
        name: 'Token分布',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 12,
          borderColor: isDark ? '#1f2937' : '#ffffff',
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 12,
          color: isDark ? '#d1d5db' : '#4b5563',
          fontWeight: 'bold',
          lineHeight: 16
        },
        labelLine: {
          show: true,
          length: 20,
          length2: 10,
          lineStyle: {
            color: isDark ? '#6b7280' : '#9ca3af',
            width: 2
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            borderWidth: 4,
            scale: true,
            scaleSize: 5
          },
          label: {
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        animationType: 'expansion',
        animationEasing: 'elasticOut',
        animationDuration: 1000,
        data: chartData
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: {
          text: total.toLocaleString(),
          fontSize: 28,
          fontWeight: 'bold',
          fill: isDark ? '#f9fafb' : '#111827'
        }
      },
      {
        type: 'text',
        left: 'center',
        top: '48%',
        style: {
          text: '总 Token',
          fontSize: 14,
          fill: isDark ? '#9ca3af' : '#6b7280'
        }
      }
    ]
  };

  return (
    <div className={`w-full h-full flex flex-col items-center ${className}`}>
      <ReactECharts
        option={option}
        style={{
          height: '400px',
          width: '100%'
        }}
        opts={{
          renderer: 'canvas'
        }}
      />

      {/* 自定义图例 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600/50">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
                {item.name}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {((item.value / total) * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}