/**
 * 管理端首页 - 数据看板（重新设计版）
 * 从管理员业务视角，按关注点分层展示数据
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  Row, Col, Card, Statistic, Spin, Tag, Progress, 
  Typography, Space, Divider, Badge, Tooltip, App 
} from 'antd';
import { 
  UserOutlined, FileTextOutlined, CommentOutlined, 
  GithubOutlined, RobotOutlined, TeamOutlined, 
  HeartOutlined, ThunderboltOutlined, RiseOutlined, 
  FallOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, DatabaseOutlined, SyncOutlined,
  EyeOutlined, LikeOutlined, ShareAltOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import type { StatisticProps } from 'antd';

const { Title, Text } = Typography;

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
    growthRate: number;
  };
  content: {
    total: number;
    papers: { total: number; newToday: number; newThisWeek: number };
    videos: { total: number; newToday: number; newThisWeek: number };
    repos: { total: number; newToday: number; newThisWeek: number };
    jobs: number;
    huggingface: number;
    banners: number;
    distribution: any;
  };
  community: {
    posts: { total: number; newToday: number; newThisWeek: number; growthRate: number };
    comments: { total: number; newToday: number; newThisWeek: number; growthRate: number };
    favorites: { total: number; newToday: number; newThisWeek: number };
  };
  subscriptions: {
    active: number;
  };
  dataSources?: {
    total: number;
    enabled: number;
    healthy: number;
    unhealthy: number;
    sources: Array<{
      id: string;
      name: string;
      displayName: string;
      enabled: boolean;
      healthStatus: string;
      lastSyncAt?: string;
    }>;
  };
  recentItems?: {
    repos?: Array<{
      id: string;
      name: string;
      fullName: string;
      starsCount: number;
      language: string | null;
      viewCount: number;
      description: string | null;
      updatedDate: Date | null;
    }>;
    papers?: Array<{
      id: string;
      title: string;
      citationCount: number;
      publishedDate: Date | null;
      viewCount: number;
    }>;
    videos?: Array<{
      id: string;
      title: string;
      playCount: number;
      publishedDate: Date | null;
      viewCount: number;
    }>;
  };
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    loadStats();
    // 每30秒自动刷新
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.get('/admin/stats');
      if (response.code === 0) {
        setStats(response.data);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error: any) {
      console.error('Load stats error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '加载失败');
      }
      // 设置默认值，避免页面崩溃
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0;
    return (
      <Space>
        {isPositive ? <RiseOutlined style={{ color: '#3f8600' }} /> : <FallOutlined style={{ color: '#cf1322' }} />}
        <Text style={{ color: isPositive ? '#3f8600' : '#cf1322' }}>
          {Math.abs(rate).toFixed(1)}%
        </Text>
      </Space>
    );
  };

  const getHealthStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; text: string }> = {
      healthy: { color: 'success', icon: <CheckCircleOutlined />, text: '健康' },
      unhealthy: { color: 'error', icon: <CloseCircleOutlined />, text: '异常' },
      unknown: { color: 'warning', icon: <WarningOutlined />, text: '未知' },
    };
    const config = statusMap[status] || statusMap.unknown;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DatabaseOutlined /> 数据看板
        </Title>
        <Text type="secondary">实时监控平台核心业务指标</Text>
      </div>

      <Spin spinning={loading}>
        {/* ========== 第一屏：核心业务指标 ========== */}
        <Card 
          title={
            <Space>
              <ThunderboltOutlined style={{ color: '#1890ff' }} />
              <span>核心业务指标</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              最后更新: {new Date().toLocaleTimeString()}
            </Text>
          }
        >
          {/* 用户增长 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <UserOutlined /> 用户增长
              </Title>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="总用户数"
                  value={stats.users.total}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="今日新增"
                  value={stats.users.newToday}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#3f8600', fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="本周新增"
                  value={stats.users.newThisWeek}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#3f8600', fontSize: 24 }}
                  suffix={formatGrowthRate(stats.users.growthRate)}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="本月新增"
                  value={stats.users.newThisMonth}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#3f8600', fontSize: 24 }}
                />
              </Card>
            </Col>
          </Row>

          {/* 用户活跃度 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <EyeOutlined /> 用户活跃度
              </Title>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small" hoverable>
                <Statistic
                  title="今日活跃"
                  value={stats.users.activeToday}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: 24 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    占总数: {stats.users.total > 0 
                      ? ((stats.users.activeToday / stats.users.total) * 100).toFixed(1) 
                      : 0}%
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small" hoverable>
                <Statistic
                  title="近7天活跃"
                  value={stats.users.activeThisWeek}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: 24 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    占总数: {stats.users.total > 0 
                      ? ((stats.users.activeThisWeek / stats.users.total) * 100).toFixed(1) 
                      : 0}%
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small" hoverable>
                <Statistic
                  title="近30天活跃"
                  value={stats.users.activeThisMonth}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: 24 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    占总数: {stats.users.total > 0 
                      ? ((stats.users.activeThisMonth / stats.users.total) * 100).toFixed(1) 
                      : 0}%
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* 内容健康度 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <FileTextOutlined /> 内容健康度
              </Title>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="论文"
                  value={stats.content.papers.total}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    今日: +{stats.content.papers.newToday} | 本周: +{stats.content.papers.newThisWeek}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="视频"
                  value={stats.content.videos.total}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    今日: +{stats.content.videos.newToday} | 本周: +{stats.content.videos.newThisWeek}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="GitHub项目"
                  value={stats.content.repos.total}
                  prefix={<GithubOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    今日: +{stats.content.repos.newToday} | 本周: +{stats.content.repos.newThisWeek}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title="总内容数"
                  value={stats.content.total}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* 市集活跃度 */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <CommentOutlined /> 市集活跃度
              </Title>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small" hoverable>
                <Statistic
                  title="帖子总数"
                  value={stats.community.posts.total}
                  prefix={<CommentOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    今日: +{stats.community.posts.newToday} | 本周: +{stats.community.posts.newThisWeek}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {formatGrowthRate(stats.community.posts.growthRate)}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small" hoverable>
                <Statistic
                  title="评论总数"
                  value={stats.community.comments.total}
                  prefix={<CommentOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    今日: +{stats.community.comments.newToday} | 本周: +{stats.community.comments.newThisWeek}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {formatGrowthRate(stats.community.comments.growthRate)}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small" hoverable>
                <Statistic
                  title="收藏总数"
                  value={stats.community.favorites.total}
                  prefix={<HeartOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    今日: +{stats.community.favorites.newToday} | 本周: +{stats.community.favorites.newThisWeek}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* ========== 第二屏：运营数据 ========== */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* 订阅情况 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <SyncOutlined style={{ color: '#52c41a' }} />
                  <span>订阅情况</span>
                </Space>
              }
              hoverable
            >
              <Statistic
                title="活跃订阅数"
                value={stats.subscriptions.active}
                prefix={<SyncOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 32 }}
              />
            </Card>
          </Col>

          {/* 数据源状态 */}
          {stats.dataSources && (
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <DatabaseOutlined style={{ color: '#1890ff' }} />
                    <span>数据源状态</span>
                  </Space>
                }
                hoverable
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="总数"
                      value={stats.dataSources.total}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="已启用"
                      value={stats.dataSources.enabled}
                      valueStyle={{ color: '#1890ff', fontSize: 20 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="健康"
                      value={stats.dataSources.healthy}
                      valueStyle={{ color: '#3f8600', fontSize: 20 }}
                    />
                  </Col>
                </Row>
                {stats.dataSources.unhealthy > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Tag color="error">
                      <WarningOutlined /> {stats.dataSources.unhealthy} 个数据源异常
                    </Tag>
                  </div>
                )}
                <Divider style={{ margin: '16px 0' }} />
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {stats.dataSources.sources.map((source) => (
                    <div key={source.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Text strong>{source.displayName}</Text>
                        {getHealthStatusTag(source.healthStatus)}
                        {source.enabled ? (
                          <Tag color="success">已启用</Tag>
                        ) : (
                          <Tag>已禁用</Tag>
                        )}
                      </Space>
                      {source.lastSyncAt && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(source.lastSyncAt).toLocaleString()}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}
        </Row>

        {/* ========== 内容分布可视化 ========== */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: '#722ed1' }} />
              <span>内容类型分布</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16}>
            {[
              { key: 'papers', label: '论文', value: stats.content.papers.total, color: '#1890ff' },
              { key: 'videos', label: '视频', value: stats.content.videos.total, color: '#52c41a' },
              { key: 'repos', label: 'GitHub项目', value: stats.content.repos.total, color: '#722ed1' },
              { key: 'jobs', label: '招聘岗位', value: stats.content.jobs, color: '#fa8c16' },
              { key: 'huggingface', label: 'HuggingFace模型', value: stats.content.huggingface, color: '#eb2f96' },
            ].map((item) => {
              const percentage = stats.content.total > 0 
                ? (item.value / stats.content.total * 100).toFixed(1) 
                : '0';
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={item.key} style={{ marginBottom: 16 }}>
                  <Card size="small" hoverable>
                    <Statistic
                      title={item.label}
                      value={item.value}
                      valueStyle={{ color: item.color, fontSize: 20 }}
                    />
                    <Progress
                      percent={parseFloat(percentage)}
                      strokeColor={item.color}
                      showInfo={false}
                      style={{ marginTop: 8 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {percentage}%
                    </Text>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* ========== 最近同步的内容 ========== */}
        {stats.recentItems && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* 最近同步的GitHub仓库 */}
            {stats.recentItems.repos && stats.recentItems.repos.length > 0 && (
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <GithubOutlined style={{ color: '#722ed1' }} />
                      <span>最近同步的GitHub仓库</span>
                    </Space>
                  }
                  hoverable
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.recentItems.repos.map((repo: any) => (
                      <Card
                        key={repo.id}
                        size="small"
                        hoverable
                        style={{ marginBottom: 8 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ 
                            fontSize: 32,
                            lineHeight: 1,
                            flexShrink: 0,
                            color: '#722ed1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <GithubOutlined style={{ fontSize: 32 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {repo.fullName || repo.name}
                            </div>
                            {repo.description && (
                              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {repo.description}
                              </div>
                            )}
                            <Space size={12} style={{ fontSize: 12, color: '#666' }}>
                              {repo.starsCount !== undefined && repo.starsCount > 0 && (
                                <span>⭐ {repo.starsCount.toLocaleString()}</span>
                              )}
                              {repo.language && (
                                <span>💻 {repo.language}</span>
                              )}
                              {repo.viewCount !== undefined && repo.viewCount > 0 && (
                                <span>👁️ {repo.viewCount}</span>
                              )}
                            </Space>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </Col>
            )}

            {/* 最近同步的论文 */}
            {stats.recentItems.papers && stats.recentItems.papers.length > 0 && (
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#1890ff' }} />
                      <span>最近同步的论文</span>
                    </Space>
                  }
                  hoverable
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.recentItems.papers.map((paper: any) => (
                      <Card
                        key={paper.id}
                        size="small"
                        hoverable
                        style={{ marginBottom: 8 }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {paper.title}
                        </div>
                        <Space size={12} style={{ fontSize: 12, color: '#666' }}>
                          {paper.citationCount !== undefined && paper.citationCount > 0 && (
                            <span>📚 {paper.citationCount} 引用</span>
                          )}
                          {paper.viewCount !== undefined && paper.viewCount > 0 && (
                            <span>👁️ {paper.viewCount}</span>
                          )}
                          {paper.publishedDate && (
                            <span>📅 {new Date(paper.publishedDate).toLocaleDateString('zh-CN')}</span>
                          )}
                        </Space>
                      </Card>
                    ))}
                  </div>
                </Card>
              </Col>
            )}
          </Row>
        )}
      </Spin>
    </div>
  );
}
