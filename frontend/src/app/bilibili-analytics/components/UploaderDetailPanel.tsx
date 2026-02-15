import { Avatar, Descriptions, Row, Col, Statistic, Tag, Space, List, Empty, Spin, App } from 'antd';
import { UserOutlined, PlayCircleOutlined, LikeOutlined, StarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UploaderDetail } from '@/lib/api/analytics';
import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/analytics';

interface UploaderDetailPanelProps {
  uploader: {
    id: string;
    mid: string;
    name: string;
    avatar?: string;
  };
  startDate: string;
  endDate: string;
}

export function UploaderDetailPanel({ uploader, startDate, endDate }: UploaderDetailPanelProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<UploaderDetail | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    loadDetail();
  }, [uploader.id, startDate, endDate]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.getUploaderDetail({
        uploaderId: uploader.id,
        startDate,
        endDate
      });
      setDetail(data);
    } catch (error) {
      console.error('Load uploader detail error:', error);
      message.error('加载UP主详情失败');
    } finally {
      setLoading(false);
    }
  };

  const formatPlayCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return (
      <Empty description="暂无数据" />
    );
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Avatar
            src={detail.uploader.avatar}
            icon={<UserOutlined />}
            size={80}
            style={{ marginBottom: 12 }}
          />
          <h3 style={{ margin: '8px 0 4px', fontSize: 18 }}>
            {detail.uploader.name}
          </h3>
          <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
            {detail.uploader.description || '暂无简介'}
          </p>
          <Space style={{ marginTop: 12, justifyContent: 'center' }}>
            {(detail.uploader.tags || []).map(tag => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
          </Space>
          <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
            订阅时间: {detail.uploader.subscribedAt} | 最后更新: {detail.uploader.lastSyncAt}
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title="总视频数"
              value={detail.stats.totalVideos}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="总播放量"
              value={formatPlayCount(detail.stats.totalPlayCount)}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="平均播放"
              value={formatPlayCount(detail.stats.avgPlayCount)}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="本月新增"
              value={detail.stats.newVideosThisMonth}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="总点赞数"
              value={formatPlayCount(detail.stats.totalLikeCount)}
              prefix={<LikeOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="总收藏数"
              value={formatPlayCount(detail.stats.totalFavoriteCount)}
              prefix={<StarOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
        </Row>

        <div>
          <h4 style={{ marginBottom: 12 }}>发布规律</h4>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="发布频率">
              每周 {detail.publishPattern.frequency.toFixed(1)} 个视频
            </Descriptions.Item>
            <Descriptions.Item label="发布时间">
              {detail.publishPattern.preferredDays.join('、')} {detail.publishPattern.preferredTime}
            </Descriptions.Item>
          </Descriptions>
          <div style={{ height: 200, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={detail.publishPattern.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: '#d9d9d9' }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: '#d9d9d9' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 4, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ fill: '#1890ff', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: 12 }}>播放表现</h4>
          <div style={{ height: 200, marginBottom: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={detail.playPerformance.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: '#d9d9d9' }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: '#d9d9d9' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 4, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="playCount"
                  stroke="#52c41a"
                  strokeWidth={2}
                  dot={{ fill: '#52c41a', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Descriptions column={3} size="small">
            <Descriptions.Item label="点赞率">
              {(detail.playPerformance.likeRate * 100).toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label="收藏率">
              {(detail.playPerformance.favoriteRate * 100).toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label="分享率">
              {(detail.playPerformance.shareRate * 100).toFixed(1)}%
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 12 }}>
            <h5 style={{ marginBottom: 8, fontSize: 13 }}>播放量分布</h5>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {detail.playPerformance.distribution.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 80, fontSize: 12 }}>{item.range}</span>
                  <div 
                    style={{ 
                      flex: 1, 
                      height: 20, 
                      backgroundColor: '#f0f0f0',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      style={{ 
                        height: '100%', 
                        backgroundColor: '#1890ff',
                        width: `${item.percentage}%`,
                        transition: 'width 0.3s'
                      }} 
                    />
                  </div>
                  <span style={{ width: 50, fontSize: 12, textAlign: 'right' }}>
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </Space>
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: 12 }}>热门视频 Top 10</h4>
          <List
            dataSource={detail.topVideos}
            renderItem={(video, index) => (
              <List.Item
                style={{ 
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%',
                      backgroundColor: index < 3 ? '#ffd700' : '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: index < 3 ? '#fff' : '#666'
                    }}>
                      {index + 1}
                    </div>
                  }
                  title={
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {video.title}
                    </div>
                  }
                  description={
                    <Space size={12}>
                      <span style={{ fontSize: 12, color: '#666' }}>
                        <PlayCircleOutlined style={{ marginRight: 4 }} />
                        {formatPlayCount(video.playCount)}
                      </span>
                      <span style={{ fontSize: 12, color: '#666' }}>
                        <LikeOutlined style={{ marginRight: 4 }} />
                        {formatPlayCount(video.likeCount)}
                      </span>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {video.publishedDate}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
            size="small"
          />
        </div>
      </Space>
    </div>
  );
}
