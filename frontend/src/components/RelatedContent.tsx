'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, List, Tag, Space, Spin, Empty, Button } from 'antd';
import { FileTextOutlined, GithubOutlined, PlayCircleOutlined, RobotOutlined, RightOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { paperApi, repoApi, videoApi } from '@/lib/api';
import { Paper, GithubRepo, Video } from '@/lib/api/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface RelatedContentProps {
  currentId: string;
  type: 'paper' | 'repo' | 'video';
  categories?: string[];
  keywords?: string[];
  limit?: number;
}

type RelatedItem = Paper | GithubRepo | Video;

export default function RelatedContent({ currentId, type, limit = 5 }: RelatedContentProps) {
  const [loading, setLoading] = useState(false);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  const loadRelatedContent = useCallback(async () => {
    setLoading(true);
    try {
      const items: RelatedItem[] = [];

      if (type === 'paper') {
        const paperData = await paperApi.getPapers({ page: 1, size: limit * 2 });
        const papers = (paperData.items || []).filter((p: Paper) => p.id !== currentId);
        items.push(...papers.slice(0, limit));
      } else if (type === 'repo') {
        const repoData = await repoApi.getRepos({ page: 1, size: limit * 2 });
        const repos = (repoData.items || []).filter((r: GithubRepo) => r.id !== currentId);
        items.push(...repos.slice(0, limit));
      } else if (type === 'video') {
        const videoData = await videoApi.getVideos({ page: 1, size: limit * 2 });
        const videos = (videoData.items || []).filter((v: Video) => v.id !== currentId);
        items.push(...videos.slice(0, limit));
      }

      setRelatedItems(items);
    } catch (error) {
      console.error('加载相关内容失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentId, type, limit]);

  useEffect(() => {
    loadRelatedContent();
  }, [loadRelatedContent]);

  const getItemIcon = (item: RelatedItem) => {
    if ('arxivId' in item) {
      return <FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
    }
    if ('fullName' in item) {
      return <GithubOutlined style={{ color: '#722ed1', fontSize: 20 }} />;
    }
    if ('videoId' in item) {
      return <PlayCircleOutlined style={{ color: '#00a1d6', fontSize: 20 }} />;
    }
    return <RobotOutlined style={{ color: '#13c2c2', fontSize: 20 }} />;
  };

  const getItemLink = (item: RelatedItem) => {
    if ('arxivId' in item) {
      return `/papers/${item.id}`;
    }
    if ('fullName' in item) {
      return `/repos/${item.id}`;
    }
    if ('videoId' in item) {
      return `/videos/${item.id}`;
    }
    return '#';
  };

  const getItemTitle = (item: RelatedItem): string => {
    if ('title' in item) {
      return (item as Paper | Video).title;
    }
    if ('fullName' in item) {
      return (item as GithubRepo).fullName;
    }
    if ('name' in item) {
      return (item as GithubRepo).name;
    }
    return '无标题';
  };

  const getItemMeta = (item: RelatedItem) => {
    const meta: string[] = [];

    if ('citationCount' in item && item.citationCount) {
      meta.push(`引用 ${item.citationCount}`);
    }
    if ('starsCount' in item && item.starsCount) {
      meta.push(`⭐ ${item.starsCount}`);
    }
    if ('playCount' in item && item.playCount) {
      meta.push(`👁️ ${item.playCount}`);
    }
    if ('publishedDate' in item && (item as Paper | Video).publishedDate) {
      meta.push(dayjs((item as Paper | Video).publishedDate).fromNow());
    }
    if ('createdDate' in item && (item as GithubRepo).createdDate) {
      meta.push(dayjs((item as GithubRepo).createdDate).fromNow());
    }

    return meta;
  };

  const displayItems = showAll ? relatedItems : relatedItems.slice(0, 3);

  return (
    <Card
      title={
        <Space>
          <span>相关推荐</span>
          {relatedItems.length > 3 && (
            <Button
              type="link"
              size="small"
              onClick={() => setShowAll(!showAll)}
              icon={<RightOutlined rotate={showAll ? 270 : 0} />}
            >
              {showAll ? '收起' : '查看更多'}
            </Button>
          )}
        </Space>
      }
      style={{ marginTop: 24 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : relatedItems.length === 0 ? (
        <Empty description="暂无相关内容" />
      ) : (
        <List
          dataSource={displayItems}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{ 
                padding: '16px 0',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fafafa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Link href={getItemLink(item)} style={{ width: '100%', display: 'block' }}>
                <Space size="middle" align="start" style={{ width: '100%' }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {getItemIcon(item)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        marginBottom: 8,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getItemTitle(item)}
                    </div>
                    {'abstract' in item && item.abstract && (
                      <div
                        style={{
                          fontSize: 13,
                          color: '#666',
                          marginBottom: 8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.abstract}
                      </div>
                    )}
                    {'description' in item && item.description && (
                      <div
                        style={{
                          fontSize: 13,
                          color: '#666',
                          marginBottom: 8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                    <Space size="small" wrap>
                      {getItemMeta(item).map((meta, index) => (
                        <Tag key={index} color="default" style={{ fontSize: 12 }}>
                          {meta}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Space>
              </Link>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
