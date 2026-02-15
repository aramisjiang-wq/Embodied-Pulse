'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, App } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await apiClient.post('/password-reset/request', { email: values.email });
      setSubmitted(true);
      message.success('重置邮件已发送，请检查您的邮箱');
    } catch (error: any) {
      message.error(error.message || '发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: '24px'
      }}>
        <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <MailOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          </div>
          <h2 style={{ marginBottom: 16 }}>邮件已发送</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            如果该邮箱已注册，您将收到密码重置链接。<br />
            链接有效期为 1 小时。
          </p>
          <Link href="/login">
            <Button type="primary">返回登录</Button>
          </Link>
        </Card>
      </div>
    );
  }

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
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>找回密码</h1>
          <p style={{ color: '#666' }}>输入您的邮箱地址，我们将发送重置链接</p>
        </div>

        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="注册时使用的邮箱"
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
              发送重置链接
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/login" style={{ color: '#1890ff' }}>
            <ArrowLeftOutlined /> 返回登录
          </Link>
        </div>
      </Card>
    </div>
  );
}
