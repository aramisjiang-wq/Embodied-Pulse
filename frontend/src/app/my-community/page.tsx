'use client';

import { useEffect, useState } from 'react';
import { Spin, Modal, Input, Select, App } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
  LikeOutlined,
  EyeOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import Link from 'next/link';
import PageContainer from '@/components/PageContainer';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './page.module.css';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Option } = Select;

const POST_TYPES = [
  { value: 'tech',     label: '技术讨论', icon: '💻', color: '#1677ff', bg: '#e6f4ff' },
  { value: 'resource', label: '资源分享', icon: '📦', color: '#389e0d', bg: '#f6ffed' },
  { value: 'jobs',     label: '求职招聘', icon: '💼', color: '#d46b08', bg: '#fff7e6' },
  { value: 'activity', label: '活动交流', icon: '🎯', color: '#cf1322', bg: '#fff1f0' },
] as const;

type PostTypeValue = typeof POST_TYPES[number]['value'];

const TYPE_MAP = Object.fromEntries(POST_TYPES.map(t => [t.value, t])) as Record<
  string,
  { value: string; label: string; icon: string; color: string; bg: string }
>;

function getTypeConfig(contentType: string) {
  return TYPE_MAP[contentType] ?? { value: contentType, label: contentType, icon: '📝', color: '#595959', bg: '#f5f5f5' };
}

function formatTime(date: string) {
  const now = dayjs();
  const d = dayjs(date);
  const diffMin = now.diff(d, 'minute');
  const diffH = now.diff(d, 'hour');
  const diffD = now.diff(d, 'day');
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffH < 24) return `${diffH}小时前`;
  if (diffD < 7) return `${diffD}天前`;
  return d.format('MM-DD');
}

const ALL_FILTERS = [
  { value: 'all', label: '全部', icon: '📋' },
  ...POST_TYPES,
];

function SkeletonList({ count }: { count: number }) {
  return (
    <div className={styles.listWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={styles.skBadge} />
          <div className={styles.skBody}>
            <div className={styles.skLine} style={{ width: '55%' }} />
            <div className={styles.skLine} style={{ width: '35%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyCommunityPage() {
  const { user } = useAuthStore();
  const { message } = App.useApp();

  const [loading, setLoading]               = useState(false);
  const [posts, setPosts]                   = useState<any[]>([]);
  const [filter, setFilter]                 = useState('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost]       = useState<any>(null);
  const [saving, setSaving]                 = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    contentType: 'tech' as PostTypeValue,
    tags: [] as string[],
  });

  useEffect(() => {
    if (user) loadMyPosts();
  }, [user]);

  const loadMyPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await communityApi.getMyPosts();
      setPosts(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (post: any) => {
    setEditingPost(post);
    setEditForm({
      title:       post.title       || '',
      content:     post.content     || '',
      contentType: post.contentType || 'tech',
      tags:        Array.isArray(post.tags) ? post.tags : [],
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setSaving(true);
    try {
      await communityApi.updatePost(editingPost.id, editForm);
      message.success('更新成功');
      setEditModalVisible(false);
      loadMyPosts();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (postId: string, title: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `删除后不可恢复：「${title || '无标题'}」`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await communityApi.deletePost(postId);
          message.success('已删除');
          loadMyPosts();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const filteredPosts = filter === 'all'
    ? posts
    : posts.filter(p => p.contentType === filter);

  const totalViews    = posts.reduce((s, p) => s + (p.viewCount    || 0), 0);
  const totalLikes    = posts.reduce((s, p) => s + (p.likeCount    || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.commentCount || 0), 0);

  if (!user) return null;

  return (
    <PageContainer>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>我的市集</h1>
            <span className={styles.subtitle}>
              {loading ? '加载中…' : `共 ${posts.length} 篇`}
            </span>
          </div>
          <Link href="/community" className={styles.newBtn}>
            <PlusOutlined />
            发布帖子
          </Link>
        </div>

        {/* ── Stats row ── */}
        <div className={styles.statsRow}>
          {[
            { label: '帖子',  value: posts.length,   icon: '📝' },
            { label: '浏览',  value: totalViews,      icon: '👁' },
            { label: '点赞',  value: totalLikes,      icon: '👍' },
            { label: '评论',  value: totalComments,   icon: '💬' },
          ].map(stat => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statIcon}>{stat.icon}</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div className={styles.filterBar}>
          {ALL_FILTERS.map(t => {
            const cnt = t.value === 'all'
              ? posts.length
              : posts.filter(p => p.contentType === t.value).length;
            return (
              <button
                key={t.value}
                type="button"
                className={`${styles.tab} ${filter === t.value ? styles.tabActive : ''}`}
                onClick={() => setFilter(t.value)}
              >
                {t.icon} {t.label}
                {cnt > 0 && (
                  <span className={styles.tabBadge}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <SkeletonList count={5} />
        ) : filteredPosts.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📭</span>
            <p className={styles.emptyTitle}>
              {filter === 'all' ? '还没有发布过帖子' : '该分类下暂无内容'}
            </p>
            <p className={styles.emptyHint}>前往市集发布你的第一篇帖子</p>
            <Link href="/community" className={styles.emptyBtn}>
              <PlusOutlined />
              去发帖
            </Link>
          </div>
        ) : (
          <div className={styles.listWrap}>
            {filteredPosts.map(post => {
              const type = getTypeConfig(post.contentType);
              return (
                <div key={post.id} className={styles.listItem}>
                  {/* 类型标签 */}
                  <span
                    className={styles.typeBadge}
                    style={{ color: type.color, background: type.bg }}
                  >
                    {type.icon} {type.label}
                  </span>

                  {/* 主体 */}
                  <div className={styles.listBody}>
                    <div className={styles.listTitleRow}>
                      <Link
                        href={`/community/${post.id}`}
                        className={styles.listTitle}
                      >
                        {post.title || '无标题'}
                      </Link>
                      {post.isTop     && <span className={styles.badgeTop}>置顶</span>}
                      {post.isFeatured && <span className={styles.badgeFeatured}>精华</span>}
                    </div>
                    <div className={styles.listMeta}>
                      {post.content && (
                        <p className={styles.listDesc}>{post.content}</p>
                      )}
                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <span className={styles.listTags}>
                          <NumberOutlined style={{ fontSize: 10 }} />
                          {post.tags.slice(0, 3).join(' · ')}
                        </span>
                      )}
                      <span className={styles.statsBadge}>
                        <span><EyeOutlined />{post.viewCount    || 0}</span>
                        <span><LikeOutlined />{post.likeCount    || 0}</span>
                        <span><MessageOutlined />{post.commentCount || 0}</span>
                      </span>
                    </div>
                  </div>

                  {/* 右侧：时间 + 操作 */}
                  <div className={styles.listRight}>
                    <span className={styles.listTime}>{formatTime(post.createdAt)}</span>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => openEdit(post)}
                      >
                        <EditOutlined />
                        编辑
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => handleDelete(post.id, post.title)}
                      >
                        <DeleteOutlined />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Edit Modal ── */}
      <Modal
        title="编辑帖子"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: saving }}
        width={540}
        styles={{ body: { paddingTop: 16 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>标题</div>
            <Input
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="请输入标题"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>分类</div>
            <Select
              value={editForm.contentType}
              onChange={value => setEditForm({ ...editForm, contentType: value })}
              style={{ width: '100%' }}
            >
              {POST_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>内容</div>
            <TextArea
              value={editForm.content}
              onChange={e => setEditForm({ ...editForm, content: e.target.value })}
              placeholder="请输入内容"
              rows={5}
              style={{ resize: 'none' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>
              标签
              <span style={{ fontWeight: 400, color: '#bbb', marginLeft: 6 }}>逗号分隔</span>
            </div>
            <Input
              value={editForm.tags.join(',')}
              onChange={e =>
                setEditForm({
                  ...editForm,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                })
              }
              placeholder="AI, 大模型, 工具"
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
