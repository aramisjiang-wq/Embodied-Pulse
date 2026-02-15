'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Space, Tag, Empty, Spin, Row, Col, Typography, App } from 'antd';
import { 
  PlusOutlined, 
  ThunderboltOutlined, 
  FireOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { subscriptionApi, Subscription } from '@/lib/api/subscription';

const { Title, Text } = Typography;

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
      
      const recs = generateRecommendations(subscriptions);
      setRecommendations(recs);
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
    const recommendations: Recommendation[] = [];
    
    const contentTypeCount = subscriptions.reduce((acc, sub) => {
      acc[sub.contentType] = (acc[sub.contentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allKeywords = subscriptions.flatMap((sub) => {
      if (!sub.keywords) return [];
      try {
        const parsed = JSON.parse(sub.keywords) as unknown;
        return Array.isArray(parsed) ? parsed.filter((kw): kw is string => typeof kw === 'string') : [];
      } catch {
        return [];
      }
    });
    const keywordFrequency = allKeywords.reduce((acc, kw) => {
      acc[kw] = (acc[kw] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allTags = subscriptions.flatMap((sub) => {
      if (!sub.tags) return [];
      try {
        const parsed = JSON.parse(sub.tags) as unknown;
        return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === 'string') : [];
      } catch {
        return [];
      }
    });
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topContentType = Object.entries(contentTypeCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'paper';

    const hotKeywords = (Object.entries(keywordFrequency) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);

    const trendingTags = (Object.entries(tagFrequency) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    const embodiedAIKeywords = [
      'embodied AI', 'robotics', 'computer vision', 'deep learning',
      'reinforcement learning', 'navigation', 'manipulation', 'SLAM',
      'human-robot interaction', 'multi-agent', 'simulation'
    ];

    const hotRecs = hotKeywords.slice(0, 3).map((keyword, idx) => ({
      type: 'hot' as const,
      title: `热门关键词: ${keyword}`,
      contentType: topContentType,
      keywords: [keyword, ...embodiedAIKeywords.slice(idx, idx + 2)],
      reason: `该关键词在您的历史订阅中出现${keywordFrequency[keyword]}次`,
      confidence: 0.8 + (idx * 0.05),
    }));

    const trendingRecs = trendingTags.slice(0, 2).map((tag, idx) => ({
      type: 'trending' as const,
      title: `热门标签: ${tag}`,
      contentType: topContentType,
      keywords: [tag],
      tags: [tag, ...trendingTags.slice(idx + 1, idx + 3)],
      reason: `该标签在相关内容中较为流行`,
      confidence: 0.7 + (idx * 0.05),
    }));

    const suggestedRecs = embodiedAIKeywords.slice(0, 3).map((keyword, idx) => {
      const hasSimilar = hotKeywords.some(kw => 
        kw.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(kw.toLowerCase())
      );
      
      return {
        type: 'suggested' as const,
        title: `推荐: ${keyword}`,
        contentType: topContentType,
        keywords: [keyword, ...embodiedAIKeywords.slice(idx + 3, idx + 5)],
        reason: hasSimilar ? '基于您的订阅历史推荐' : 'Embodied AI热门研究方向',
        confidence: 0.6 + (idx * 0.05),
      };
    });

    recommendations.push(...hotRecs, ...trendingRecs, ...suggestedRecs);
    
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
  };

  const handleCreateFromRecommendation = async (rec: Recommendation) => {
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
        const newSet = new Set(prev);
        newSet.delete(recId);
        return newSet;
      });
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'hot':
        return <FireOutlined style={{ color: '#ff4d4f' }} />;
      case 'trending':
        return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'suggested':
        return <ThunderboltOutlined style={{ color: '#1890ff' }} />;
      default:
        return <ThunderboltOutlined />;
    }
  };

  const getRecommendationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hot: '热门推荐',
      trending: '趋势推荐',
      suggested: '智能推荐',
    };
    return labels[type] || type;
  };

  const getRecommendationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      hot: 'red',
      trending: 'green',
      suggested: 'blue',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <Empty
          description="暂无推荐"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          订阅推荐
        </Title>
        <Text type="secondary">
          基于您的订阅历史和热门趋势为您推荐
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {recommendations.map((rec, idx) => (
          <Col xs={24} sm={12} md={8} key={`${rec.type}-${idx}`}>
            <Card
              hoverable
              size="small"
              style={{ 
                height: '100%',
                borderLeft: `3px solid ${rec.type === 'hot' ? '#ff4d4f' : rec.type === 'trending' ? '#52c41a' : '#1890ff'}`,
              }}
              styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', gap: 12 } }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 28 }}>
                <Tag 
                  icon={getRecommendationIcon(rec.type)}
                  color={getRecommendationTypeColor(rec.type)}
                >
                  {getRecommendationTypeLabel(rec.type)}
                </Tag>
                <Tag color="default">
                  置信度: {(rec.confidence * 100).toFixed(0)}%
                </Tag>
              </div>

              <div style={{ minHeight: 40 }}>
                <Text strong style={{ fontSize: 14 }}>
                  {rec.title}
                </Text>
              </div>

              <div style={{ minHeight: 36 }}>
                <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {rec.reason}
                </Text>
              </div>

              <div style={{ minHeight: 44 }}>
                <Text strong style={{ fontSize: 12 }}>关键词：</Text>
                <Space size={[4, 4]} wrap>
                  {rec.keywords.slice(0, 3).map((kw, kidx) => (
                    <Tag key={kidx} style={{ fontSize: 11 }}>{kw}</Tag>
                  ))}
                  {rec.keywords.length > 3 && <Tag>+{rec.keywords.length - 3}</Tag>}
                </Space>
              </div>

              <div style={{ minHeight: 32 }}>
                {rec.tags && rec.tags.length > 0 ? (
                  <>
                    <Text strong style={{ fontSize: 12 }}>标签：</Text>
                    <Space size={[4, 4]} wrap>
                      {rec.tags.slice(0, 2).map((tag, tidx) => (
                        <Tag key={tidx} color="blue" style={{ fontSize: 11 }}>{tag}</Tag>
                      ))}
                      {rec.tags.length > 2 && <Tag>+{rec.tags.length - 2}</Tag>}
                    </Space>
                  </>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12, visibility: 'hidden' }}>占位</Text>
                )}
              </div>

              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                block
                style={{ marginTop: 'auto' }}
                loading={creating.has(`${rec.type}-${rec.title}`)}
                onClick={() => handleCreateFromRecommendation(rec)}
              >
                创建订阅
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
