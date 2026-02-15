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

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
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
      setUser(response.user);
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_login_success', 'true');
        sessionStorage.setItem('admin_login_timestamp', Date.now().toString());
        sessionStorage.setItem('admin_user', JSON.stringify(response.user));
      }

      message.success('登录成功');
      
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 200);
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || '登录失败，请检查邮箱和密码';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 450, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff', margin: 0 }}>
            Embodied Pulse
          </h1>
          <p style={{ fontSize: 16, color: '#999', marginTop: 8 }}>管理后台</p>
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

        <div style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
          <a href="/" style={{ color: '#1890ff' }}>
            返回用户端
          </a>
        </div>
      </Card>
    </div>
  );
}
