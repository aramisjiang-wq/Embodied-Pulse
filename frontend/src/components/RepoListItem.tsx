'use client';

import { GithubRepo } from '@/lib/api/types';
import { Tag, Button, Space, Tooltip } from 'antd';
import { StarOutlined, StarFilled, ForkOutlined, EyeOutlined, LinkOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { parseTopics } from '@/lib/utils/jsonParse';
import { formatNumber } from '@/lib/utils/format';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface RepoListItemProps {
  repo: GithubRepo;
  isFavorite: boolean;
  onToggleFavorite: (repoId: string) => void;
}

export default function RepoListItem({ repo, isFavorite, onToggleFavorite }: RepoListItemProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(repo.id);
  };

  const topics = parseTopics(repo.topics, 5);

  const formatRelativeTime = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={repo.htmlUrl || (repo.fullName ? `https://github.com/${repo.fullName}` : '#')}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.5,
              marginBottom: 8,
              color: '#262626',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <LinkOutlined style={{ fontSize: 14 }} />
            <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {repo.fullName}
            </span>
          </div>

          <div
            style={{
              color: '#595959',
              fontSize: 14,
              marginBottom: 12,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
            }}
          >
            {repo.description || '暂无描述'}
          </div>

          <div style={{ marginBottom: 12 }}>
            {repo.language && (
              <Tag color="geekblue" style={{ fontSize: 12, marginBottom: 4, marginRight: 6, borderRadius: 4, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                {repo.language}
              </Tag>
            )}
            {topics.map((topic: string) => (
              <Tag key={topic} color="blue" style={{ fontSize: 12, marginBottom: 4, marginRight: 6, borderRadius: 4, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                {topic}
              </Tag>
            ))}
          </div>

          <Space size={20} style={{ fontSize: 13, color: '#8c8c8c' }}>
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
            <Tooltip title="更新时间">
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ClockCircleOutlined style={{ fontSize: 12 }} />
                {formatRelativeTime(repo.updatedDate)}
              </span>
            </Tooltip>
          </Space>
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
        <Button
          size="small"
          icon={isFavorite ? <StarFilled /> : <StarOutlined />}
          type={isFavorite ? 'primary' : 'default'}
          onClick={handleFavoriteClick}
          style={{ borderRadius: 6, height: 32, fontSize: 13 }}
        >
          {isFavorite ? '已收藏' : '收藏'}
        </Button>
      </div>
    </div>
  );
}
