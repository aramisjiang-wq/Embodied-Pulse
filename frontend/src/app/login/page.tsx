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

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const router = useRouter();
  const { message } = App.useApp();

  const handleEmailLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      setUser(response.user);
      setToken(response.token);
      message.success('登录成功!');
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: '24px'
    }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>Embodied Pulse</h1>
          <p style={{ color: '#666' }}>发现具身智能的精彩</p>
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

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space split="|">
            <Link href="/register" style={{ color: '#1890ff' }}>
              注册账号
            </Link>
            <Link href="/forgot-password" style={{ color: '#666' }}>
              忘记密码
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  );
}
