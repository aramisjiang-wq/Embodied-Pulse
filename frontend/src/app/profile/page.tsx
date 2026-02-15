'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Layout, 
  Card, 
  Descriptions, 
  Tabs, 
  List, 
  Tag, 
  Button, 
  Avatar, 
  Space, 
  Statistic, 
  Row, 
  Col,
  Empty,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Progress,
  Badge,
  Timeline,
  Tooltip,
  App
} from 'antd';
import { 
  UserOutlined, 
  HeartOutlined, 
  BellOutlined, 
  StarOutlined, 
  EyeOutlined, 
  SettingOutlined, 
  HistoryOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FireOutlined,
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RiseOutlined,
  FileTextOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { userApi } from '@/lib/api/user';
import { subscriptionApi } from '@/lib/api/subscription';
import { communityApi } from '@/lib/api/community';
import { paperApi, repoApi, videoApi, jobApi } from '@/lib/api';
import { getLevelBadge, getLevelProgress, getNextLevel, getPointsToNextLevel } from '@/lib/utils/levelUtils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Content } = Layout;
const { TextArea } = Input;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFavorites: 0,
    totalSubscriptions: 0,
    totalViews: 0,
    totalShares: 0,
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('overview');

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const [favData, subData] = await Promise.all([
        communityApi.getFavorites({ page: 1, size: 50 }),
        subscriptionApi.getSubscriptions({ page: 1, size: 50 }),
      ]);

      const favItems = favData?.items || [];
      const subItems = subData?.items || [];
      
      const enrichedFavorites = await enrichFavorites(favItems);
      setFavorites(enrichedFavorites);
      setSubscriptions(subItems);
      setActivities([]);
      setStats({
        totalFavorites: favItems.length,
        totalSubscriptions: subItems.length,
        totalViews: 0,
        totalShares: 0,
      });
    } catch (error: any) {
      console.error('Load user data error:', error);
      setFavorites([]);
      setSubscriptions([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  const enrichFavorites = async (items: any[]) => {
    return Promise.all(
      items.map(async (fav: any) => {
        try {
          switch (fav.contentType) {
            case 'paper':
              return { ...fav, detail: await paperApi.getPaper(fav.contentId) };
            case 'video':
              return { ...fav, detail: await videoApi.getVideo(fav.contentId) };
            case 'repo':
              return { ...fav, detail: await repoApi.getRepo(fav.contentId) };
            case 'job':
              return { ...fav, detail: await jobApi.getJob(fav.contentId) };
            default:
              return fav;
          }
        } catch {
          return fav;
        }
      })
    );
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      await userApi.updateProfile(values);
      message.success('更新成功');
      setEditProfileOpen(false);
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const handleUpdateSettings = async (values: any) => {
    try {
      await userApi.updateSettings(values);
      message.success('设置已保存');
      setSettingsOpen(false);
    } catch (error: any) {
      message.error(error.message || '保存失败');
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      await communityApi.deleteFavorite('all', id);
      message.success('已取消收藏');
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      await subscriptionApi.deleteSubscription(id);
      message.success('已取消订阅');
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      message.error(error.message || '取消失败');
    }
  };

  const buildLink = (item: any) => {
    const detail = item.detail;
    if (!detail) return '#';

    switch (item.contentType) {
      case 'paper':
        return `/papers/${item.contentId}`;
      case 'video':
        return `/videos/${item.contentId}`;
      case 'repo':
        return `/repos/${item.contentId}`;
      case 'job':
        return `/jobs/${item.contentId}`;
      default:
        return '#';
    }
  };

  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      paper: <BookOutlined style={{ color: '#1890ff' }} />,
      video: <PlayCircleOutlined style={{ color: '#00a1d6' }} />,
      repo: <GithubOutlined style={{ color: '#722ed1' }} />,
      job: <RiseOutlined style={{ color: '#fa8c16' }} />,
    };
    return icons[type] || <FileTextOutlined />;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      favorite: <HeartOutlined style={{ color: '#ff4d4f' }} />,
      subscribe: <BellOutlined style={{ color: '#1890ff' }} />,
      share: <ShareAltOutlined style={{ color: '#52c41a' }} />,
      view: <EyeOutlined style={{ color: '#722ed1' }} />,
    };
    return icons[type] || <ClockCircleOutlined />;
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <TrophyOutlined />
          概览
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="收藏数"
                  value={stats.totalFavorites}
                  prefix={<HeartOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="订阅数"
                  value={stats.totalSubscriptions}
                  prefix={<BellOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="浏览量"
                  value={stats.totalViews}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="分享数"
                  value={stats.totalShares}
                  prefix={<ShareAltOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="基本信息" extra={
            <Button icon={<EditOutlined />} onClick={() => setEditProfileOpen(true)}>
              编辑
            </Button>
          }>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="头像">
                <Avatar size={64} src={user?.avatar} icon={<UserOutlined />} />
              </Descriptions.Item>
              <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="等级">
                <Tag color="gold">LV{user?.level || 1}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="积分">{user?.points || 0}</Descriptions.Item>
              <Descriptions.Item label="VIP">
                {user?.isVip ? <Tag color="purple">VIP会员</Tag> : <Tag>普通用户</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="位置">{user?.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="个人简介" span={2}>{user?.bio || '-'}</Descriptions.Item>
              <Descriptions.Item label="技能" span={2}>
                {user?.skills ? user.skills.split(',').map((skill: string, index: number) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 4 }}>{skill.trim()}</Tag>
                )) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="兴趣" span={2}>
                {user?.interests ? user.interests.split(',').map((interest: string, index: number) => (
                  <Tag key={index} color="pink" style={{ marginBottom: 4 }}>{interest.trim()}</Tag>
                )) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="GitHub">
                {user?.githubUrl ? (
                  <Link href={user.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    <GithubOutlined /> GitHub
                  </Link>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="LinkedIn">
                {user?.linkedinUrl ? (
                  <Link href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    <LinkOutlined /> LinkedIn
                  </Link>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Twitter">
                {user?.twitterUrl ? (
                  <Link href={user.twitterUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    Twitter
                  </Link>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="个人网站">
                {user?.websiteUrl ? (
                  <Link href={user.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    <GlobalOutlined /> 个人网站
                  </Link>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {user?.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {user?.lastLoginAt ? dayjs(user.lastLoginAt).fromNow() : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ),
    },
    {
      key: 'favorites',
      label: (
        <span>
          <HeartOutlined />
          收藏
          <Badge count={favorites.length} style={{ marginLeft: 8 }} />
        </span>
      ),
      children: (
        <List
          loading={loading}
          dataSource={favorites}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Link key="view" href={buildLink(item)} target="_blank">
                  查看
                </Link>,
                <Tooltip key="delete" title="取消收藏">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteFavorite(item.id)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={getContentTypeIcon(item.contentType)}
                title={item.detail?.title || item.detail?.fullName || item.contentId}
                description={
                  <>
                    <Tag color="blue">{item.contentType}</Tag>
                    <span style={{ color: '#999', marginLeft: 8 }}>
                      {dayjs(item.createdAt).fromNow()}
                    </span>
                  </>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'subscriptions',
      label: (
        <span>
          <BellOutlined />
          订阅
          <Badge count={subscriptions.length} style={{ marginLeft: 8 }} />
        </span>
      ),
      children: (
        <List
          loading={loading}
          dataSource={subscriptions}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Link key="view" href={buildLink(item)} target="_blank">
                  查看
                </Link>,
                <Tooltip key="unsubscribe" title="取消订阅">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleUnsubscribe(item.id)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={getContentTypeIcon(item.contentType)}
                title={item.name || item.contentId}
                description={
                  <>
                    <Tag color="green">{item.contentType}</Tag>
                    <span style={{ color: '#999', marginLeft: 8 }}>
                      {dayjs(item.createdAt).fromNow()}
                    </span>
                  </>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'activities',
      label: (
        <span>
          <HistoryOutlined />
          活动记录
        </span>
      ),
      children: (
        <Timeline
          items={activities.map((activity: any) => ({
            dot: getActivityIcon(activity.type),
            color: activity.type === 'favorite' ? 'red' : 
                   activity.type === 'subscribe' ? 'blue' : 
                   activity.type === 'share' ? 'green' : 'gray',
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>
                  {activity.description || '未知操作'}
                </div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {dayjs(activity.createdAt).fromNow()}
                </div>
              </div>
            ),
          }))}
        />
      ),
    },
    {
      key: 'settings',
      label: (
        <span>
          <SettingOutlined />
          设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={settingsForm}
            layout="vertical"
            onFinish={handleUpdateSettings}
            initialValues={{
              emailNotification: true,
              pushNotification: false,
              weeklyDigest: true,
              language: 'zh-CN',
              theme: 'light',
            }}
          >
            <Form.Item
              label="邮件通知"
              name="emailNotification"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="推送通知"
              name="pushNotification"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="周报订阅"
              name="weeklyDigest"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item label="语言" name="language">
              <Select
                options={[
                  { label: '简体中文', value: 'zh-CN' },
                  { label: 'English', value: 'en-US' },
                ]}
              />
            </Form.Item>
            <Form.Item label="主题" name="theme">
              <Select
                options={[
                  { label: '浅色', value: 'light' },
                  { label: '深色', value: 'dark' },
                  { label: '跟随系统', value: 'auto' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  if (!user) {
    return (
      <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <Content style={{ padding: 100, textAlign: 'center' }}>
          <Empty description="请先登录">
            <Link href="/login">
              <Button type="primary" size="large">
                去登录
              </Button>
            </Link>
          </Empty>
        </Content>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px 50px', maxWidth: 1200, margin: '0 auto' }}>
        {/* 用户卡片 */}
        <Card 
          style={{ 
            marginBottom: 24, 
            borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ padding: '32px 40px', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Avatar 
                size={100} 
                src={user?.avatar} 
                icon={<UserOutlined />}
                style={{ 
                  border: '4px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              {user?.isVip && (
                <div style={{
                  position: 'absolute',
                  bottom: -4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                  padding: '2px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    VIP
                  </div>
              )}
            </div>
            
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#fff' }}>
                  {user?.username}
                </h2>
                <Tag 
                  style={{ 
                    fontSize: 14, 
                    padding: '2px 12px', 
                    borderRadius: 12,
                    fontWeight: 600,
                    background: getLevelBadge(user?.level || 1).color,
                    border: 'none',
                    color: '#fff'
                  }}
                >
                  {getLevelBadge(user?.level || 1).icon} LV{user?.level || 1} {getLevelBadge(user?.level || 1).name}
                </Tag>
              </div>
              
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 12 }}>
                {user?.bio || '这个人很懒，还没有填写简介~'}
              </div>
              
              <Space size="large" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                <span>
                  <TrophyOutlined style={{ marginRight: 6 }} />
                  {user?.points || 0} 积分
                </span>
                <span>
                  <HeartOutlined style={{ marginRight: 6 }} />
                  {stats.totalFavorites} 收藏
                </span>
                <span>
                  <BellOutlined style={{ marginRight: 6 }} />
                  {stats.totalSubscriptions} 订阅
                </span>
                {user?.location && (
                  <span>
                    📍 {user.location}
                  </span>
                )}
              </Space>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => setEditProfileOpen(true)}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  fontWeight: 500
                }}
              >
                编辑资料
              </Button>
              <Button 
                icon={<SettingOutlined />}
                onClick={() => setActiveTab('settings')}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: 8
                }}
              >
                账号设置
              </Button>
            </div>
          </div>
          
          {/* 等级进度条 */}
          <div style={{ 
            padding: '16px 40px', 
            background: 'rgba(0,0,0,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                等级进度
              </span>
              <span style={{ color: '#ffd700', fontSize: 13, fontWeight: 600 }}>
                {getLevelBadge(user?.level || 1).icon} LV{user?.level || 1} {getLevelBadge(user?.level || 1).name}
              </span>
              {getNextLevel(user?.points || 0) && (
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                  · 距离 {getNextLevel(user?.points || 0)?.name} 还需 {getPointsToNextLevel(user?.points || 0)} 积分
                </span>
              )}
            </div>
            <Progress 
              percent={getLevelProgress(user?.points || 0)} 
              strokeColor={{
                '0%': '#ffd700',
                '100%': '#ffaa00',
              }}
              trailColor="rgba(255,255,255,0.2)"
              showInfo={false}
              size="small"
            />
          </div>
        </Card>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>
      </Content>

      <Modal
        title="编辑个人资料"
        open={editProfileOpen}
        onCancel={() => setEditProfileOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={{
            username: user?.username,
            email: user?.email,
            bio: user?.bio || '',
            avatarUrl: user?.avatar || '',
            githubUrl: user?.githubUrl || '',
            linkedinUrl: user?.linkedinUrl || '',
            twitterUrl: user?.twitterUrl || '',
            websiteUrl: user?.websiteUrl || '',
            location: user?.location || '',
            skills: user?.skills || '',
            interests: user?.interests || '',
          }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="个人简介" name="bio">
            <TextArea rows={4} placeholder="介绍一下你自己..." />
          </Form.Item>
          <Form.Item label="头像URL" name="avatarUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="位置" name="location">
            <Input placeholder="城市，国家" />
          </Form.Item>
          <Form.Item label="GitHub" name="githubUrl">
            <Input placeholder="https://github.com/..." />
          </Form.Item>
          <Form.Item label="LinkedIn" name="linkedinUrl">
            <Input placeholder="https://linkedin.com/in/..." />
          </Form.Item>
          <Form.Item label="Twitter" name="twitterUrl">
            <Input placeholder="https://twitter.com/..." />
          </Form.Item>
          <Form.Item label="个人网站" name="websiteUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="技能" name="skills">
            <Input placeholder="用逗号分隔，例如：Python, React, 机器学习" />
          </Form.Item>
          <Form.Item label="兴趣" name="interests">
            <Input placeholder="用逗号分隔，例如：计算机视觉, 机器人, NLP" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditProfileOpen(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
