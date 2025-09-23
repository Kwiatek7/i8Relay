"use client";

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';

interface MiniTrendData {
  time: string;
  value: number;
}

interface MiniTrendChartProps {
  data: MiniTrendData[];
  color?: string;
  className?: string;
}

export function MiniTrendChart({
  data,
  color = "#3b82f6",
  className = ""
}: MiniTrendChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          暂无数据
        </div>
      </div>
    );
  }

  // 准备数据
  const times = data.map(item => item.time);
  const values = data.map(item => item.value);

  // ECharts 配置 - 专为迷你图表优化
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#4b5563' : '#e5e7eb',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151',
        fontSize: 12
      },
      formatter: function(params: any) {
        const item = params[0];
        return `
          <div style="font-weight: bold; margin-bottom: 4px;">${item.axisValue}</div>
          <div>${item.value.toLocaleString()} tokens</div>
        `;
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: color + '20'
        }
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '10%',
      bottom: '25%',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: true,
        color: isDark ? '#6b7280' : '#9ca3af',
        fontSize: 10,
        interval: 0,
        rotate: 0
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false
      },
      splitLine: {
        show: false
      }
    },
    series: [
      {
        data: values,
        type: 'bar',
        itemStyle: {
          color: color,
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: color,
            shadowBlur: 10,
            shadowColor: color + '40'
          }
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'elasticOut',
        barWidth: '60%'
      }
    ]
  };

  return (
    <div className={`w-full h-full relative ${className}`}>
      <ReactECharts
        option={option}
        style={{
          height: '100%',
          width: '100%',
          minHeight: '120px'
        }}
        opts={{
          renderer: 'canvas'
        }}
      />
    </div>
  );
}