'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, App, Spin } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api/client';
import styles from './page.module.css';

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await apiClient.get(`/password-reset/validate/${token}`);
        const validateData = response.data as { valid?: boolean; email?: string };
        if (validateData?.valid) {
          setValid(true);
          setEmail(validateData.email || '');
        }
      } catch (error) {
        message.error('重置链接无效或已过期');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [searchParams, message]);

  const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      message.error('重置链接无效');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/password-reset/reset', {
        token,
        newPassword: values.newPassword,
      });
      setSuccess(true);
      message.success('密码重置成功');
    } catch (error: any) {
      message.error(error.message || '重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (success) {
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
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          </div>
          <h2 style={{ marginBottom: 16 }}>密码重置成功</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            您的密码已成功重置，请使用新密码登录。
          </p>
          <Link href="/login">
            <Button type="primary">立即登录</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!valid) {
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
          <h2 style={{ marginBottom: 16, color: '#ff4d4f' }}>链接无效</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            重置链接无效或已过期，请重新获取。
          </p>
          <Link href="/forgot-password">
            <Button type="primary">重新获取</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Card className={styles.formCard}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>重置密码</h1>
          <p style={{ color: '#666' }}>为账号 {email} 设置新密码</p>
        </div>

        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少8个字符' },
              { max: 32, message: '密码最多32个字符' },
              { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码需包含字母和数字' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认新密码"
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
              确认重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
