/**
 * 注册页面
 */

'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, App, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import styles from './page.module.css';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { setUser, setToken, setRefreshToken } = useAuthStore();
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱');
        return;
      }

      setSendingCode(true);
      await apiClient.post('/email-verification/send', { email, type: 'register' });
      message.success('验证码已发送，请检查邮箱');
      
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error(error.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async (values: { username: string; email: string; password: string; confirmPassword: string; verificationCode: string }) => {
    setLoading(true);
    try {
      const response = await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
        verificationCode: values.verificationCode,
      });
      // 先 setToken 再 setUser，确保 isAdmin=false 后再写 user，避免写入 admin_user
      setToken(response.token, false);
      if (response.refreshToken) setRefreshToken(response.refreshToken, false);
      setUser(response.user, false);
      message.success('注册成功!');
      router.push('/');
    } catch (error: any) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Card className={styles.registerCard}>
        <div className={styles.registerHeader}>
          <h1 className={styles.registerTitle}>注册账号</h1>
          <p className={styles.registerSubtitle}>加入 Embodied Pulse 市集</p>
        </div>

        <Form form={form} onFinish={handleRegister} layout="vertical">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名必须是3-20个字符,只能包含字母、数字、下划线' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

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
            name="verificationCode"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Row gutter={8}>
              <Col span={16}>
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="邮箱验证码"
                  size="large"
                  maxLength={6}
                />
              </Col>
              <Col span={8}>
                <Button
                  size="large"
                  block
                  disabled={countdown > 0}
                  loading={sendingCode}
                  onClick={sendVerificationCode}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少8个字符' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: '密码必须包含字母和数字' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
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
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.registerFooter}>
          已有账号? <Link href="/login" className={styles.registerLink}>立即登录</Link>
        </div>
      </Card>
    </div>
  );
}
