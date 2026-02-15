import { Empty, Select, Space, Tooltip, Card, Row, Col, Statistic } from 'antd';
import { EyeOutlined, LikeOutlined, StarOutlined, CalendarOutlined } from '@ant-design/icons';
import { PlayHeatmapData } from '@/lib/api/analytics';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';

interface PlayHeatmapProps {
  data: PlayHeatmapData;
}

const HEATMAP_COLORS = [
  { level: 0, color: '#EBEDF0', label: '无数据' },
  { level: 1, color: '#9BE9A8', label: '低' },
  { level: 2, color: '#40C463', label: '中低' },
  { level: 3, color: '#30A14E', label: '中高' },
  { level: 4, color: '#216E39', label: '高' }
];

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PlayHeatmap({ data }: PlayHeatmapProps) {
  const [metric, setMetric] = useState<'playCount' | 'likeCount' | 'favoriteCount'>('playCount');
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  const { heatmapData, summaryStats, availableYears } = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { heatmapData: [], summaryStats: null, availableYears: [] };
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
        const maxValue = Math.max(...Array.from(dateMap.values()));
        const normalizedValue = value / maxValue;
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

    return { heatmapData, summaryStats, availableYears: years };
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

  const renderHeatmap = () => {
    const yearData = heatmapData.filter(d => dayjs(d.date).year() === selectedYear);
    
    const months = Array.from({ length: 12 }, (_, i) => dayjs(`${selectedYear}-${String(i + 1).padStart(2, '0')}-01`));
    
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
              const color = HEATMAP_COLORS[level].color;
              
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
                    style={{
                      aspectRatio: '1',
                      borderRadius: 2,
                      backgroundColor: color,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                      e.currentTarget.style.zIndex = '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = '1';
                    }}
                  />
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
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

        <div style={{ fontSize: 12, color: '#999' }}>
          <CalendarOutlined /> {selectedYear}年月度热力图
        </div>
      </div>

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
                background: level.color,
                border: '1px solid rgba(0,0,0,0.1)'
              }} />
              <span style={{ fontSize: 12, color: '#666' }}>{level.label}</span>
            </div>
          ))}
        </Space>
      </div>
    </div>
  );
}
