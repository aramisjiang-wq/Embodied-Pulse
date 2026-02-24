'use client';

import { useState, useEffect } from 'react';
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
  CrownOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Post, Comment } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import EditPostModal from '@/components/EditPostModal';
import { getLevelBadge, getLevelProgress, getLevelByPoints } from '@/lib/utils/levelUtils';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDateStyle } from '@/lib/utils/dateUtils';
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
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { message } = App.useApp();
  const typeConfig = POST_TYPE_CONFIG[post.contentType as keyof typeof POST_TYPE_CONFIG] || POST_TYPE_CONFIG.discussion;
  const isOwner = user?.id === post.userId;
  const userLevel = getLevelByPoints(post.user.points || 0);
  const levelBadge = getLevelBadge(userLevel.level);
  const levelProgress = getLevelProgress(post.user.points || 0);
  const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
  );

  useEffect(() => {
    // 加载最新的2条评论用于预览
    if (post.commentCount > 0) {
      setLoadingComments(true);
      communityApi.getComments(post.id, { page: 1, size: 2 })
        .then((data) => {
          setComments(data.items || []);
        })
        .catch(() => {
          // 静默失败，不影响主流程
        })
        .finally(() => {
          setLoadingComments(false);
        });
    }
  }, [post.id, post.commentCount]);

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
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#ffffff',
        }}
        styles={{
          body: {
            padding: '18px 20px',
          },
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = '#f97316';
          e.currentTarget.style.transform = 'translateY(-2px)';
          router.prefetch(`/community/${post.id}`);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <Link href={`/user/${post.user.id}`}>
              <span
                onMouseEnter={(e) => {
                  const el = e.currentTarget.querySelector('span');
                  if (el) {
                    el.style.borderColor = '#f97316';
                    el.style.transform = 'scale(1.05)';
                    el.style.boxShadow = '0 2px 8px rgba(249, 115, 22, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget.querySelector('span');
                  if (el) {
                    el.style.borderColor = '#e5e7eb';
                    el.style.transform = 'scale(1)';
                    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                  }
                }}
              >
                <Avatar 
                  src={post.user.avatarUrl || (post.user as { avatar?: string }).avatar} 
                  size={44} 
                  icon={<UserOutlined />}
                  style={{ 
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </span>
            </Link>
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <Link
                  href={`/user/${post.user.id}`}
                  style={{ 
                    fontSize: 15, 
                    fontWeight: 600, 
                    color: '#1f2937', 
                    textDecoration: 'none',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1f2937';
                  }}
                >
                  {post.user.username}
                </Link>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
                  {formatRelativeTime(post.createdAt)}
                </span>
                <Tag 
                  style={{ 
                    fontSize: 11, 
                    padding: '2px 8px', 
                    margin: 0, 
                    height: 22, 
                    lineHeight: '18px',
                    borderRadius: 6,
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#4b5563',
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
                      borderRadius: 4,
                      fontWeight: 400
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
                      borderRadius: 4,
                      fontWeight: 400
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
                color: '#111827',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                letterSpacing: '-0.1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f97316';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#111827';
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
              color: '#4b5563',
              lineHeight: 1.7,
              marginBottom: 14,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              cursor: 'pointer',
              fontWeight: 400
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
                    fontSize: 11, 
                    padding: '2px 8px', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#4b5563',
                    transition: 'all 0.2s',
                    fontWeight: 400
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffedd5';
                    e.currentTarget.style.borderColor = '#fdba74';
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#4b5563';
                  }}
                >
                  #{tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 评论预览 */}
        {comments.length > 0 && (
          <div style={{ 
            marginTop: 12, 
            marginBottom: 12, 
            padding: '12px 14px', 
            background: '#f9fafb', 
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
              最新评论 ({post.commentCount || 0})
            </div>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {comments.map((comment) => (
                <div key={comment.id} style={{ display: 'flex', gap: 8 }}>
                  <Avatar 
                    size={24} 
                    src={comment.user?.avatarUrl} 
                    icon={<UserOutlined />}
                    style={{ flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1f2937', marginBottom: 2 }}>
                      {comment.user?.username}
                    </div>
                    <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </Space>
            {post.commentCount > comments.length && (
              <Link href={`/community/${post.id}`} style={{ display: 'block', marginTop: 8 }}>
                <Button 
                  type="text" 
                  size="small"
                  style={{ 
                    fontSize: 12, 
                    color: '#f97316',
                    padding: 0,
                    height: 'auto'
                  }}
                >
                  查看全部 {post.commentCount} 条评论 →
                </Button>
              </Link>
            )}
          </div>
        )}

        <Divider style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />

        <Space size={20} wrap>
          <Tooltip title="点赞">
            <Button
              type="text"
              icon={<LikeOutlined style={{ fontSize: 14 }} />}
              onClick={() => onLike(post.id)}
              style={{ 
                color: '#6b7280', 
                fontSize: 12, 
                padding: '4px 8px', 
                height: 30,
                borderRadius: 6,
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {post.likeCount || 0}
            </Button>
          </Tooltip>
          <Link href={`/community/${post.id}`}>
            <Tooltip title="评论">
              <Button
                type="text"
                icon={<CommentOutlined style={{ fontSize: 14 }} />}
                style={{ 
                  color: '#6b7280', 
                  fontSize: 12, 
                  padding: '4px 8px', 
                  height: 30,
                  borderRadius: 6,
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f97316';
                  e.currentTarget.style.background = '#fff7ed';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {post.commentCount || 0}
              </Button>
            </Tooltip>
          </Link>
          <Tooltip title="收藏">
            <Button
              type="text"
              icon={isFavorited ? <StarFilled style={{ color: '#f59e0b', fontSize: 14 }} /> : <StarOutlined style={{ fontSize: 14 }} />}
              onClick={handleFavorite}
              loading={favoriteLoading}
              style={{ 
                color: isFavorited ? '#f59e0b' : '#6b7280', 
                fontSize: 12, 
                padding: '4px 8px', 
                height: 30,
                borderRadius: 6,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                background: isFavorited ? '#fffbeb' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isFavorited) {
                  e.currentTarget.style.color = '#f59e0b';
                  e.currentTarget.style.background = '#fffbeb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isFavorited) {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {isFavorited ? '已收藏' : '收藏'}
            </Button>
          </Tooltip>
          <Tooltip title="分享">
            <Button
              type="text"
              icon={<ShareAltOutlined style={{ fontSize: 14 }} />}
              onClick={() => onShare(post)}
              style={{ 
                color: '#6b7280', 
                fontSize: 12, 
                padding: '4px 8px', 
                height: 30,
                borderRadius: 6,
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#10b981';
                e.currentTarget.style.background = '#ecfdf5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {post.shareCount || 0}
            </Button>
          </Tooltip>
          <Tooltip title="浏览">
            <span style={{ 
              color: '#6b7280', 
              fontSize: 12, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 5,
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: 6
            }}>
              <EyeOutlined style={{ fontSize: 14 }} />
              {post.viewCount || 0}
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
