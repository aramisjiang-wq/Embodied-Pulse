/**
 * 登录页面
 */

'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, Space, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { setUser, setToken, setRefreshToken } = useAuthStore();
  const router = useRouter();
  const { message } = App.useApp();

  const handleEmailLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      console.log('[Login] Starting login for:', values.email);
      const response = await authApi.login(values);
      console.log('[Login] Login response:', { hasToken: !!response?.token, hasUser: !!response?.user, userId: response?.user?.id });
      
      if (!response?.token || !response?.user) {
        message.error('登录返回数据异常，请重试');
        return;
      }
      
      console.log('[Login] Calling setToken...');
      setToken(response.token, false);
      console.log('[Login] setToken completed');
      
      if (response.refreshToken) {
        console.log('[Login] Setting refresh token');
        setRefreshToken(response.refreshToken, false);
      }
      
      console.log('[Login] Calling setUser...');
      setUser(response.user, false);
      console.log('[Login] setUser completed');

      const savedToken = localStorage.getItem('user_token');
      console.log('[Login] Token saved check:', { hasToken: !!savedToken });
      
      if (!savedToken) {
        message.error('登录状态保存失败，请重试');
        return;
      }

      console.log('[Login] Login successful, redirecting to /');
      message.success('登录成功');
      router.push('/');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (error as { message?: string })?.message;
      console.error('[Login] Login error:', error);
      message.error(msg || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Card className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Embodied Pulse</h1>
          <p className={styles.loginSubtitle}>发现具身智能的精彩</p>
        </div>

        <Form onFinish={handleEmailLogin} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.loginLinks}>
          <Space split="|">
            <Link href="/register" className={styles.loginLink}>
              注册账号
            </Link>
            <Link href="/forgot-password" className={styles.forgotLink}>
              忘记密码
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  );
}
