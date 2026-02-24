/**
 * 移动端导航组件
 */

'use client';

import { Drawer, Menu, Avatar, Space, Button } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  HomeOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  TeamOutlined,
  CommentOutlined,
  ReadOutlined,
  TrophyOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { getLevelByPoints } from '@/lib/utils/levelUtils';

interface MobileNavProps {
  visible: boolean;
  onClose: () => void;
}

export default function MobileNav({ visible, onClose }: MobileNavProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  // 基于积分计算当前等级
  const userLevel = user ? getLevelByPoints(user.points || 0) : null;

  const handleLogout = () => {
    logout();
    router.push('/');
    onClose();
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => handleNavigate('/'),
    },
    {
      key: 'papers',
      icon: <FileTextOutlined />,
      label: '论文',
      onClick: () => handleNavigate('/papers'),
    },
    {
      key: 'repos',
      icon: <RobotOutlined />,
      label: 'GitHub仓库',
      onClick: () => handleNavigate('/repos'),
    },
    {
      key: 'huggingface',
      icon: <RobotOutlined />,
      label: 'HuggingFace',
      onClick: () => handleNavigate('/huggingface'),
    },
    {
      key: 'videos',
      icon: <PlayCircleOutlined />,
      label: '视频',
      onClick: () => handleNavigate('/videos'),
    },
    {
      key: 'jobs',
      icon: <TeamOutlined />,
      label: '招聘',
      onClick: () => handleNavigate('/jobs'),
    },
    {
      key: 'pages',
      icon: <ReadOutlined />,
      label: '资讯',
      onClick: () => handleNavigate('/pages'),
    },
    {
      key: 'community',
      icon: <CommentOutlined />,
      label: '市集',
      onClick: () => handleNavigate('/community'),
    },
    {
      key: 'ranking',
      icon: <TrophyOutlined />,
      label: '排行榜',
      onClick: () => handleNavigate('/ranking'),
    },
  ];

  const userMenuItems = user ? [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => handleNavigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => handleNavigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ] : [];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>菜单</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </div>
      }
      placement="left"
      onClose={onClose}
      open={visible}
      width={280}
      styles={{
        body: { padding: 0 },
      }}
    >
      <div style={{ padding: '16px 0' }}>
        <Menu
          mode="inline"
          items={menuItems}
          style={{ border: 'none' }}
        />

        {user && (
          <>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar src={user.avatarUrl} icon={<UserOutlined />} size={40} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{user.username}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      LV{userLevel?.level || 1} · {user.points}积分
                    </div>
                  </div>
                </div>
              </Space>
            </div>

            <Menu
              mode="inline"
              items={userMenuItems}
              style={{ border: 'none' }}
            />
          </>
        )}

        {!user && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                block
                onClick={() => handleNavigate('/login')}
              >
                登录
              </Button>
              <Button
                block
                onClick={() => handleNavigate('/register')}
              >
                注册
              </Button>
            </Space>
          </div>
        )}
      </div>
    </Drawer>
  );
}
