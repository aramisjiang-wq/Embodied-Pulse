'use client';

import { GithubRepo } from '@/lib/api/types';
import { Card, Tag, Button, Space, Tooltip } from 'antd';
import { StarOutlined, StarFilled, ForkOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { parseTopics } from '@/lib/utils/jsonParse';
import { formatNumber } from '@/lib/utils/format';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface RepoCardProps {
  repo: GithubRepo;
  isFavorite: boolean;
  onToggleFavorite: (repoId: string) => void;
}

export default function RepoCard({ repo, isFavorite, onToggleFavorite }: RepoCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(repo.id);
  };

  const topics = parseTopics(repo.topics, 3);

  const formatRelativeTime = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
        transition: 'all 0.3s',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
      styles={{
        body: {
          padding: 20,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <a
        href={repo.htmlUrl || (repo.fullName ? `https://github.com/${repo.fullName}` : '#')}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.5,
            marginBottom: 8,
            color: '#262626',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {repo.name}
        </div>

        <div
          style={{
            fontSize: 13,
            color: '#61666d',
            marginBottom: 12,
            fontWeight: 400,
          }}
        >
          {repo.owner || 'unknown'}
        </div>

        {repo.description && (
          <div
            style={{
              fontSize: 13,
              color: '#595959',
              marginBottom: 12,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
              minHeight: 39,
            }}
          >
            {repo.description}
          </div>
        )}

        <div style={{ marginBottom: 12, minHeight: 28 }}>
          {topics.length > 0 && topics.map((topic: string) => (
            <Tag key={topic} color="blue" style={{ fontSize: 12, marginBottom: 4, borderRadius: 4, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {topic}
            </Tag>
          ))}
          {topics.length === 0 && repo.language && (
            <Tag color="geekblue" style={{ fontSize: 12, marginBottom: 4, borderRadius: 4, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {repo.language}
            </Tag>
          )}
        </div>

        <div
          style={{
            paddingTop: 12,
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Space size={16} style={{ fontSize: 13, color: '#8c8c8c' }}>
            {repo.starsCount && repo.starsCount > 0 && (
              <Tooltip title="Stars">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <StarOutlined style={{ fontSize: 12 }} />
                  {formatNumber(repo.starsCount)}
                </span>
              </Tooltip>
            )}
            {repo.forksCount && repo.forksCount > 0 && (
              <Tooltip title="Forks">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ForkOutlined style={{ fontSize: 12 }} />
                  {formatNumber(repo.forksCount)}
                </span>
              </Tooltip>
            )}
            {repo.viewCount && repo.viewCount > 0 && (
              <Tooltip title="Views">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EyeOutlined style={{ fontSize: 12 }} />
                  {formatNumber(repo.viewCount)}
                </span>
              </Tooltip>
            )}
          </Space>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 8,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Space size={12} style={{ fontSize: 12, color: '#8c8c8c' }}>
            {repo.createdDate && (
              <Tooltip title="创建时间">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockCircleOutlined style={{ fontSize: 11 }} />
                  创建于 {formatRelativeTime(repo.createdDate)}
                </span>
              </Tooltip>
            )}
            {repo.updatedDate && (
              <Tooltip title="更新时间">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockCircleOutlined style={{ fontSize: 11 }} />
                  更新于 {formatRelativeTime(repo.updatedDate)}
                </span>
              </Tooltip>
            )}
          </Space>
          <Button
            size="small"
            icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            type={isFavorite ? 'primary' : 'default'}
            onClick={handleFavoriteClick}
            style={{ borderRadius: 6, fontSize: 13, height: 32 }}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>
        </div>
      </a>
    </Card>
  );
}
