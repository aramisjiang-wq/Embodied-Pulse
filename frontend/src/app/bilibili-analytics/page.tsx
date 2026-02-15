'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Space, Spin, Empty, Drawer, Statistic, Avatar, App } from 'antd';
import { 
  BarChartOutlined, 
  HeatMapOutlined, 
  TrophyOutlined, 
  ReloadOutlined, 
  DownloadOutlined,
  FilterOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { UploaderSelector } from './components/UploaderSelector';
import { PublishTrendChart } from './components/PublishTrendChart';
import { PlayHeatmap } from './components/PlayHeatmap';
import { UploaderRankings } from './components/UploaderRankings';
import { UploaderDetailPanel } from './components/UploaderDetailPanel';
import { analyticsApi, BilibiliUploader } from '@/lib/api/analytics';
import AnalyticsSkeleton from './components/AnalyticsSkeleton';
import { useDataLoader, clearCache } from '@/lib/hooks/useDataLoader';

const { RangePicker } = DatePicker;

export default function BilibiliAnalyticsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUploaders, setSelectedUploaders] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '180d' | '1y' | 'custom'>('30d');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [rankingType, setRankingType] = useState<'publishCount' | 'playCount' | 'avgPlayCount' | 'growthRate'>('playCount');
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [selectedUploader, setSelectedUploader] = useState<BilibiliUploader | null>(null);
  const { message } = App.useApp();

  const startDate = useMemo(() => {
    if (timeRange === 'custom' && customDateRange) {
      return customDateRange[0].format('YYYY-MM-DD');
    }
    const ranges: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365
    };
    return dayjs().subtract(ranges[timeRange] || 30, 'day').format('YYYY-MM-DD');
  }, [timeRange, customDateRange]);

  const endDate = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const cacheKey = useMemo(() => 
    `bilibili-analytics-${selectedUploaders.join(',')}-${startDate}-${endDate}-${rankingType}`,
    [selectedUploaders, startDate, endDate, rankingType]
  );

  const { data: uploaders, loading: uploadersLoading } = useDataLoader({
    fetchFn: async () => {
      const data = await analyticsApi.getBilibiliUploaders();
      return data.uploaders || [];
    },
    cacheKey: 'bilibili-uploaders',
    cacheDuration: 10 * 60 * 1000,
    onSuccess: (data) => {
      if (data.length > 0 && selectedUploaders.length === 0) {
        const top5Uploaders = data
          .sort((a, b) => b.video_count - a.video_count)
          .slice(0, 5)
          .map((u) => u.id);
        setSelectedUploaders(top5Uploaders);
      }
      setInitialLoading(false);
    },
    onError: () => {
      setInitialLoading(false);
    }
  });

  const { data: overviewData, loading: overviewLoading, refresh: refreshOverview } = useDataLoader({
    fetchFn: () => analyticsApi.getOverview({
      uploaderIds: selectedUploaders,
      startDate,
      endDate
    }),
    cacheKey: `${cacheKey}-overview`,
    cacheDuration: 2 * 60 * 1000,
    enabled: selectedUploaders.length > 0
  });

  const { data: trendData, loading: trendLoading, refresh: refreshTrend } = useDataLoader({
    fetchFn: () => analyticsApi.getPublishTrend({
      uploaderIds: selectedUploaders,
      startDate,
      endDate,
      groupBy: timeRange === '7d' ? 'day' : 'week'
    }),
    cacheKey: `${cacheKey}-trend`,
    cacheDuration: 2 * 60 * 1000,
    enabled: selectedUploaders.length > 0
  });

  const { data: heatmapData, loading: heatmapLoading, refresh: refreshHeatmap } = useDataLoader({
    fetchFn: () => analyticsApi.getPlayHeatmap({
      uploaderIds: selectedUploaders,
      startDate,
      endDate
    }),
    cacheKey: `${cacheKey}-heatmap`,
    cacheDuration: 2 * 60 * 1000,
    enabled: selectedUploaders.length > 0
  });

  const { data: rankingsData, loading: rankingsLoading, refresh: refreshRankings } = useDataLoader({
    fetchFn: () => analyticsApi.getRankings({
      uploaderIds: selectedUploaders,
      startDate,
      endDate,
      type: rankingType
    }),
    cacheKey: `${cacheKey}-rankings`,
    cacheDuration: 2 * 60 * 1000,
    enabled: selectedUploaders.length > 0
  });

  const loading = overviewLoading || trendLoading || heatmapLoading || rankingsLoading;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      clearCache(cacheKey);
      await Promise.all([
        refreshOverview(),
        refreshTrend(),
        refreshHeatmap(),
        refreshRankings()
      ]);
      message.success('数据刷新成功');
    } catch (error) {
      message.error('数据刷新失败');
    } finally {
      setRefreshing(false);
    }
  }, [cacheKey, refreshOverview, refreshTrend, refreshHeatmap, refreshRankings]);

  const handleUploaderChange = useCallback((uploaderIds: string[]) => {
    setSelectedUploaders(uploaderIds);
  }, []);

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as any);
    if (value !== 'custom') {
      setCustomDateRange(null);
    }
  }, []);

  const handleCustomDateChange = useCallback((dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setCustomDateRange(dates);
  }, []);

  const handleRankingTypeChange = useCallback((type: string) => {
    setRankingType(type as any);
  }, []);

  const handleUploaderClick = useCallback((uploader: BilibiliUploader) => {
    setSelectedUploader(uploader);
    setDetailPanelVisible(true);
  }, []);

  const handleExport = useCallback(async (format: 'excel' | 'csv') => {
    try {
      message.info(`正在导出${format.toUpperCase()}格式...`);
      const data = await analyticsApi.exportData({
        uploaderIds: selectedUploaders,
        startDate,
        endDate,
        format
      });
      const fileBlob = data instanceof Blob ? data : new Blob([data]);
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      const fileExt = format === 'excel' ? 'xlsx' : 'csv';
      link.href = url;
      link.download = `bilibili-analytics-${startDate}-${endDate}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  }, [selectedUploaders, startDate, endDate]);

  if (initialLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!uploaders || uploaders.length === 0) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p style={{ fontSize: 16, marginBottom: 16 }}>暂无B站UP主数据</p>
              <p style={{ color: '#999', marginBottom: 24 }}>数据库中暂无具身机器人相关的B站UP主数据</p>
            </div>
          }
        />
      </div>
    );
  }

  const selectedUploaderList = uploaders.filter((u) => selectedUploaders.includes(u.id));

  return (
    <div style={{ padding: '24px', background: '#F5F7FA', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1A1A1A', margin: 0, marginBottom: 4 }}>
                B站视频数据分析
              </h1>
              <p style={{ color: '#64748B', margin: 0, fontSize: 14 }}>
                具身机器人厂家B站视频数据深度分析
              </p>
              {overviewData && (
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockCircleOutlined />
                  数据更新于 {dayjs(overviewData.lastUpdatedAt).format('YYYY-MM-DD HH:mm')}
                </div>
              )}
            </div>
            
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={refreshing}
              >
                刷新
              </Button>
              <Button.Group>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('excel')}>
                  导出Excel
                </Button>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
                  导出CSV
                </Button>
              </Button.Group>
            </Space>
          </div>
          
          <Card 
            size="small" 
            style={{ marginBottom: 24, borderRadius: 8 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 280 }}>
                <FilterOutlined style={{ color: '#64748B' }} />
                <UploaderSelector
                  uploaders={uploaders}
                  selectedUploaders={selectedUploaders}
                  onChange={handleUploaderChange}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: '#64748B' }} />
                <Select 
                  value={timeRange} 
                  onChange={handleTimeRangeChange}
                  style={{ width: 110 }}
                >
                  <Select.Option value="7d">最近7天</Select.Option>
                  <Select.Option value="30d">最近30天</Select.Option>
                  <Select.Option value="90d">最近90天</Select.Option>
                  <Select.Option value="180d">最近180天</Select.Option>
                  <Select.Option value="1y">最近1年</Select.Option>
                  <Select.Option value="custom">自定义</Select.Option>
                </Select>
                
                {timeRange === 'custom' && (
                  <RangePicker 
                    value={customDateRange}
                    onChange={handleCustomDateChange}
                    style={{ width: 260 }}
                  />
                )}
              </div>

              <Space size="small">
                <Button size="small" onClick={() => setSelectedUploaders(uploaders.map((u) => u.id))}>
                  全选
                </Button>
                <Button size="small" onClick={() => setSelectedUploaders([])}>
                  清空
                </Button>
                <Button 
                  size="small" 
                  type="primary"
                  onClick={() => {
                    const top5 = uploaders
                      .sort((a, b) => b.video_count - a.video_count)
                      .slice(0, 5)
                      .map((u) => u.id);
                    setSelectedUploaders(top5);
                  }}
                >
                  TOP 5
                </Button>
              </Space>
            </div>
          </Card>
        </div>

        <Spin spinning={loading}>
          {overviewData && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card size="small" style={{ height: '100%' }}>
                  <Statistic
                    title={<span style={{ color: '#64748B', fontSize: 13 }}>UP主总数</span>}
                    value={overviewData.totalUploaders}
                    prefix={<UserOutlined style={{ color: '#1890FF' }} />}
                    valueStyle={{ color: '#1A1A1A', fontSize: 28, fontWeight: 600 }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                    已选 {selectedUploaders.length} 个
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small" style={{ height: '100%' }}>
                  <Statistic
                    title={<span style={{ color: '#64748B', fontSize: 13 }}>视频总数</span>}
                    value={overviewData.totalVideos}
                    prefix={<VideoCameraOutlined style={{ color: '#52C41A' }} />}
                    valueStyle={{ color: '#1A1A1A', fontSize: 28, fontWeight: 600 }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                    本月新增 {overviewData.newVideosThisMonth} 个
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small" style={{ height: '100%' }}>
                  <Statistic
                    title={<span style={{ color: '#64748B', fontSize: 13 }}>总播放量</span>}
                    value={Math.round(overviewData.totalPlayCount / 10000) / 100}
                    suffix="万"
                    prefix={<PlayCircleOutlined style={{ color: '#FA8C16' }} />}
                    valueStyle={{ color: '#1A1A1A', fontSize: 28, fontWeight: 600 }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                    累计播放次数
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small" style={{ height: '100%' }}>
                  <Statistic
                    title={<span style={{ color: '#64748B', fontSize: 13 }}>平均播放量</span>}
                    value={Math.round(overviewData.avgPlayCount / 100) / 100}
                    suffix="万"
                    prefix={<EyeOutlined style={{ color: '#722ED1' }} />}
                    valueStyle={{ color: '#1A1A1A', fontSize: 28, fontWeight: 600 }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                    单视频平均播放
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <BarChartOutlined style={{ color: '#1890FF' }} />
                    <span>视频发布趋势</span>
                  </Space>
                }
                size="small"
                style={{ height: '100%' }}
              >
                {trendData ? (
                  <PublishTrendChart data={trendData} />
                ) : (
                  <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="暂无趋势数据" />
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#FA8C16' }} />
                    <span>UP主排行榜</span>
                  </Space>
                }
                extra={
                  <Select 
                    value={rankingType} 
                    onChange={handleRankingTypeChange}
                    style={{ width: 100 }}
                    size="small"
                  >
                    <Select.Option value="publishCount">发布量</Select.Option>
                    <Select.Option value="playCount">播放量</Select.Option>
                    <Select.Option value="avgPlayCount">平均播放</Select.Option>
                    <Select.Option value="growthRate">增长率</Select.Option>
                  </Select>
                }
                size="small"
                style={{ height: '100%' }}
              >
                {rankingsData ? (
                  <UploaderRankings 
                    data={rankingsData} 
                    type={rankingType}
                    onUploaderClick={handleUploaderClick}
                  />
                ) : (
                  <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="暂无排行数据" />
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <HeatMapOutlined style={{ color: '#52C41A' }} />
                    <span>播放量热力图</span>
                  </Space>
                }
                size="small"
              >
                {heatmapData ? (
                  <PlayHeatmap data={heatmapData} />
                ) : (
                  <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="暂无热力数据" />
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <UserOutlined style={{ color: '#722ED1' }} />
                    <span>已选UP主</span>
                  </Space>
                }
                size="small"
              >
                {selectedUploaderList.length > 0 ? (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {selectedUploaderList.map((uploader) => (
                      <div
                        key={uploader.id}
                        onClick={() => handleUploaderClick(uploader)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          marginBottom: 8,
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: '#F5F7FA',
                          border: '1px solid #E8E8E8'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#E6F7FF';
                          e.currentTarget.style.borderColor = '#1890FF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F5F7FA';
                          e.currentTarget.style.borderColor = '#E8E8E8';
                        }}
                      >
                        <Avatar
                          src={uploader.avatar}
                          icon={<UserOutlined />}
                          size={36}
                          style={{ marginRight: 12 }}
                        />
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ 
                            fontSize: 14, 
                            fontWeight: 500, 
                            color: '#1A1A1A',
                            marginBottom: 4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {uploader.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            {uploader.video_count} 个视频
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="暂无选择" />
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Spin>

        <Drawer
          title={
            <Space>
              <UserOutlined />
              <span>UP主详情</span>
            </Space>
          }
          placement="right"
          width={480}
          open={detailPanelVisible}
          onClose={() => setDetailPanelVisible(false)}
        >
          {selectedUploader && (
            <UploaderDetailPanel 
              uploader={selectedUploader}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </Drawer>
      </div>
    </div>
  );
}
