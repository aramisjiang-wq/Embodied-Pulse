import { Empty, Select, Space, Tooltip, Checkbox, Card, Row, Col, Statistic } from 'antd';
import { LineChartOutlined, BarChartOutlined, CalendarOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { PublishTrendData } from '@/lib/api/analytics';
import { useMemo, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

interface PublishTrendChartProps {
  data: PublishTrendData;
}

const PRIMARY_COLOR = '#1890FF';
const SECONDARY_COLOR = '#52C41A';

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

export function PublishTrendChart({ data }: PublishTrendChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [showIndividual, setShowIndividual] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  const { chartData, uploaderNames, uploaderIds, availableYears, summaryStats } = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { chartData: [], uploaderNames: [], uploaderIds: [], availableYears: [], summaryStats: null };
    }

    const uploaderMap = new Map<string, string>();
    const weekMap = new Map<string, Map<string, number>>();

    data.data.forEach(item => {
      uploaderMap.set(item.uploaderId, item.uploaderName);
      
      const date = dayjs(item.period);
      const weekKey = `${date.year()}-W${date.week()}`;
      const weekday = date.day();
      
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

    return { chartData, uploaderNames, uploaderIds, availableYears: years, summaryStats };
  }, [data, selectedYear]);

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
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
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
          <RechartsTooltip 
            contentStyle={{ 
              background: '#FFFFFF', 
              border: '1px solid #E8E8E8',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          
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
          />
        </LineChart>
      );
    } else {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
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
          <RechartsTooltip 
            contentStyle={{ 
              background: '#FFFFFF', 
              border: '1px solid #E8E8E8',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          
          {showIndividual && uploaderIds.slice(0, 5).map((uploaderId, index) => (
            <Bar 
              key={uploaderId}
              dataKey={uploaderId}
              fill={COLORS[index % COLORS.length]}
              name={uploaderNames[index]}
              radius={[2, 2, 0, 0]}
              hide={uploaderIds.length > 5 && index >= 5}
            />
          ))}
          
          <Bar 
            dataKey="total" 
            fill={PRIMARY_COLOR}
            name="总计"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space>
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 100 }}
            size="small"
          >
            <Select.Option value="line">
              <LineChartOutlined /> 折线图
            </Select.Option>
            <Select.Option value="bar">
              <BarChartOutlined /> 柱状图
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#999' }}>显示UP主:</span>
          <Checkbox 
            checked={showIndividual} 
            onChange={(e) => setShowIndividual(e.target.checked)}
          >
            是
          </Checkbox>
        </div>
      </div>

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
        <CalendarOutlined /> {selectedYear}年按周统计 · 显示前5个UP主数据
      </div>
    </div>
  );
}
