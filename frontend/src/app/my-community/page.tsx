'use client';

import { useEffect, useState } from 'react';
import { Card, Spin, Empty, Space, Button, Tabs, Tag, Typography, Modal, Input, Select, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, CommentOutlined, StarOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const POST_TYPES = [
  { value: 'tech', label: '💻 技术讨论' },
  { value: 'resource', label: '📦 资源分享' },
  { value: 'jobs', label: '💼 求职招聘' },
  { value: 'activity', label: '🎯 活动交流' },
];

export default function MyCommunityPage() {
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    contentType: 'tech',
    tags: [] as string[],
  });

  useEffect(() => {
    if (user) {
      loadMyPosts();
    }
  }, [user]);

  const loadMyPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await communityApi.getMyPosts();
      
      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        setPosts([]);
        return;
      }
      
      setPosts(data.items);
    } catch (error: any) {
      console.error('Load my posts error:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setEditForm({
      title: post.title || '',
      content: post.content || '',
      contentType: post.contentType || 'tech',
      tags: post.tags || [],
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      await communityApi.updatePost(editingPost.id, editForm);
      message.success('更新成功');
      setEditModalVisible(false);
      loadMyPosts();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const handleDelete = (postId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条帖子吗？此操作不可恢复。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await communityApi.deletePost(postId);
          message.success('删除成功');
          loadMyPosts();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty
          description="请先登录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ background: '#fafafa', minHeight: '100%', padding: '0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            我的市集
          </Title>
          <Text type="secondary">管理我在市集发布的帖子</Text>
        </div>

        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          tabList={[
            {
              key: 'posts',
              tab: `我的帖子 (${posts.length})`,
            },
          ]}
          activeTabKey={activeTab}
          onTabChange={setActiveTab}
          extra={
            <Link href="/community">
              <Button type="primary" icon={<PlusOutlined />}>
                发布新帖
              </Button>
            </Link>
          }
        >
          {activeTab === 'posts' && (
            <>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Spin size="large" />
                </div>
              ) : posts.length === 0 ? (
                <Empty
                  description="还没有发布过帖子"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Link href="/community">
                    <Button type="primary">立即发帖</Button>
                  </Link>
                </Empty>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      hoverable
                      style={{
                        borderRadius: 8,
                        border: '1px solid #e8e8e8',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <Link
                            href={`/community/${post.id}`}
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: '#262626',
                              textDecoration: 'none',
                            }}
                          >
                            {post.title || '无标题'}
                          </Link>
                          <div style={{ marginTop: 8 }}>
                            <Tag color="blue">
                              {POST_TYPES.find(t => t.value === post.contentType)?.label || post.contentType}
                            </Tag>
                            {post.isTop && <Tag color="red">置顶</Tag>}
                            {post.isFeatured && <Tag color="gold">精华</Tag>}
                          </div>
                        </div>
                        <Space>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(post)}
                          >
                            编辑
                          </Button>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(post.id)}
                          >
                            删除
                          </Button>
                        </Space>
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          color: '#595959',
                          lineHeight: 1.8,
                          marginBottom: 12,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {post.content}
                      </div>

                      {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <Space size={6} wrap>
                            {post.tags.map((tag: string) => (
                              <Tag key={tag} style={{ fontSize: 12 }}>
                                #{tag}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                        <Space size="large" style={{ fontSize: 13, color: '#999' }}>
                          <Space>
                            <CommentOutlined />
                            <span>{post.commentCount || 0} 评论</span>
                          </Space>
                          <Space>
                            <StarOutlined />
                            <span>{post.likeCount || 0} 点赞</span>
                          </Space>
                          <Space>
                            <EyeOutlined />
                            <span>{post.viewCount || 0} 浏览</span>
                          </Space>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </>
          )}
        </Card>

        <Modal
          title="编辑帖子"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={handleSaveEdit}
          width={600}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <Text strong>标题</Text>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="请输入标题"
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>类型</Text>
              <Select
                value={editForm.contentType}
                onChange={(value) => setEditForm({ ...editForm, contentType: value })}
                style={{ width: '100%', marginTop: 8 }}
              >
                {POST_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Text strong>内容</Text>
              <TextArea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="请输入内容"
                rows={6}
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>标签</Text>
              <Input
                value={editForm.tags.join(',')}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="用逗号分隔多个标签"
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        </Modal>
      </div>
    </div>
  );
}
