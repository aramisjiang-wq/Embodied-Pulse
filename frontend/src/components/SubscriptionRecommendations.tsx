'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Tag, Empty, Spin, Row, Col, Typography, App, Progress, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  ThunderboltOutlined, 
  FireOutlined,
  RiseOutlined,
  ReloadOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { subscriptionApi, Subscription } from '@/lib/api/subscription';

const { Text, Paragraph } = Typography;

interface Recommendation {
  type: 'hot' | 'trending' | 'suggested';
  title: string;
  contentType: string;
  keywords: string[];
  tags?: string[];
  authors?: string[];
  reason: string;
  confidence: number;
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  paper:       { label: '论文',     icon: <FileTextOutlined />,   color: '#7c3aed' },
  video:       { label: '视频',     icon: <PlayCircleOutlined />, color: '#dc2626' },
  repo:        { label: 'GitHub',   icon: <GithubOutlined />,     color: '#374151' },
  huggingface: { label: 'HF 模型', icon: <RobotOutlined />,      color: '#d97706' },
  job:         { label: '招聘',     icon: <TeamOutlined />,       color: '#0891b2' },
};

const REC_META = {
  hot:       { label: '热门',   icon: <FireOutlined />,         color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  trending:  { label: '趋势',   icon: <RiseOutlined />,         color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  suggested: { label: '智能',   icon: <ThunderboltOutlined />,  color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
};

export function SubscriptionRecommendations({ onCreateSubscription }: { onCreateSubscription: (data: {
  contentType: string;
  keywords: string[];
  tags?: string[];
  authors?: string[];
  notifyEnabled: boolean;
}) => Promise<void> }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<Set<string>>(new Set());
  const { message } = App.useApp();

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subscriptionApi.getSubscriptions({ page: 1, size: 100 });
      const subscriptions = Array.isArray(data) ? data : (data.items || []);
      setRecommendations(generateRecommendations(subscriptions));
    } catch (error: unknown) {
      console.error('Load recommendations error:', error);
      message.error('加载推荐失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const generateRecommendations = (subscriptions: Subscription[]): Recommendation[] => {
    const recs: Recommendation[] = [];

    const contentTypeCount = subscriptions.reduce((acc, sub) => {
      acc[sub.contentType] = (acc[sub.contentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allKeywords = subscriptions.flatMap((sub) => {
      if (!sub.keywords) return [];
      try {
        const parsed = JSON.parse(sub.keywords) as unknown;
        return Array.isArray(parsed) ? parsed.filter((kw): kw is string => typeof kw === 'string') : [];
      } catch { return []; }
    });
    const keywordFreq = allKeywords.reduce((acc, kw) => {
      acc[kw] = (acc[kw] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allTags = subscriptions.flatMap((sub) => {
      if (!sub.tags) return [];
      try {
        const parsed = JSON.parse(sub.tags) as unknown;
        return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
      } catch { return []; }
    });
    const tagFreq = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topContentType = Object.entries(contentTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'paper';
    const hotKeywords = (Object.entries(keywordFreq) as [string, number][])
      .sort((a, b) => b[1] - a[1]).slice(0, 10).map(([kw]) => kw);
    const trendingTags = (Object.entries(tagFreq) as [string, number][])
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);

    const embodiedAIKeywords = [
      'embodied AI', 'robotics', 'computer vision', 'deep learning',
      'reinforcement learning', 'navigation', 'manipulation', 'SLAM',
      'human-robot interaction', 'multi-agent', 'simulation',
    ];

    recs.push(...hotKeywords.slice(0, 3).map((keyword, idx) => ({
      type: 'hot' as const,
      title: keyword,
      contentType: topContentType,
      keywords: [keyword, ...embodiedAIKeywords.slice(idx, idx + 2)],
      reason: `该关键词在您的历史订阅中出现 ${keywordFreq[keyword]} 次`,
      confidence: Math.min(0.95, 0.85 - idx * 0.05),
    })));

    recs.push(...trendingTags.slice(0, 2).map((tag, idx) => ({
      type: 'trending' as const,
      title: tag,
      contentType: topContentType,
      keywords: [tag],
      tags: [tag, ...trendingTags.slice(idx + 1, idx + 3)],
      reason: '该标签在相关内容中较为流行',
      confidence: Math.min(0.95, 0.75 - idx * 0.05),
    })));

    recs.push(...embodiedAIKeywords.slice(0, 3).map((keyword, idx) => ({
      type: 'suggested' as const,
      title: keyword,
      contentType: topContentType,
      keywords: [keyword, ...embodiedAIKeywords.slice(idx + 3, idx + 5)],
      reason: hotKeywords.some(kw => kw.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(kw.toLowerCase()))
        ? '基于您的订阅历史推荐'
        : 'Embodied AI 热门研究方向',
      confidence: Math.min(0.95, 0.65 - idx * 0.05),
    })));

    return recs.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
  };

  const handleCreate = async (rec: Recommendation) => {
    const recId = `${rec.type}-${rec.title}`;
    if (creating.has(recId)) return;
    try {
      setCreating(prev => new Set(prev).add(recId));
      await onCreateSubscription({
        contentType: rec.contentType,
        keywords: rec.keywords,
        tags: rec.tags,
        authors: rec.authors,
        notifyEnabled: true,
      });
      message.success('订阅创建成功');
      loadRecommendations();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '创建订阅失败');
    } finally {
      setCreating(prev => {
        const s = new Set(prev);
        s.delete(recId);
        return s;
      });
    }
  };

  const confidenceColor = (v: number) => {
    if (v >= 0.8) return '#52c41a';
    if (v >= 0.6) return '#faad14';
    return '#1677ff';
  };

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 16 }} />
          <Text strong style={{ fontSize: 15 }}>订阅推荐</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>基于您的订阅历史和热门趋势</Text>
        </div>
        <Tooltip title="刷新推荐">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined spin={loading} />}
            onClick={loadRecommendations}
            disabled={loading}
          />
        </Tooltip>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin size="default" />
        </div>
      ) : recommendations.length === 0 ? (
        <Empty description="暂无推荐" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Row gutter={[12, 12]}>
          {recommendations.map((rec, idx) => {
            const recMeta = REC_META[rec.type];
            const typeMeta = TYPE_META[rec.contentType];
            const recId = `${rec.type}-${rec.title}`;
            const pct = Math.round(rec.confidence * 100);

            return (
              <Col xs={24} sm={12} lg={8} key={`${rec.type}-${idx}`} style={{ display: 'flex' }}>
                <Card
                  hoverable
                  style={{
                    flex: 1,
                    borderTop: `3px solid ${recMeta.color}`,
                    borderRadius: 8,
                  }}
                  styles={{ body: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, height: '100%' } }}
                >
                  {/* Top row: type badge + content type */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Tag
                      icon={recMeta.icon}
                      style={{
                        margin: 0,
                        fontSize: 12,
                        padding: '2px 8px',
                        color: recMeta.color,
                        background: recMeta.bg,
                        border: `1px solid ${recMeta.border}`,
                        borderRadius: 4,
                        fontWeight: 500,
                      }}
                    >
                      {recMeta.label}推荐
                    </Tag>
                    {typeMeta && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: typeMeta.color }}>
                        {typeMeta.icon}
                        <span>{typeMeta.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <Text strong style={{ fontSize: 14, lineHeight: 1.5, display: 'block' }}>
                    {rec.title}
                  </Text>

                  {/* Reason */}
                  <Paragraph
                    type="secondary"
                    style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {rec.reason}
                  </Paragraph>

                  {/* Keywords */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {rec.keywords.slice(0, 4).map((kw, kidx) => (
                      <Tag
                        key={kidx}
                        style={{ margin: 0, fontSize: 11, padding: '1px 6px', borderRadius: 3, maxWidth: 120 }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {kw}
                        </span>
                      </Tag>
                    ))}
                    {rec.keywords.length > 4 && (
                      <Tag style={{ margin: 0, fontSize: 11, padding: '1px 6px', borderRadius: 3, color: '#8c8c8c', borderColor: '#d9d9d9' }}>
                        +{rec.keywords.length - 4}
                      </Tag>
                    )}
                  </div>

                  {/* Confidence */}
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>匹配置信度</Text>
                      <Text style={{ fontSize: 12, fontWeight: 600, color: confidenceColor(rec.confidence) }}>
                        {pct}%
                      </Text>
                    </div>
                    <Progress
                      percent={pct}
                      showInfo={false}
                      size={['100%', 4]}
                      strokeColor={confidenceColor(rec.confidence)}
                      trailColor="#f0f0f0"
                    />
                  </div>

                  {/* CTA Button */}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    block
                    style={{ marginTop: 4 }}
                    loading={creating.has(recId)}
                    onClick={() => handleCreate(rec)}
                  >
                    一键创建订阅
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
