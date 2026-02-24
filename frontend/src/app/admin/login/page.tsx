/**
 * 管理端登录页面
 */

'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken, setRefreshToken } = useAuthStore();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const cleanedEmail = (values.email || '').trim().toLowerCase();
      const cleanedPassword = (values.password || '').trim();

      const response = await authApi.adminLogin({
        email: cleanedEmail,
        password: cleanedPassword,
      });

      setToken(response.token, true);
      if (response.refreshToken) setRefreshToken(response.refreshToken, true);
      setUser(response.user, true);
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_login_success', 'true');
        sessionStorage.setItem('admin_login_timestamp', Date.now().toString());
        sessionStorage.setItem('admin_user', JSON.stringify(response.user));
      }

      message.success('登录成功');
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 300);
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || '登录失败，请检查邮箱和密码';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <Card className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Embodied Pulse</h1>
          <p className={styles.loginSubtitle}>管理后台</p>
        </div>

        <Form name="admin_login" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入管理员邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="管理员邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.loginFooter}>
          <a href="/" className={styles.loginLink}>
            返回用户端
          </a>
        </div>
      </Card>
    </div>
  );
}
