'use client';

import { useState } from 'react';
import { Card, Avatar, Space, Tag, Button, Tooltip, Divider, Dropdown, Modal, App, Progress } from 'antd';
import { 
  LikeOutlined, 
  CommentOutlined, 
  ShareAltOutlined, 
  EyeOutlined, 
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  StarOutlined,
  StarFilled,
  CrownOutlined
} from '@ant-design/icons';
import { Post } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import EditPostModal from '@/components/EditPostModal';
import { getLevelBadge, getLevelProgress } from '@/lib/utils/levelUtils';
import dayjs from 'dayjs';
import Link from 'next/link';
import type { MenuProps } from 'antd';

const formatRelativeTime = (date: string): string => {
  const now = dayjs();
  const postDate = dayjs(date);
  const diffMinutes = now.diff(postDate, 'minute');
  const diffHours = now.diff(postDate, 'hour');
  const diffDays = now.diff(postDate, 'day');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return postDate.format('YYYY-MM-DD');
};

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onShare: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
}

const POST_TYPE_CONFIG = {
  tech: { icon: '💻', label: '技术讨论', color: '#1890ff' },
  resource: { icon: '📦', label: '资源分享', color: '#52c41a' },
  jobs: { icon: '💼', label: '求职招聘', color: '#faad14' },
  activity: { icon: '🎯', label: '活动交流', color: '#ff4d4f' },
  discussion: { icon: '💬', label: '讨论', color: '#1890ff' },
  paper: { icon: '📄', label: '论文分享', color: '#1890ff' },
  video: { icon: '🎬', label: '视频分享', color: '#52c41a' },
  repo: { icon: '🔧', label: '项目推荐', color: '#52c41a' },
  model: { icon: '🤖', label: '模型推荐', color: '#faad14' },
  event: { icon: '📅', label: '活动信息', color: '#ff4d4f' },
  job: { icon: '💼', label: '招聘信息', color: '#faad14' },
};

export default function PostCard({ post, onLike, onShare, onDelete, onEdit }: PostCardProps) {
  const { user } = useAuthStore();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { message } = App.useApp();
  const typeConfig = POST_TYPE_CONFIG[post.contentType as keyof typeof POST_TYPE_CONFIG] || POST_TYPE_CONFIG.discussion;
  const isOwner = user?.id === post.userId;
  const levelBadge = getLevelBadge(post.user.level || 1);
  const levelProgress = getLevelProgress(post.user.points || 0);
  const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
  );

  const handleFavorite = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await communityApi.deleteFavorite('post', post.id);
        message.success('已取消收藏');
        setIsFavorited(false);
      } else {
        await communityApi.createFavorite({ contentType: 'post', contentId: post.id });
        message.success('收藏成功！+5积分');
        setIsFavorited(true);
      }
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '操作失败'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条帖子吗？此操作不可恢复。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await communityApi.deletePost(post.id);
          message.success('删除成功');
          onDelete?.(post.id);
        } catch (error: unknown) {
          message.error(getErrorMessage(error, '删除失败'));
        }
      },
    });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => setEditModalOpen(true),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
      <Card
        hoverable
        style={{
          borderRadius: 12,
          marginBottom: 16,
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
        }}
        styles={{
          body: {
            padding: '20px',
          },
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <Link href={`/user/${post.user.id}`}>
              <div style={{ position: 'relative' }}>
                <Avatar 
                  src={post.user.avatarUrl} 
                  size={44} 
                  style={{ 
                    border: `2px solid ${levelBadge.color}`,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 12,
                  lineHeight: 1,
                }}>
                  {levelBadge.icon}
                </div>
              </div>
            </Link>
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <Link
                  href={`/user/${post.user.id}`}
                  style={{ fontSize: 15, fontWeight: 600, color: '#262626', textDecoration: 'none' }}
                >
                  {post.user.username}
                </Link>
                <Tag 
                  style={{ 
                    fontSize: 11, 
                    padding: '0 8px', 
                    margin: 0, 
                    height: 20, 
                    lineHeight: '20px',
                    borderRadius: 10,
                    background: levelBadge.color,
                    border: 'none',
                    color: '#fff',
                    fontWeight: 500
                  }}
                >
                  {levelBadge.icon} LV{post.user.level} {levelBadge.name}
                </Tag>
                <span style={{ color: '#999', fontSize: 12 }}>
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 60, height: 4 }}>
                  <Progress 
                    percent={levelProgress} 
                    size="small" 
                    showInfo={false}
                    strokeColor={levelBadge.color}
                    trailColor="#f0f0f0"
                  />
                </div>
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                  {post.user.points || 0}积分
                </span>
                <Tag 
                  style={{ 
                    fontSize: 11, 
                    padding: '0 8px', 
                    margin: 0, 
                    height: 20, 
                    lineHeight: '20px',
                    borderRadius: 10,
                    background: typeConfig.color,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 500
                  }}
                >
                  {typeConfig.icon} {typeConfig.label}
                </Tag>
                {post.isTop && (
                  <Tag 
                    color="red" 
                    style={{ 
                      fontSize: 11, 
                      padding: '0 6px', 
                      margin: 0, 
                      height: 20, 
                      lineHeight: '20px',
                      borderRadius: 10,
                      fontWeight: 500
                    }}
                  >
                    置顶
                  </Tag>
                )}
                {post.isFeatured && (
                  <Tag 
                    color="gold" 
                    style={{ 
                      fontSize: 11, 
                      padding: '0 6px', 
                      margin: 0, 
                      height: 20, 
                      lineHeight: '20px',
                      borderRadius: 10,
                      fontWeight: 500
                    }}
                  >
                    精华
                  </Tag>
                )}
              </div>
            </div>
          </div>
          {isOwner && (
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button 
                type="text" 
                icon={<MoreOutlined />} 
                style={{ color: '#999' }}
              />
            </Dropdown>
          )}
        </div>

        {post.title && (
          <Link href={`/community/${post.id}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                marginBottom: 10,
                color: '#262626',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              {post.title}
            </div>
          </Link>
        )}

        <Link href={`/community/${post.id}`} style={{ textDecoration: 'none' }}>
          <div
            style={{
              fontSize: 14,
              color: '#595959',
              lineHeight: 1.8,
              marginBottom: 14,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {post.content}
          </div>
        </Link>

        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Space size={6} wrap>
              {post.tags.map((tag: string) => (
                <Tag 
                  key={tag} 
                  style={{ 
                    fontSize: 12, 
                    padding: '2px 10px', 
                    borderRadius: 12, 
                    cursor: 'pointer',
                    background: '#f5f5f5',
                    border: '1px solid #e8e8e8',
                    color: '#666',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e6f7ff';
                    e.currentTarget.style.borderColor = '#91d5ff';
                    e.currentTarget.style.color = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  #{tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <Space size={24}>
          <Tooltip title="点赞">
            <Button
              type="text"
              icon={<LikeOutlined style={{ fontSize: 16 }} />}
              onClick={() => onLike(post.id)}
              style={{ color: '#8c8c8c', fontSize: 13 }}
            >
              {post.likeCount}
            </Button>
          </Tooltip>
          <Link href={`/community/${post.id}`}>
            <Tooltip title="评论">
              <Button
                type="text"
                icon={<CommentOutlined style={{ fontSize: 16 }} />}
                style={{ color: '#8c8c8c', fontSize: 13 }}
              >
                {post.commentCount}
              </Button>
            </Tooltip>
          </Link>
          <Tooltip title="收藏">
            <Button
              type="text"
              icon={isFavorited ? <StarFilled style={{ color: '#faad14', fontSize: 16 }} /> : <StarOutlined style={{ fontSize: 16 }} />}
              onClick={handleFavorite}
              loading={favoriteLoading}
              style={{ color: isFavorited ? '#faad14' : '#8c8c8c', fontSize: 13 }}
            >
              {isFavorited ? '已收藏' : '收藏'}
            </Button>
          </Tooltip>
          <Tooltip title="分享">
            <Button
              type="text"
              icon={<ShareAltOutlined style={{ fontSize: 16 }} />}
              onClick={() => onShare(post)}
              style={{ color: '#8c8c8c', fontSize: 13 }}
            >
              {post.shareCount}
            </Button>
          </Tooltip>
          <Tooltip title="浏览">
            <span style={{ color: '#8c8c8c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <EyeOutlined style={{ fontSize: 16 }} />
              {post.viewCount}
            </span>
          </Tooltip>
        </Space>
      </Card>

      <EditPostModal
        open={editModalOpen}
        postId={post.id}
        initialData={{
          title: post.title,
          content: post.content,
          contentType: post.contentType,
          tags: post.tags,
        }}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false);
          onEdit?.(post.id);
        }}
      />
    </>
  );
}
