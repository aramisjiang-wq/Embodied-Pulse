'use client';

import { Empty, Select, Space, Tooltip, Checkbox, Card, Row, Col, Statistic, Button, Slider } from 'antd';
import { 
  LineChartOutlined, 
  BarChartOutlined, 
  AreaChartOutlined,
  CalendarOutlined, 
  VideoCameraOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  DownloadOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { PublishTrendData } from '@/lib/api/analytics';
import { useMemo, useState, useRef, useCallback } from 'react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, Brush, ReferenceLine,
  Area, AreaChart
} from 'recharts';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
dayjs.extend(weekday);

interface PublishTrendChartProps {
  data: PublishTrendData;
  onUploaderClick?: (uploaderId: string) => void;
}

const PRIMARY_COLOR = '#1890FF';
const SECONDARY_COLOR = '#52C41A';
const ACCENT_COLOR = '#FAAD14';

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const COLORS = [
  '#1890FF',
  '#52C41A',
  '#FAAD14',
  '#F5222D',
  '#722ED1',
  '#EB2F96',
  '#13C2C2',
  '#FA8C16',
  '#2F54EB',
  '#FA541C'
];

const CHART_TYPES = ['line', 'bar', 'area'] as const;

export function PublishTrendChart({ data, onUploaderClick }: PublishTrendChartProps) {
  const [chartType, setChartType] = useState<typeof CHART_TYPES[number]>('line');
  const [showIndividual, setShowIndividual] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [showAverage, setShowAverage] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { chartData, uploaderNames, uploaderIds, availableYears, summaryStats, averageData } = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { 
        chartData: [], 
        uploaderNames: [], 
        uploaderIds: [], 
        availableYears: [], 
        summaryStats: null,
        averageData: []
      };
    }

    const uploaderMap = new Map<string, string>();
    const weekMap = new Map<string, Map<string, number>>();

    data.data.forEach(item => {
      uploaderMap.set(item.uploaderId, item.uploaderName);
      
      const date = dayjs(item.period);
      const weekKey = `${date.year()}-W${date.week()}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, new Map());
      }
      
      const weekdayMap = weekMap.get(weekKey)!;
      const current = weekdayMap.get(item.uploaderId) || 0;
      weekdayMap.set(item.uploaderId, current + item.videoCount);
    });

    const years = Array.from(new Set(data.data.map(item => dayjs(item.period).year()))).sort((a, b) => b - a);

    const weeks = Array.from(weekMap.keys())
      .filter(key => key.startsWith(`${selectedYear}-`))
      .sort();

    const uploaderIds = Array.from(uploaderMap.keys());
    const uploaderNames = Array.from(uploaderMap.values());

    const chartData = weeks.map(weekKey => {
      const weekData: any = { week: weekKey };
      
      uploaderIds.forEach(uploaderId => {
        weekData[uploaderId] = weekMap.get(weekKey)?.get(uploaderId) || 0;
      });
      
      weekData.total = Array.from(weekMap.get(weekKey)!.values()).reduce((sum, count) => sum + count, 0);
      
      return weekData;
    });

    const averageData = chartData.map(d => ({
      week: d.week,
      average: d.total / uploaderIds.length
    }));

    const yearData = data.data.filter(item => dayjs(item.period).year() === selectedYear);
    const totalVideos = yearData.reduce((sum, item) => sum + item.videoCount, 0);
    const avgWeeklyVideos = weeks.length > 0 ? totalVideos / weeks.length : 0;
    const maxWeeklyVideos = Math.max(...chartData.map(d => d.total), 0);
    const activeWeeks = chartData.filter(d => d.total > 0).length;
    const totalWeeks = weeks.length;

    const summaryStats = {
      totalVideos,
      avgWeeklyVideos,
      maxWeeklyVideos,
      activeWeeks,
      totalWeeks
    };

    return { 
      chartData, 
      uploaderNames, 
      uploaderIds, 
      availableYears: years, 
      summaryStats,
      averageData
    };
  }, [data, selectedYear]);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['周', ...uploaderNames, '总计', '平均'].join(','),
      ...chartData.map(d => [
        d.week,
        ...uploaderIds.map(id => d[id]),
        d.total,
        d.average?.toFixed(2) || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `发布趋势_${selectedYear}.csv`;
    link.click();
  }, [chartData, uploaderNames, uploaderIds, selectedYear]);

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
        {payload.map((entry: any, index: number) => (
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
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              color: '#666'
            }}>
              <span style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%',
                background: entry.color || COLORS[index % COLORS.length]
              }} />
              {entry.name}
            </span>
            <span style={{ 
              fontWeight: 600, 
              color: '#1A1A1A'
            }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="暂无数据" />
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />}
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={{ stroke: '#E8E8E8' }}
            tickLine={{ stroke: '#E8E8E8' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#E8E8E8' }}
            tickLine={{ stroke: '#E8E8E8' }}
          />
          {showTooltip && <RechartsTooltip content={<CustomTooltip />} />}
          <Legend />
          
          {showAverage && (
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke={ACCENT_COLOR} 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="平均"
              dot={false}
              activeDot={false}
            />
          )}
          
          {showIndividual && uploaderIds.slice(0, 5).map((uploaderId, index) => (
            <Line 
              key={uploaderId}
              type="monotone" 
              dataKey={uploaderId}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              name={uploaderNames[index]}
              dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
              hide={uploaderIds.length > 5 && index >= 5}
              animationDuration={animationEnabled ? 1000 : 0}
            />
          ))}
          
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke={PRIMARY_COLOR} 
            strokeWidth={3}
            name="总计"
            dot={{ fill: PRIMARY_COLOR, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={animationEnabled ? 1000 : 0}
          />
          <Brush dataKey="week" height={30} stroke={PRIMARY_COLOR} />
        </LineChart>
      );
    } else if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />}
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={{ stroke: '#E8E8E8' }}
            tickLine={{ stroke: '#E8E8E8' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#E8E8E8' }}
            tickLine={{ stroke: '#E8E8E8' }}
          />
          {showTooltip && <RechartsTooltip content={<CustomTooltip />} />}
          <Legend />
          
          {showAverage && (
            <Area 
              type="monotone" 
              dataKey="average" 
              stroke={ACCENT_COLOR} 
              fill={ACCENT_COLOR}
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="平均"
            />
          )}
          
          {showIndividual && uploaderIds.slice(0, 5).map((uploaderId, index) => (
            <Area 
              key={uploaderId}
              type="monotone" 
              dataKey={uploaderId}
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.1}
              strokeWidth={2}
              name={uploaderNames[index]}
              hide={uploaderIds.length > 5 && index >= 5}
              animationDuration={animationEnabled ? 1000 : 0}
            />
          ))}
          
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke={PRIMARY_COLOR} 
            fill={PRIMARY_COLOR}
            fillOpacity={0.2}
            strokeWidth={3}
            name="总计"
            animationDuration={animationEnabled ? 1000 : 0}
          />
          <Brush dataKey="week" height={30} stroke={PRIMARY_COLOR} />
        </AreaChart>
      );
    } else {
      return (
        <BarChart {...commonProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />}
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={{ stroke: '#E8E8E8' }}
            tickLine={{ stroke: '#E8E8E8' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#E8E8E8' }}
            tickLine={{ stroke: '#E8E8E8' }}
          />
          {showTooltip && <RechartsTooltip content={<CustomTooltip />} />}
          <Legend />
          
          {showAverage && (
            <ReferenceLine 
              y={summaryStats?.avgWeeklyVideos} 
              stroke={ACCENT_COLOR} 
              strokeDasharray="5 5"
              label={{ value: '平均', position: 'right' }}
            />
          )}
          
          {showIndividual && uploaderIds.slice(0, 5).map((uploaderId, index) => (
            <Bar 
              key={uploaderId}
              dataKey={uploaderId}
              fill={COLORS[index % COLORS.length]}
              name={uploaderNames[index]}
              radius={[2, 2, 0, 0]}
              hide={uploaderIds.length > 5 && index >= 5}
              animationDuration={animationEnabled ? 1000 : 0}
            />
          ))}
          
          <Bar 
            dataKey="total" 
            fill={PRIMARY_COLOR}
            name="总计"
            radius={[2, 2, 0, 0]}
            animationDuration={animationEnabled ? 1000 : 0}
          />
          <Brush dataKey="week" height={30} stroke={PRIMARY_COLOR} />
        </BarChart>
      );
    }
  };

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
            value={chartType}
            onChange={setChartType}
            style={{ width: 100 }}
            size="small"
          >
            {CHART_TYPES.map(type => (
              <Select.Option key={type} value={type}>
                {type === 'line' && <LineChartOutlined />}
                {type === 'bar' && <BarChartOutlined />}
                {type === 'area' && <AreaChartOutlined />}
                {' '}{type === 'line' ? '折线图' : type === 'bar' ? '柱状图' : '面积图'}
              </Select.Option>
            ))}
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
            <Checkbox 
              checked={showIndividual} 
              onChange={(e) => setShowIndividual(e.target.checked)}
            >
              显示UP主数据
            </Checkbox>
            <Checkbox 
              checked={showAverage} 
              onChange={(e) => setShowAverage(e.target.checked)}
            >
              显示平均线
            </Checkbox>
            <Checkbox 
              checked={animationEnabled} 
              onChange={(e) => setAnimationEnabled(e.target.checked)}
            >
              启用动画
            </Checkbox>
            <Checkbox 
              checked={showGrid} 
              onChange={(e) => setShowGrid(e.target.checked)}
            >
              显示网格
            </Checkbox>
            <Checkbox 
              checked={showTooltip} 
              onChange={(e) => setShowTooltip(e.target.checked)}
            >
              显示提示框
            </Checkbox>
          </Space>
        </Card>
      )}

      {summaryStats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="总发布量"
                value={summaryStats.totalVideos}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1890FF' }}
                prefix={<VideoCameraOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="周均发布"
                value={summaryStats.avgWeeklyVideos.toFixed(1)}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#52C41A' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="最高周发布"
                value={summaryStats.maxWeeklyVideos}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#F59E0B' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="活跃周数"
                value={`${summaryStats.activeWeeks}/${summaryStats.totalWeeks}`}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#8B5CF6' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card size="small" style={{ background: '#FFFFFF', border: '1px solid #E8E8E8' }}>
        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </Card>

      <div style={{ marginTop: 12, fontSize: 12, color: '#999', textAlign: 'center' }}>
        <CalendarOutlined /> {selectedYear}年按周统计 · 显示前5个UP主数据 · 支持缩放和拖拽选择
      </div>
    </div>
  );
}
