/**
 * 通知列表组件
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { List, Badge, Button, Empty, Spin, Tag, Typography, Space, Popconfirm } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, GithubOutlined, FileTextOutlined, PlayCircleOutlined, TeamOutlined, MessageOutlined } from '@ant-design/icons';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount, type Notification } from '@/api/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text, Paragraph } = Typography;

interface NotificationListProps {
  onClose?: () => void;
}

export default function NotificationList({ onClose }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNotifications({ page: 1, size: 20 });
      setNotifications(response.items);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onClose?.();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (unreadCount > 0) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      onClose?.();
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'repo_update':
        return <GithubOutlined style={{ color: '#1890ff' }} />;
      case 'paper_new':
        return <FileTextOutlined style={{ color: '#52c41a' }} />;
      case 'video_new':
        return <PlayCircleOutlined style={{ color: '#faad14' }} />;
      case 'job_new':
        return <TeamOutlined style={{ color: '#722ed1' }} />;
      default:
        return <MessageOutlined style={{ color: '#eb2f96' }} />;
    }
  };

  const getNotificationTypeTag = (type: string) => {
    const typeMap: Record<string, { text: string; color: string }> = {
      repo_update: { text: '项目更新', color: 'blue' },
      paper_new: { text: '新论文', color: 'green' },
      video_new: { text: '新视频', color: 'orange' },
      job_new: { text: '新职位', color: 'purple' },
      system: { text: '系统通知', color: 'pink' },
    };
    const config = typeMap[type] || { text: '通知', color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div style={{ width: 400, maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Space>
          <BellOutlined />
          <Text strong>通知</Text>
          {unreadCount > 0 && <Badge count={unreadCount} />}
        </Space>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            全部已读
          </Button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty description="暂无通知" style={{ padding: '40px' }} />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: item.isRead ? 'transparent' : '#f5f5f5',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                actions={[
                  !item.isRead && (
                    <Button
                      key="mark"
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                    />
                  ),
                  <Popconfirm
                    key="delete"
                    title="确定删除此通知？"
                    onConfirm={() => handleDelete(item.id)}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item.type)}
                  title={
                    <Space size={8}>
                      <Text strong={!item.isRead}>{item.title}</Text>
                      {getNotificationTypeTag(item.type)}
                    </Space>
                  }
                  description={
                    <div>
                      {item.content && (
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ marginBottom: 4, fontSize: 13 }}
                        >
                          {item.content}
                        </Paragraph>
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.createdAt).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
