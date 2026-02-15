'use client';

import { Empty, Select, Space, Tooltip, Card, Row, Col, Statistic, Button, Slider, Switch, Radio } from 'antd';
import { 
  EyeOutlined, 
  LikeOutlined, 
  StarOutlined, 
  CalendarOutlined,
  DownloadOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { PlayHeatmapData } from '@/lib/api/analytics';
import { useMemo, useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';

interface PlayHeatmapProps {
  data: PlayHeatmapData;
  onDateClick?: (date: string) => void;
}

const HEATMAP_COLORS = [
  { level: 0, color: '#EBEDF0', label: '无数据' },
  { level: 1, color: '#9BE9A8', label: '低' },
  { level: 2, color: '#40C463', label: '中低' },
  { level: 3, color: '#30A14E', label: '中高' },
  { level: 4, color: '#216E39', label: '高' }
];

const HEATMAP_THEMES = {
  green: ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39'],
  blue: ['#EBEDF0', '#91D5FF', '#40A9FF', '#1890FF', '#0050B3'],
  purple: ['#EBEDF0', '#D3ADF7', '#85A5FF', '#597EF7', '#2F54EB'],
  orange: ['#EBEDF0', '#FFD591', '#FFC069', '#FFA940', '#FF7A45']
};

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PlayHeatmap({ data, onDateClick }: PlayHeatmapProps) {
  const [metric, setMetric] = useState<'playCount' | 'likeCount' | 'favoriteCount'>('playCount');
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [theme, setTheme] = useState<keyof typeof HEATMAP_THEMES>('green');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cellSize, setCellSize] = useState(14);
  const [showLabels, setShowLabels] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { heatmapData, summaryStats, availableYears, maxValue } = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { 
        heatmapData: [], 
        summaryStats: null, 
        availableYears: [],
        maxValue: 0
      };
    }

    const dateMap = new Map<string, number>();

    data.data.forEach(item => {
      const value = metric === 'playCount' ? item.playCount : 
                   metric === 'likeCount' ? (item as any).likeCount || 0 : 
                   (item as any).favoriteCount || 0;
      const current = dateMap.get(item.month) || 0;
      dateMap.set(item.month, current + value);
    });

    const years = Array.from(new Set(Array.from(dateMap.keys()).map(date => dayjs(date).year()))).sort((a, b) => b - a);

    const heatmapData: Array<{ date: string; value: number; level: number }> = [];
    
    const startDate = dayjs(`${selectedYear}-01-01`);
    const endDate = dayjs(`${selectedYear}-12-31`);
    
    let currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM');
      const value = dateMap.get(dateStr) || 0;
      
      let level = 0;
      if (value > 0) {
        const maxVal = Math.max(...Array.from(dateMap.values()));
        const normalizedValue = value / maxVal;
        if (normalizedValue <= 0.25) level = 1;
        else if (normalizedValue <= 0.5) level = 2;
        else if (normalizedValue <= 0.75) level = 3;
        else level = 4;
      }
      
      heatmapData.push({
        date: dateStr,
        value,
        level
      });
      
      currentDate = currentDate.add(1, 'month');
    }

    const yearData = heatmapData.filter(d => dayjs(d.date).year() === selectedYear);
    const totalPlayCount = yearData.reduce((sum, d) => sum + d.value, 0);
    const avgPlayCount = yearData.length > 0 ? totalPlayCount / yearData.length : 0;
    const maxPlayCount = Math.max(...yearData.map(d => d.value), 0);
    const activeMonths = yearData.filter(d => d.value > 0).length;

    const summaryStats = {
      totalPlayCount,
      avgPlayCount,
      maxPlayCount,
      activeMonths,
      totalMonths: 12
    };

    return { 
      heatmapData, 
      summaryStats, 
      availableYears: years,
      maxValue: maxPlayCount
    };
  }, [data, metric, selectedYear]);

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'playCount':
        return '播放量';
      case 'likeCount':
        return '点赞量';
      case 'favoriteCount':
        return '收藏量';
      default:
        return '播放量';
    }
  };

  const getMetricIcon = () => {
    switch (metric) {
      case 'playCount':
        return <EyeOutlined />;
      case 'likeCount':
        return <LikeOutlined />;
      case 'favoriteCount':
        return <StarOutlined />;
      default:
        return <EyeOutlined />;
    }
  };

  const handleExport = useCallback(() => {
    const csvContent = [
      ['月份', getMetricLabel(), '等级'].join(','),
      ...heatmapData.map(d => [
        d.date,
        d.value,
        HEATMAP_COLORS[d.level].label
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `热力图_${selectedYear}.csv`;
    link.click();
  }, [heatmapData, selectedYear]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: 200
      }}>
        <div style={{ 
          fontWeight: 600, 
          marginBottom: 8, 
          fontSize: 13,
          color: '#1A1A1A'
        }}>
          {label}
        </div>
        {payload.map((entry: any) => (
          <div 
            key={entry.name}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
              fontSize: 12
            }}
          >
            <span style={{ color: '#666' }}>
              {entry.name}
            </span>
            <span style={{ 
              fontWeight: 600, 
              color: '#1A1A1A'
            }}>
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderHeatmap = () => {
    const yearData = heatmapData.filter(d => dayjs(d.date).year() === selectedYear);
    
    const months = Array.from({ length: 12 }, (_, i) => dayjs(`${selectedYear}-${String(i + 1).padStart(2, '0')}-01`));
    
    const colors = HEATMAP_THEMES[theme];

    return (
      <div style={{ padding: '20px 0' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          <div style={{ width: 40, textAlign: 'right', fontSize: 12, color: '#666', paddingTop: 8 }}>
            月份
          </div>
          <div style={{ flex: 1 }}>
            {months.map(month => (
              <div 
                key={month.format('MM')} 
                style={{ 
                  display: 'inline-block', 
                  width: '7.6%', 
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 4
                }}
              >
                {month.format('MM')}
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 40, textAlign: 'right', fontSize: 12, color: '#666', paddingTop: 8 }}>
            {selectedYear}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
            {months.map(month => {
              const monthStr = month.format('YYYY-MM');
              const dataPoint = yearData.find(d => d.date === monthStr);
              const level = dataPoint?.level || 0;
              const value = dataPoint?.value || 0;
              const color = colors[level];
              
              return (
                <Tooltip 
                  key={monthStr}
                  title={
                    <div>
                      <div>{month.format('YYYY年MM月')}</div>
                      <div>{getMetricLabel()}: {formatValue(value)}</div>
                    </div>
                  }
                >
                  <div 
                    onClick={() => onDateClick?.(monthStr)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 2,
                      backgroundColor: color,
                      cursor: onDateClick ? 'pointer' : 'default',
                      transition: animationEnabled ? 'all 0.3s ease' : 'none',
                      border: '1px solid rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: cellSize > 12 ? 10 : 8,
                      color: level > 2 ? '#fff' : '#666',
                      fontWeight: level > 2 ? 600 : 400
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                      e.currentTarget.style.zIndex = '10';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = '1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {showLabels && value > 0 && cellSize > 12 && formatValue(value)}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="暂无数据" />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        flexWrap: 'wrap', 
        gap: 12 
      }}>
        <Space>
          <Select
            value={metric}
            onChange={setMetric}
            style={{ width: 120 }}
            size="small"
          >
            <Select.Option value="playCount">
              <EyeOutlined /> 播放量
            </Select.Option>
            <Select.Option value="likeCount">
              <LikeOutlined /> 点赞量
            </Select.Option>
            <Select.Option value="favoriteCount">
              <StarOutlined /> 收藏量
            </Select.Option>
          </Select>
          
          {availableYears.length > 0 && (
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 100 }}
              size="small"
            >
              {availableYears.map(year => (
                <Select.Option key={year} value={year}>{year}年</Select.Option>
              ))}
            </Select>
          )}
        </Space>

        <Space>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出
          </Button>
          <Button 
            size="small" 
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
          <Button 
            size="small" 
            icon={<SettingOutlined />}
            onClick={() => setShowSettings(!showSettings)}
          />
        </Space>
      </div>

      {showSettings && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                主题颜色
              </div>
              <Radio.Group 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                style={{ width: '100%' }}
              >
                <Radio.Button value="green">绿色</Radio.Button>
                <Radio.Button value="blue">蓝色</Radio.Button>
                <Radio.Button value="purple">紫色</Radio.Button>
                <Radio.Button value="orange">橙色</Radio.Button>
              </Radio.Group>
            </div>
            
            <div>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                单元格大小: {cellSize}px
              </div>
              <Slider
                min={10}
                max={24}
                value={cellSize}
                onChange={setCellSize}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13 }}>显示数值</span>
              <Switch checked={showLabels} onChange={setShowLabels} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13 }}>启用动画</span>
              <Switch checked={animationEnabled} onChange={setAnimationEnabled} />
            </div>
          </Space>
        </Card>
      )}

      {summaryStats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title={getMetricLabel()}
                value={formatValue(summaryStats.totalPlayCount)}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1890FF' }}
                prefix={getMetricIcon()}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="月均"
                value={formatValue(summaryStats.avgPlayCount)}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#52C41A' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="最高"
                value={formatValue(summaryStats.maxPlayCount)}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#F59E0B' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="活跃月数"
                value={`${summaryStats.activeMonths}/${summaryStats.totalMonths}`}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#8B5CF6' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card size="small" style={{ background: '#FFFFFF', border: '1px solid #E8E8E8' }}>
        {renderHeatmap()}
      </Card>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Space size="small">
          <span style={{ fontSize: 12, color: '#999' }}>图例:</span>
          {HEATMAP_COLORS.map((level) => (
            <div key={level.level} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ 
                width: 14, 
                height: 14, 
                borderRadius: 2,
                background: HEATMAP_THEMES[theme][level.level],
                border: '1px solid rgba(0,0,0,0.1)'
              }} />
              <span style={{ fontSize: 12, color: '#666' }}>{level.label}</span>
            </div>
          ))}
        </Space>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#999', textAlign: 'center' }}>
        <CalendarOutlined /> {selectedYear}年月度热力图 · 点击单元格查看详情
      </div>
    </div>
  );
}
