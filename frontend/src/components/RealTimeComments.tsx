'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Avatar, Space, Button, Input, Spin, Empty, Divider, Tag, Tooltip, App } from 'antd';
import { LikeOutlined, MessageOutlined, SendOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Comment as CommentType } from '@/lib/api/types';
import { communityApi } from '@/lib/api/community';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface RealTimeCommentsProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

interface SocketMessage {
  type: 'new_comment' | 'comment_updated' | 'comment_deleted' | 'comment_liked';
  data: CommentType;
}

export default function RealTimeComments({ postId, onCommentCountChange }: RealTimeCommentsProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const getErrorMessage = useCallback((error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
  ), []);

  const handleSocketMessage = useCallback((socketMessage: SocketMessage) => {
    switch (socketMessage.type) {
      case 'new_comment':
        setComments(prev => [socketMessage.data, ...prev]);
        message.success('收到新评论');
        break;
      case 'comment_updated':
        setComments(prev => prev.map(c => c.id === socketMessage.data.id ? socketMessage.data : c));
        break;
      case 'comment_deleted':
        setComments(prev => prev.filter(c => c.id !== socketMessage.data.id));
        message.info('评论已删除');
        break;
      case 'comment_liked':
        setComments(prev => prev.map(c => c.id === socketMessage.data.id ? socketMessage.data : c));
        break;
    }
  }, [message]);

  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      const ws = new WebSocket(`${wsUrl}/comments/${postId}`);

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          handleSocketMessage(message);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      setTimeout(connectWebSocket, 5000);
    }
  }, [handleSocketMessage, postId]);

  const loadComments = useCallback(async (pageNum: number) => {
    try {
      const data = await communityApi.getComments(postId, { page: pageNum, size: 10 });
      if (pageNum === 1) {
        setComments(data.items || []);
      } else {
        setComments(prev => [...prev, ...(data.items || [])]);
      }
      setPage(pageNum);
      setHasMore(data.pagination.hasNext);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '评论加载失败'));
    } finally {
      setLoading(false);
    }
  }, [postId, message, getErrorMessage]);

  useEffect(() => {
    loadComments(1);
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [postId, loadComments, connectWebSocket]);

  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(comments.length);
    }
  }, [comments.length, onCommentCountChange]);

  const handleSubmit = async (content: string, parentId?: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    if (!content.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    setSubmitting(true);
    try {
      const result = await communityApi.createComment({
        postId,
        parentId,
        content: content.trim(),
      });
      if (!result || !result.commentId) {
        message.error('评论失败：未返回评论ID');
        return;
      }
      message.success('评论成功');
      const newComment: CommentType = {
        id: result.commentId,
        userId: user?.id || '',
        user: user || { id: '', username: '', avatarUrl: '' },
        postId,
        content: content.trim(),
        likeCount: 0,
        createdAt: new Date().toISOString(),
        parentId,
      };
      setComments(prev => [newComment, ...prev]);
      setReplyingTo(null);
      setReplyContent('');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '评论失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    try {
      await communityApi.likeComment(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, likeCount: c.likeCount + 1 }
          : c
      ));
      message.success('点赞成功');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '点赞失败'));
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    try {
      await communityApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      message.success('删除成功');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '删除失败'));
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    if (!content.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    try {
      const updatedComment = await communityApi.updateComment(commentId, { content: content.trim() });
      if (!updatedComment) {
        message.error('修改失败：未返回更新后的评论');
        return;
      }
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      setEditingId(null);
      setEditContent('');
      message.success('修改成功');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '修改失败'));
    }
  };

  const renderComment = (comment: CommentType, depth: number = 0) => {
    const isOwner = user?.id === comment.userId;
    const replies = comments.filter(c => c.parentId === comment.id);

    return (
      <div key={comment.id} style={{ marginBottom: depth === 0 ? 16 : 8 }}>
        <Card size="small" style={{ marginLeft: depth * 20, background: depth > 0 ? '#fafafa' : '#fff' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Avatar src={comment.user.avatarUrl} size={40} icon={<MessageOutlined />} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{comment.user.username}</span>
                  <Tag color="blue" style={{ margin: 0, fontSize: 11, padding: '0 6px' }}>
                    LV{comment.user.level}
                  </Tag>
                  <Tooltip title={dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(comment.createdAt).fromNow()}
                    </span>
                  </Tooltip>
                </div>
                
                {editingId === comment.id ? (
                  <div style={{ marginTop: 8 }}>
                    <Input.TextArea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="修改评论..."
                    />
                    <Space style={{ marginTop: 8 }}>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleEdit(comment.id, editContent)}
                      >
                        保存
                      </Button>
                      <Button size="small" onClick={() => setEditingId(null)}>
                        取消
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <div style={{ color: '#333', lineHeight: 1.6, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </div>
                )}

                <Space size="small" style={{ marginTop: 8 }}>
                  <Button 
                    type="text" 
                    size="small"
                    icon={<LikeOutlined />}
                    onClick={() => handleLike(comment.id)}
                  >
                    {comment.likeCount}
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    回复
                  </Button>
                  {isOwner && (
                    <>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        编辑
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(comment.id)}
                      >
                        删除
                      </Button>
                    </>
                  )}
                </Space>

                {replyingTo === comment.id && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <Input.TextArea
                      rows={3}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`回复 ${comment.user.username}...`}
                    />
                    <Space style={{ marginTop: 8 }}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        onClick={() => handleSubmit(replyContent, comment.id)}
                        loading={submitting}
                      >
                        发送
                      </Button>
                      <Button size="small" onClick={() => setReplyingTo(null)}>
                        取消
                      </Button>
                    </Space>
                  </div>
                )}
              </div>
            </div>

            {replies.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </Space>
        </Card>
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <MessageOutlined />
          <span>评论 ({comments.length})</span>
          {connected && (
            <Tag color="green" style={{ margin: 0 }}>
              实时
            </Tag>
          )}
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => loadComments(1)}
          loading={loading}
        >
          刷新
        </Button>
      }
    >
      {loading && comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Input.TextArea
              rows={3}
              placeholder={user ? '写下你的评论...' : '请先登录后再评论'}
              disabled={!user}
              onPressEnter={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  handleSubmit((e.target as HTMLTextAreaElement).value);
                }
              }}
            />
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    handleSubmit(textarea.value);
                  }
                }}
                loading={submitting}
                disabled={!user}
              >
                发表评论
              </Button>
            </div>
          </div>

          <Divider />

          {comments.length === 0 ? (
            <Empty
              description="暂无评论，快来抢沙发吧！"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div ref={scrollRef}>
              {comments
                .filter(c => !c.parentId)
                .map(comment => renderComment(comment))
              }
            </div>
          )}

          {hasMore && comments.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={() => loadComments(page + 1)} loading={loading}>
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
