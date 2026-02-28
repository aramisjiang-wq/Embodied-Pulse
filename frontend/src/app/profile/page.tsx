'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Tabs,
  Tag,
  Button,
  Avatar,
  Empty,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Upload,
  App,
  Tooltip,
  Progress,
  Spin,
} from 'antd';
import {
  UserOutlined,
  HeartOutlined,
  BellOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RiseOutlined,
  FileTextOutlined,
  GlobalOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  LockOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { userApi } from '@/lib/api/user';
import { subscriptionApi, Subscription } from '@/lib/api/subscription';
import { communityApi } from '@/lib/api/community';
import { paperApi, repoApi, videoApi, jobApi } from '@/lib/api';
import {
  getLevelBadge,
  getLevelProgress,
  getNextLevel,
  getPointsToNextLevel,
  getLevelByPoints,
  getAllBenefitsUpToLevel,
  formatPoints,
  LEVEL_CONFIG,
} from '@/lib/utils/levelUtils';
import PageContainer from '@/components/PageContainer';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './page.module.css';
import type { RcFile } from 'antd/es/upload/interface';

dayjs.extend(relativeTime);

const { TextArea } = Input;

const CONTENT_TYPE_LABELS: Record<string, string> = {
  paper: '论文',
  video: '视频',
  repo: '开源项目',
  huggingface: 'HuggingFace',
  job: '职位',
  post: '帖子',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  paper: 'blue',
  video: 'cyan',
  repo: 'purple',
  huggingface: 'orange',
  job: 'green',
  post: 'magenta',
};

function getContentTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    paper: <FileTextOutlined />,
    video: <PlayCircleOutlined />,
    repo: <GithubOutlined />,
    job: <RiseOutlined />,
  };
  return icons[type] || <FileTextOutlined />;
}

function buildLink(item: { contentType: string; contentId: string }) {
  const map: Record<string, string> = {
    paper: `/papers/${item.contentId}`,
    video: `/videos/${item.contentId}`,
    repo: `/repos/${item.contentId}`,
    job: `/jobs/${item.contentId}`,
  };
  return map[item.contentType] || '#';
}

function compressImage(file: RcFile): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 300);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas error');
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, updateProfile: updateAuthProfile } = useAuthStore();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState({ totalFavorites: 0, totalSubscriptions: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [profileForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState('favorites');
  const [showAllBenefits, setShowAllBenefits] = useState(false);

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const [favData, subData] = await Promise.all([
        communityApi.getFavorites({ page: 1, size: 50 }),
        subscriptionApi.getSubscriptions({ page: 1, size: 50 }),
      ]);
      const favItems = favData?.items || [];
      const subItems = subData?.items || [];

      const enriched = await Promise.all(
        favItems.map(async (fav: any) => {
          try {
            switch (fav.contentType) {
              case 'paper': return { ...fav, detail: await paperApi.getPaper(fav.contentId) };
              case 'video': return { ...fav, detail: await videoApi.getVideo(fav.contentId) };
              case 'repo': return { ...fav, detail: await repoApi.getRepo(fav.contentId) };
              case 'job': return { ...fav, detail: await jobApi.getJob(fav.contentId) };
              default: return fav;
            }
          } catch { return fav; }
        })
      );

      setFavorites(enriched);
      setSubscriptions(subItems);
      setStats({ totalFavorites: favItems.length, totalSubscriptions: subItems.length });
    } catch (err) {
      console.error('Load user data error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatar || user.avatarUrl || '');
      loadUserData();
      loadUserSettings();
    }
  }, [user, loadUserData]);

  const loadUserSettings = useCallback(async () => {
    try {
      const settings = await userApi.getSettings();
      settingsForm.setFieldsValue({
        emailNotification: settings.emailNotification,
        pushNotification: settings.pushNotification,
        weeklyDigest: settings.weeklyDigest,
        language: settings.language || 'zh-CN',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [settingsForm]);

  const handleOpenEdit = () => {
    profileForm.setFieldsValue({
      username: user?.username,
      bio: user?.bio || '',
      location: user?.location || '',
      githubUrl: user?.githubUrl || '',
      linkedinUrl: user?.linkedinUrl || '',
      twitterUrl: user?.twitterUrl || '',
      websiteUrl: user?.websiteUrl || '',
      skills: user?.skills || '',
      interests: user?.interests || '',
    });
    setAvatarUrl(user?.avatar || user?.avatarUrl || '');
    setEditOpen(true);
  };

  const handleUpdateProfile = async (values: any) => {
    setSaving(true);
    try {
      const payload = { ...values, avatarUrl };
      const updatedUser = await userApi.updateProfile(payload);
      updateAuthProfile({ ...updatedUser, avatar: updatedUser.avatarUrl });
      message.success('资料已更新');
      setEditOpen(false);
    } catch (error: any) {
      message.error(error.message || '更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: RcFile) => {
    try {
      const base64 = await compressImage(file);
      setAvatarUrl(base64);
    } catch {
      message.error('图片处理失败');
    }
    return false;
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      await communityApi.deleteFavorite('all', id);
      message.success('已取消收藏');
      setFavorites(prev => prev.filter(f => f.id !== id));
      setStats(prev => ({ ...prev, totalFavorites: prev.totalFavorites - 1 }));
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      await subscriptionApi.deleteSubscription(id);
      message.success('已取消订阅');
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      setStats(prev => ({ ...prev, totalSubscriptions: prev.totalSubscriptions - 1 }));
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleUpdateSettings = async (values: any) => {
    setSaving(true);
    try {
      await userApi.updateSettings(values);
      message.success('设置已保存');
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <PageContainer title="个人中心">
        <div className={styles.loginPrompt}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className={styles.loginText}>请先登录以查看个人中心</span>}
          >
            <Link href="/login">
              <Button type="primary" size="large" className={styles.loginBtn}>立即登录</Button>
            </Link>
          </Empty>
        </div>
      </PageContainer>
    );
  }

  const currentLevel = getLevelByPoints(user.points || 0);
  const levelBadge = getLevelBadge(currentLevel.level);
  const progress = getLevelProgress(user.points || 0);
  const nextLevel = getNextLevel(user.points || 0);
  const pointsToNext = getPointsToNextLevel(user.points || 0);
  const benefits = getAllBenefitsUpToLevel(currentLevel.level);
  const displayedBenefits = showAllBenefits ? benefits : benefits.slice(0, 8);

  const skillList = user.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const interestList = user.interests ? user.interests.split(',').map(s => s.trim()).filter(Boolean) : [];

  const tabItems = [
    {
      key: 'favorites',
      label: (
        <span className={styles.tabLabel}>
          <HeartOutlined />
          <span>收藏</span>
          {stats.totalFavorites > 0 && (
            <span className={styles.tabBadge}>{stats.totalFavorites}</span>
          )}
        </span>
      ),
      children: loading ? (
        <div className={styles.tabLoading}><Spin /></div>
      ) : favorites.length === 0 ? (
        <Empty description="暂无收藏内容" image={Empty.PRESENTED_IMAGE_SIMPLE} className={styles.emptyState} />
      ) : (
        <div className={styles.listContainer}>
          {favorites.map((item: any) => (
            <div key={item.id} className={styles.listCard}>
              <div className={styles.listCardIcon}>
                {getContentTypeIcon(item.contentType)}
              </div>
              <div className={styles.listCardContent}>
                <div className={styles.listCardTitle}>
                  {item.detail?.title || item.detail?.fullName || item.contentId}
                </div>
                <div className={styles.listCardMeta}>
                  <Tag color={CONTENT_TYPE_COLORS[item.contentType]} className={styles.typeTag}>
                    {CONTENT_TYPE_LABELS[item.contentType] || item.contentType}
                  </Tag>
                  <span className={styles.timeText}>{dayjs(item.createdAt).fromNow()}</span>
                </div>
              </div>
              <div className={styles.listCardActions}>
                <Link href={buildLink(item)} target="_blank">
                  <Button type="link" size="small">查看</Button>
                </Link>
                <Tooltip title="取消收藏">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={() => handleDeleteFavorite(item.id)}
                  />
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'subscriptions',
      label: (
        <span className={styles.tabLabel}>
          <BellOutlined />
          <span>订阅</span>
          {stats.totalSubscriptions > 0 && (
            <span className={styles.tabBadge}>{stats.totalSubscriptions}</span>
          )}
        </span>
      ),
      children: loading ? (
        <div className={styles.tabLoading}><Spin /></div>
      ) : subscriptions.length === 0 ? (
        <Empty description="暂无订阅" image={Empty.PRESENTED_IMAGE_SIMPLE} className={styles.emptyState}>
          <Link href="/subscriptions">
            <Button type="primary">去添加订阅</Button>
          </Link>
        </Empty>
      ) : (
        <div className={styles.listContainer}>
          {subscriptions.map((sub) => {
            const filterTags: string[] = [];
            if (sub.keywords) filterTags.push(`关键词: ${sub.keywords}`);
            if (sub.authors) filterTags.push(`作者: ${sub.authors}`);
            if (sub.uploaders) filterTags.push(`UP主: ${sub.uploaders}`);
            if (sub.topics) filterTags.push(`主题: ${sub.topics}`);
            if (sub.owners) filterTags.push(`Owner: ${sub.owners}`);
            if (sub.tags) filterTags.push(`标签: ${sub.tags}`);
            if (sub.platform) filterTags.push(`平台: ${sub.platform}`);
            if (sub.minStars) filterTags.push(`⭐ ≥${sub.minStars}`);
            if (sub.minCitations) filterTags.push(`引用 ≥${sub.minCitations}`);

            return (
              <div key={sub.id} className={styles.subCard}>
                <div className={styles.subCardHeader}>
                  <div className={styles.subCardTitle}>
                    <span className={styles.subName}>{sub.name}</span>
                    <Tag color={CONTENT_TYPE_COLORS[sub.contentType]} className={styles.typeTag}>
                      {CONTENT_TYPE_LABELS[sub.contentType] || sub.contentType}
                    </Tag>
                    <Tag color={sub.isActive ? 'success' : 'default'}>
                      {sub.isActive ? '运行中' : '已暂停'}
                    </Tag>
                  </div>
                  <Tooltip title="取消订阅">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => handleUnsubscribe(sub.id)}
                    />
                  </Tooltip>
                </div>

                {sub.description && (
                  <div className={styles.subDescription}>{sub.description}</div>
                )}

                {filterTags.length > 0 && (
                  <div className={styles.subFilters}>
                    {filterTags.map((tag, i) => (
                      <span key={i} className={styles.filterChip}>{tag}</span>
                    ))}
                  </div>
                )}

                <div className={styles.subStats}>
                  <span className={styles.subStat}>
                    <span className={styles.subStatNum}>{sub.newCount}</span>
                    <span className={styles.subStatLabel}>新内容</span>
                  </span>
                  <span className={styles.subStatDivider} />
                  <span className={styles.subStat}>
                    <span className={styles.subStatNum}>{sub.totalMatched}</span>
                    <span className={styles.subStatLabel}>总匹配</span>
                  </span>
                  {sub.lastChecked && (
                    <>
                      <span className={styles.subStatDivider} />
                      <span className={styles.subStatTime}>
                        上次检查 {dayjs(sub.lastChecked).fromNow()}
                      </span>
                    </>
                  )}
                  {sub.notifyEnabled && (
                    <Tag color="blue" style={{ marginLeft: 'auto' }}>推送开启</Tag>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      key: 'settings',
      label: (
        <span className={styles.tabLabel}>
          <SettingOutlined />
          <span>设置</span>
        </span>
      ),
      children: (
        <div className={styles.settingsContainer}>
          <Form
            form={settingsForm}
            layout="vertical"
            onFinish={handleUpdateSettings}
            initialValues={{
              emailNotification: true,
              pushNotification: false,
              weeklyDigest: true,
              language: 'zh-CN',
            }}
          >
            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionTitle}>通知设置</div>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <div className={styles.settingsRowLabel}>邮件通知</div>
                  <div className={styles.settingsRowDesc}>订阅内容更新时发送邮件</div>
                </div>
                <Form.Item name="emailNotification" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <div className={styles.settingsRowLabel}>推送通知</div>
                  <div className={styles.settingsRowDesc}>浏览器推送通知</div>
                </div>
                <Form.Item name="pushNotification" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <div className={styles.settingsRowLabel}>周报订阅</div>
                  <div className={styles.settingsRowDesc}>每周发送具身AI领域精选内容</div>
                </div>
                <Form.Item name="weeklyDigest" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionTitle}>偏好设置</div>
              <Form.Item label="界面语言" name="language">
                <Select
                  options={[
                    { label: '简体中文', value: 'zh-CN' },
                    { label: 'English', value: 'en-US' },
                  ]}
                  style={{ width: 200 }}
                />
              </Form.Item>
            </div>

            <Button type="primary" htmlType="submit" loading={saving} className={styles.saveBtn}>
              保存设置
            </Button>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="个人中心">
      <div className={styles.page}>

        {/* 个人信息主卡 */}
        <div className={styles.profileCard}>
          <div className={styles.profileBanner} style={{ background: levelBadge.gradient }} />
          <div className={styles.profileBody}>
            <div className={styles.profileTop}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrap}>
                  <Avatar
                    size={96}
                    src={user.avatar || user.avatarUrl}
                    icon={<UserOutlined />}
                    className={styles.avatar}
                  />
                </div>
                <div className={styles.levelBadge} style={{ background: levelBadge.gradient }}>
                  {levelBadge.icon} {levelBadge.name}
                </div>
              </div>

              <div className={styles.userInfo}>
                <div className={styles.userNameRow}>
                  <h1 className={styles.userName}>{user.username}</h1>
                  {user.isVip && <Tag color="gold" className={styles.vipTag}>VIP</Tag>}
                </div>

                <p className={styles.userBio}>
                  {user.bio || '还没有填写个人简介，点击"编辑资料"来介绍自己吧～'}
                </p>

                <div className={styles.userMeta}>
                  {user.location && (
                    <span className={styles.metaItem}>
                      <EnvironmentOutlined /> {user.location}
                    </span>
                  )}
                  {user.githubUrl && (
                    <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>
                      <GithubOutlined /> GitHub
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>
                      <LinkOutlined /> LinkedIn
                    </a>
                  )}
                  {user.websiteUrl && (
                    <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>
                      <GlobalOutlined /> 个人网站
                    </a>
                  )}
                </div>

                {(skillList.length > 0 || interestList.length > 0) && (
                  <div className={styles.tagsSection}>
                    {skillList.map((s, i) => (
                      <Tag key={i} color="blue" className={styles.skillTag}>{s}</Tag>
                    ))}
                    {interestList.map((s, i) => (
                      <Tag key={i} color="purple" className={styles.skillTag}>{s}</Tag>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleOpenEdit}
                className={styles.editBtn}
              >
                编辑资料
              </Button>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{formatPoints(user.points || 0)}</span>
                <span className={styles.statLabel}>
                  <TrophyOutlined className={styles.statIcon} /> 积分
                </span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.totalFavorites}</span>
                <span className={styles.statLabel}>
                  <HeartOutlined className={styles.statIcon} /> 收藏
                </span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.totalSubscriptions}</span>
                <span className={styles.statLabel}>
                  <BellOutlined className={styles.statIcon} /> 订阅
                </span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {dayjs(user.createdAt).format('YYYY-MM-DD')}
                </span>
                <span className={styles.statLabel}>加入时间</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          {/* 等级与特权卡 */}
          <div className={styles.levelCard}>
            <div className={styles.levelCardHeader}>
              <div>
                <div className={styles.levelTitle}>
                  {currentLevel.icon} {currentLevel.name}
                  <span className={styles.levelSubtitle}> · {currentLevel.subtitle}</span>
                </div>
                <div className={styles.levelPoints}>
                  {formatPoints(user.points || 0)} 积分
                  {nextLevel && (
                    <span className={styles.nextLevelHint}>
                      · 距 {nextLevel.name} 还差 {formatPoints(pointsToNext)} 分
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.levelNum}>LV{currentLevel.level}</div>
            </div>

            <Progress
              percent={progress}
              strokeColor={levelBadge.gradient}
              trailColor="rgba(0,0,0,0.06)"
              showInfo={false}
              className={styles.levelProgress}
            />

            <div className={styles.benefitsTitle}>等级特权</div>
            <div className={styles.benefitsList}>
              {displayedBenefits.map((b, i) => (
                <div key={i} className={`${styles.benefitItem} ${!b.unlocked ? styles.benefitLocked : ''}`}>
                  {b.unlocked
                    ? <CheckCircleOutlined className={styles.benefitCheck} />
                    : <LockOutlined className={styles.benefitLock} />
                  }
                  <span className={styles.benefitText}>{b.text}</span>
                  {b.status === 'live' && b.unlocked && (
                    <span className={styles.statusLive}>已上线</span>
                  )}
                  {b.status === 'beta' && (
                    <span className={styles.statusBeta}>Beta</span>
                  )}
                  {b.status === 'planned' && (
                    <span className={styles.statusPlanned}>规划中</span>
                  )}
                </div>
              ))}
            </div>
            {benefits.length > 8 && (
              <button
                className={styles.showMoreBtn}
                onClick={() => setShowAllBenefits(!showAllBenefits)}
              >
                {showAllBenefits ? '收起' : `查看全部 ${benefits.length} 项特权`}
              </button>
            )}

            <div className={styles.levelRoadmap}>
              {LEVEL_CONFIG.map((lvl) => (
                <Tooltip key={lvl.level} title={`${lvl.name} · ${lvl.subtitle} (${formatPoints(lvl.minPoints)} 积分)`}>
                  <div
                    className={`${styles.roadmapDot} ${lvl.level <= currentLevel.level ? styles.roadmapDotActive : ''}`}
                    style={lvl.level <= currentLevel.level ? { background: lvl.color } : {}}
                  >
                    {lvl.level === currentLevel.level && (
                      <div className={styles.roadmapCurrent} />
                    )}
                    <span className={styles.roadmapIcon}>{lvl.icon}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 内容 Tabs */}
          <div className={styles.tabsCard}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className={styles.tabs}
            />
          </div>
        </div>
      </div>

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑个人资料"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        width={640}
        className={styles.editModal}
        destroyOnHidden
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          className={styles.editForm}
        >
          {/* 头像上传 */}
          <div className={styles.avatarUploadSection}>
            <div className={styles.avatarUploadPreview}>
              <Avatar
                size={80}
                src={avatarUrl}
                icon={<UserOutlined />}
                className={styles.avatarPreview}
              />
            </div>
            <div className={styles.avatarUploadInfo}>
              <div className={styles.avatarUploadTitle}>更换头像</div>
              <div className={styles.avatarUploadDesc}>支持 JPG、PNG，自动裁剪为正方形</div>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
              >
                <Button icon={<CameraOutlined />} size="small">选择图片</Button>
              </Upload>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '用户名不能为空' }]}
            >
              <Input placeholder="你的用户名" />
            </Form.Item>

            <Form.Item label="所在城市" name="location">
              <Input placeholder="例如：北京、上海" prefix={<EnvironmentOutlined />} />
            </Form.Item>
          </div>

          <Form.Item label="个人简介" name="bio">
            <TextArea
              rows={3}
              placeholder="简单介绍一下自己，你的研究方向、技术栈..."
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item label="技能 (逗号分隔)" name="skills">
            <Input placeholder="例如：Python, ROS2, 计算机视觉, 强化学习" />
          </Form.Item>

          <Form.Item label="研究兴趣 (逗号分隔)" name="interests">
            <Input placeholder="例如：具身智能, 机器人操控, 多模态感知" />
          </Form.Item>

          <div className={styles.sectionDivider}>社交主页</div>

          <div className={styles.formGrid}>
            <Form.Item label="GitHub" name="githubUrl">
              <Input placeholder="https://github.com/username" prefix={<GithubOutlined />} />
            </Form.Item>
            <Form.Item label="个人网站" name="websiteUrl">
              <Input placeholder="https://your-site.com" prefix={<GlobalOutlined />} />
            </Form.Item>
            <Form.Item label="LinkedIn" name="linkedinUrl">
              <Input placeholder="https://linkedin.com/in/..." prefix={<LinkOutlined />} />
            </Form.Item>
            <Form.Item label="Twitter / X" name="twitterUrl">
              <Input placeholder="https://twitter.com/..." />
            </Form.Item>
          </div>

          <div className={styles.editFormFooter}>
            <Button onClick={() => setEditOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存资料
            </Button>
          </div>
        </Form>
      </Modal>
    </PageContainer>
  );
}
