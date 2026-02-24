'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Spin, Empty, Select, DatePicker, Tag, Button, Table, Statistic, Avatar, Tooltip, Space, Tabs, Drawer, Descriptions, Progress, Input, Typography, Divider, Badge } from 'antd';
import { VideoCameraOutlined, PlayCircleOutlined, ClockCircleOutlined, RiseOutlined, BarChartOutlined, UserOutlined, CalendarOutlined, FireOutlined, TrophyOutlined, EyeOutlined, LikeOutlined, StarOutlined, SearchOutlined, TeamOutlined, LineChartOutlined, DashboardOutlined, InfoCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import VipGuard from '@/components/VipGuard';
import { analyticsApi, BilibiliUploader, RankingItem, OverviewData, UploaderDetail } from '@/lib/api/analytics';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import styles from './page.module.css';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#13c2c2', '#fa8c16', '#a0d911', '#2f54eb'];
const GRADIENT_COLORS = {
  primary: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
  success: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
  warning: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
  cyan: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const getDefaultDateRange = () => {
  const end = dayjs();
  const start = end.subtract(30, 'day');
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
};

export default function BilibiliAnalyticsPage() {
  const [selectedUploaders, setSelectedUploaders] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');
  const [detailUploaderId, setDetailUploaderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'playCount' | 'publishCount'>('playCount');
  const [searchText, setSearchText] = useState('');

  const { data: uploadersData, isLoading: uploadersLoading } = useQuery({
    queryKey: ['bilibili-uploaders'],
    queryFn: analyticsApi.getBilibiliUploaders,
  });

  const uploaders = uploadersData?.uploaders || [];

  useEffect(() => {
    if (uploaders.length > 0 && selectedUploaders.length === 0) {
      setSelectedUploaders(uploaders.slice(0, 5).map(u => u.id));
    }
  }, [uploaders, selectedUploaders.length]);

  const uploaderIds = useMemo(() => selectedUploaders, [selectedUploaders]);

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', uploaderIds, dateRange],
    queryFn: () => analyticsApi.getOverview({ uploaderIds, ...dateRange }),
    enabled: uploaderIds.length > 0,
  });

  const { data: trendData } = useQuery({
    queryKey: ['analytics-trend', uploaderIds, dateRange, groupBy],
    queryFn: () => analyticsApi.getPublishTrend({ uploaderIds, ...dateRange, groupBy }),
    enabled: uploaderIds.length > 0,
  });

  const { data: rankingsData } = useQuery({
    queryKey: ['analytics-rankings', uploaderIds, dateRange, sortBy],
    queryFn: () => analyticsApi.getRankings({ uploaderIds, ...dateRange, type: sortBy }),
    enabled: uploaderIds.length > 0,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['uploader-detail', detailUploaderId, dateRange],
    queryFn: () => analyticsApi.getUploaderDetail({ uploaderId: detailUploaderId!, ...dateRange }),
    enabled: !!detailUploaderId,
  });

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    }
  };

  const chartData = useMemo(() => {
    if (!trendData?.data) return [];
    const periodMap = new Map<string, Record<string, number | string>>();
    trendData.data.forEach(item => {
      if (!periodMap.has(item.period)) {
        periodMap.set(item.period, { period: item.period });
      }
      const periodData = periodMap.get(item.period)!;
      periodData[item.uploaderName] = item.video_count;
    });
    return Array.from(periodMap.values()).sort((a, b) => String(a.period).localeCompare(String(b.period)));
  }, [trendData]);

  const filteredUploaders = useMemo(() => {
    if (!searchText) return uploaders;
    return uploaders.filter(u => 
      u.name.toLowerCase().includes(searchText.toLowerCase()) ||
      u.tags?.some(t => t.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [uploaders, searchText]);

  const rankingColumns = [
    { 
      title: '排名', 
      dataIndex: 'rank', 
      key: 'rank', 
      width: 60, 
      align: 'center' as const,
      render: (rank: number) => (
        <div className={styles.rankBadge} style={{ 
          background: rank === 1 ? 'linear-gradient(135deg, #faad14 0%, #d48806 100%)' : 
                      rank === 2 ? 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)' : 
                      rank === 3 ? 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)' : '#f0f0f0',
          color: rank <= 3 ? '#fff' : '#8c8c8c'
        }}>
          {rank <= 3 ? <TrophyOutlined /> : rank}
        </div>
      ) 
    },
    { 
      title: 'UP主', 
      dataIndex: 'uploaderName', 
      key: 'uploaderName', 
      render: (name: string, record: RankingItem) => (
        <Space>
          <Avatar src={record.avatar} size={36} icon={<UserOutlined />} />
          <div className={styles.uploaderInfo}>
            <span className={styles.uploaderName}>{name}</span>
            <span className={styles.uploaderId}>MID: {record.uploaderId?.slice(0, 8)}...</span>
          </div>
        </Space>
      ) 
    },
    { 
      title: '视频数', 
      dataIndex: 'video_count', 
      key: 'video_count', 
      width: 100, 
      align: 'center' as const,
      render: (v: number) => <Badge count={v} showZero style={{ backgroundColor: '#1890ff' }} />
    },
    { 
      title: '总播放', 
      dataIndex: 'total_play_count', 
      key: 'total_play_count', 
      width: 120, 
      align: 'right' as const, 
      render: (v: number) => <span className={styles.playCount}>{formatNumber(v)}</span> 
    },
    { 
      title: '平均播放', 
      dataIndex: 'avg_play_count', 
      key: 'avg_play_count', 
      width: 120, 
      align: 'right' as const, 
      render: (v: number) => <span className={styles.avgCount}>{formatNumber(v)}</span> 
    },
    { 
      title: '操作', 
      key: 'action', 
      width: 100, 
      align: 'center' as const,
      render: (_: unknown, record: RankingItem) => (
        <Button type="primary" size="small" ghost onClick={() => setDetailUploaderId(record.uploaderId)}>
          详情
        </Button>
      ) 
    },
  ];

  const statCards = [
    { 
      title: 'UP主数量', 
      value: overviewData?.totalUploaders || 0, 
      icon: <TeamOutlined />, 
      gradient: GRADIENT_COLORS.primary,
      suffix: '位'
    },
    { 
      title: '总视频数', 
      value: overviewData?.totalVideos || 0, 
      icon: <VideoCameraOutlined />, 
      gradient: GRADIENT_COLORS.success,
      suffix: '个'
    },
    { 
      title: '总播放量', 
      value: formatNumber(overviewData?.total_play_count || 0), 
      icon: <PlayCircleOutlined />, 
      gradient: GRADIENT_COLORS.cyan,
      suffix: ''
    },
    { 
      title: '本月新增', 
      value: overviewData?.newVideosThisMonth || 0, 
      icon: <RiseOutlined />, 
      gradient: GRADIENT_COLORS.warning,
      suffix: '个',
      highlight: true
    },
  ];

  return (
    <VipGuard>
      <div className={styles.page}>
        {/* 页面头部 */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <DashboardOutlined className={styles.headerIcon} />
              <div>
                <Title level={3} className={styles.pageTitle}>B站UP主数据分析</Title>
                <Text type="secondary">监控机器人厂家的内容产出和播放表现</Text>
              </div>
            </div>
            <div className={styles.headerActions}>
              <RangePicker 
                value={[dayjs(dateRange.startDate), dayjs(dateRange.endDate)]} 
                onChange={handleDateChange} 
                allowClear={false}
                style={{ borderRadius: 8 }}
              />
              <Tooltip title="数据更新时间">
                <div className={styles.updateInfo}>
                  <ClockCircleOutlined />
                  <span>{overviewData?.lastUpdatedAt ? dayjs(overviewData.lastUpdatedAt).format('MM-DD HH:mm') : '-'}</span>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className={styles.statsSection}>
          {statCards.map((stat, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Card className={`${styles.statCard} ${stat.highlight ? styles.highlightCard : ''}`} bordered={false}>
                <div className={styles.statIcon} style={{ background: stat.gradient }}>
                  {stat.icon}
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statTitle}>{stat.title}</div>
                  <div className={styles.statValue}>
                    {stat.value}
                    <span className={styles.statSuffix}>{stat.suffix}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 筛选区域 */}
        <Card className={styles.filterCard} bordered={false}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <div className={styles.filterHeader}>
                <TeamOutlined />
                <span>选择UP主</span>
                <Badge count={selectedUploaders.length} style={{ backgroundColor: '#1890ff' }} />
              </div>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="搜索并选择要分析的UP主"
                value={selectedUploaders}
                onChange={setSelectedUploaders}
                loading={uploadersLoading}
                showSearch
                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                maxTagCount={8}
                maxTagPlaceholder={(omitted) => `+${omitted.length}`}
                options={filteredUploaders.map(u => ({ value: u.id, label: u.name }))}
                size="large"
              />
            </Col>
            <Col>
              <Space>
                <Button type="primary" ghost onClick={() => setSelectedUploaders(uploaders.map(u => u.id))}>
                  全选
                </Button>
                <Button onClick={() => setSelectedUploaders([])}>
                  清空
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 图表区域 */}
        <Row gutter={[16, 16]} className={styles.chartSection}>
          <Col xs={24} lg={16}>
            <Card 
              className={styles.chartCard} 
              bordered={false}
              title={
                <div className={styles.cardTitle}>
                  <LineChartOutlined />
                  <span>发布趋势</span>
                </div>
              }
              extra={
                <Select 
                  value={groupBy} 
                  onChange={setGroupBy} 
                  style={{ width: 100 }}
                  options={[
                    { value: 'day', label: '按日' }, 
                    { value: 'week', label: '按周' }, 
                    { value: 'month', label: '按月' }
                  ]} 
                />
              }
            >
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      {uploaders.filter(u => selectedUploaders.includes(u.id)).slice(0, 8).map((uploader, index) => (
                        <linearGradient key={uploader.id} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#8c8c8c" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#8c8c8c" />
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: 8, 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                      }} 
                    />
                    <Legend />
                    {uploaders.filter(u => selectedUploaders.includes(u.id)).slice(0, 8).map((uploader, index) => (
                      <Area 
                        key={uploader.id} 
                        type="monotone" 
                        dataKey={uploader.name} 
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={2}
                        fill={`url(#color${index})`}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="暂无数据" style={{ padding: '60px 0' }} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              className={styles.chartCard} 
              bordered={false}
              title={
                <div className={styles.cardTitle}>
                  <TrophyOutlined />
                  <span>播放量排行</span>
                </div>
              }
              extra={
                <Select 
                  value={sortBy} 
                  onChange={setSortBy} 
                  style={{ width: 100 }}
                  options={[
                    { value: 'playCount', label: '按播放' }, 
                    { value: 'publishCount', label: '按发布' }
                  ]} 
                />
              }
            >
              {rankingsData?.rankings?.slice(0, 6).map((item, index) => (
                <div 
                  key={item.uploaderId} 
                  className={styles.rankItem} 
                  onClick={() => setDetailUploaderId(item.uploaderId)}
                >
                  <div 
                    className={styles.rankBadge} 
                    style={{ 
                      background: index < 3 ? 
                        ['linear-gradient(135deg, #faad14 0%, #d48806 100%)', 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)', 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)'][index] : 
                        '#f0f0f0',
                      color: index < 3 ? '#fff' : '#8c8c8c'
                    }}
                  >
                    {index + 1}
                  </div>
                  <Avatar src={item.avatar} size={40} icon={<UserOutlined />} />
                  <div className={styles.rankInfo}>
                    <span className={styles.rankName}>{item.uploaderName}</span>
                    <span className={styles.rankCount}>
                      <PlayCircleOutlined /> {formatNumber(item.total_play_count)} 播放
                    </span>
                  </div>
                  <div className={styles.rankVideoCount}>
                    <Badge count={item.video_count} showZero style={{ backgroundColor: '#52c41a' }} />
                  </div>
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {/* 排行榜表格 */}
        <Card 
          className={styles.tableCard} 
          bordered={false}
          title={
            <div className={styles.cardTitle}>
              <BarChartOutlined />
              <span>UP主排行榜</span>
            </div>
          }
        >
          <Table 
            dataSource={rankingsData?.rankings || []} 
            columns={rankingColumns} 
            rowKey="uploaderId" 
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }} 
            loading={uploadersLoading}
            scroll={{ x: 800 }}
          />
        </Card>

        {/* UP主详情抽屉 */}
        <Drawer 
          title={
            <div className={styles.drawerTitle}>
              <Avatar src={detailData?.uploader?.avatar} size={40} icon={<UserOutlined />} />
              <span>{detailData?.uploader?.name || 'UP主详情'}</span>
            </div>
          } 
          placement="right" 
          width={640} 
          open={!!detailUploaderId} 
          onClose={() => setDetailUploaderId(null)} 
          loading={detailLoading}
        >
          {detailData && (
            <div className={styles.detailContent}>
              <div className={styles.detailHeader}>
                <div className={styles.detailInfo}>
                  <p className={styles.detailDesc}>{detailData.uploader.description || '暂无简介'}</p>
                  <div className={styles.detailTags}>
                    {detailData.uploader.tags?.map((t, i) => (
                      <Tag key={i} color="blue">{t}</Tag>
                    ))}
                  </div>
                </div>
              </div>
              
              <Row gutter={16} className={styles.detailStats}>
                <Col span={8}>
                  <div className={styles.detailStatItem}>
                    <VideoCameraOutlined className={styles.detailStatIcon} />
                    <div className={styles.detailStatValue}>{detailData.stats.totalVideos}</div>
                    <div className={styles.detailStatLabel}>视频数</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className={styles.detailStatItem}>
                    <PlayCircleOutlined className={styles.detailStatIcon} />
                    <div className={styles.detailStatValue}>{formatNumber(detailData.stats.total_play_count)}</div>
                    <div className={styles.detailStatLabel}>总播放</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className={styles.detailStatItem}>
                    <BarChartOutlined className={styles.detailStatIcon} />
                    <div className={styles.detailStatValue}>{formatNumber(detailData.stats.avg_play_count)}</div>
                    <div className={styles.detailStatLabel}>平均播放</div>
                  </div>
                </Col>
              </Row>

              <Divider>热门视频 TOP10</Divider>

              <div className={styles.topVideosList}>
                {detailData.topVideos?.map((video, index) => (
                  <div key={video.id} className={styles.topVideoItem}>
                    <div className={styles.topVideoRank}>{index + 1}</div>
                    <div className={styles.topVideoInfo}>
                      <div className={styles.topVideoTitle}>{video.title}</div>
                      <div className={styles.topVideoMeta}>
                        <span><PlayCircleOutlined /> {formatNumber(video.playCount)}</span>
                        <span><LikeOutlined /> {formatNumber(video.likeCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </VipGuard>
  );
}
