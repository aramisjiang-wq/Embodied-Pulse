'use client';

import { useState } from 'react';
import { 
  Drawer, 
  List, 
  Badge, 
  Button, 
  Empty, 
  Spin, 
  Tag, 
  Space, 
  Typography,
  Dropdown,
  Tooltip,
} from 'antd';
import { 
  BellOutlined, 
  CheckCircleOutlined, 
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useWebSocket, Notification, NotificationType } from '@/lib/hooks/useWebSocket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const loading = false;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  useWebSocket({
    onNotification: handleNotification,
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'subscription_update':
        return <BellOutlined style={{ color: '#52c41a' }} />;
      case 'new_content':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'comment_reply':
        return <CheckCircleOutlined style={{ color: '#722ed1' }} />;
      case 'like':
        return <BellOutlined style={{ color: '#fa541c' }} />;
      case 'favorite':
        return <BellOutlined style={{ color: '#faad14' }} />;
      case 'system':
        return <BellOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getContentTypeIcon = (contentType?: string) => {
    switch (contentType) {
      case 'paper':
        return <FileTextOutlined />;
      case 'video':
        return <PlayCircleOutlined />;
      case 'repo':
        return <GithubOutlined />;
      case 'huggingface':
        return <RobotOutlined />;
      case 'job':
        return <TeamOutlined />;
      default:
        return null;
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      subscription_update: '订阅更新',
      new_content: '新内容',
      comment_reply: '评论回复',
      like: '收到点赞',
      favorite: '被收藏',
      system: '系统通知',
    };
    return labels[type];
  };

  const getNotificationTypeColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      subscription_update: 'success',
      new_content: 'processing',
      comment_reply: 'purple',
      like: 'orange',
      favorite: 'gold',
      system: 'error',
    };
    return colors[type];
  };

  const getNotificationActions = (notification: Notification) => [
    {
      key: 'markRead',
      icon: <EyeOutlined />,
      label: '标为已读',
      onClick: () => markAsRead(notification.id),
      disabled: notification.read,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      onClick: () => deleteNotification(notification.id),
      danger: true,
    },
  ];

  return (
    <>
      <Tooltip title="通知中心">
        <Badge count={unreadCount} overflowCount={99}>
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => onClose()}
            style={{ fontSize: 18 }}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title={
          <Space>
            <BellOutlined />
            <span>通知中心</span>
            {unreadCount > 0 && (
              <Tag color="blue">{unreadCount}条未读</Tag>
            )}
          </Space>
        }
        placement="right"
        width={480}
        open={visible}
        onClose={onClose}
        extra={
          <Space>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>
                全部已读
              </Button>
            )}
            {notifications.length > 0 && (
              <Button size="small" danger onClick={clearAll}>
                清空
              </Button>
            )}
          </Space>
        }
      >
        <Spin spinning={loading}>
          {notifications.length === 0 ? (
            <Empty
              description="暂无通知"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item
                  key={notification.id}
                  style={{
                    backgroundColor: notification.read ? 'transparent' : '#f6ffed',
                    padding: '16px',
                    borderRadius: 8,
                    marginBottom: 8,
                    border: notification.read ? 'none' : '1px solid #b7eb8f',
                  }}
                  actions={[
                    <Dropdown
                      key="actions"
                      menu={{
                        items: getNotificationActions(notification),
                      }}
                      trigger={['click']}
                    >
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={getNotificationIcon(notification.type)}
                    title={
                      <Space>
                        <Text strong={!notification.read}>
                          {notification.title}
                        </Text>
                        <Tag color={getNotificationTypeColor(notification.type)} style={{ margin: 0 }}>
                          {getNotificationTypeLabel(notification.type)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                          {notification.content}
                        </Text>
                        <Space size={8}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(notification.createdAt).fromNow()}
                          </Text>
                          {typeof notification.data?.contentType === 'string' && notification.data.contentType && (
                            <Tag icon={getContentTypeIcon(String(notification.data.contentType))} style={{ margin: 0, fontSize: 11 }}>
                              {String(notification.data.contentType)}
                            </Tag>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Drawer>
    </>
  );
}
