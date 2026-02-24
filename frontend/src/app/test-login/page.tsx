'use client';

import { useState } from 'react';
import { Button, Input, Card, Space } from 'antd';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('Test123456');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    const log = `[${time}] ${msg}`;
    setLogs(prev => [...prev, log]);
    console.log(log);
  };

  const handleLogin = async () => {
    setLoading(true);
    addLog('开始登录...');
    addLog(`邮箱: ${email}`);
    addLog(`密码: ${password.replace(/./g, '*')}`);
    
    try {
      // 直接使用 fetch
      const url = 'http://localhost:3001/api/v1/auth/login';
      addLog(`请求 URL: ${url}`);
      addLog(`请求方法: POST`);
      addLog(`请求体: ${JSON.stringify({ email, password })}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      addLog(`响应状态: ${response.status}`);
      addLog(`响应 OK: ${response.ok}`);
      
      const data = await response.json();
      addLog(`响应数据: ${JSON.stringify(data)}`);
      
      if (response.ok && data.data?.token) {
        addLog('✅ 登录成功！');
        
        // 保存 token
        localStorage.setItem('user_token', data.data.token);
        localStorage.setItem('user_user', JSON.stringify(data.data.user));
        
        addLog('✅ Token 已保存到 localStorage');
        
        // 验证
        const savedToken = localStorage.getItem('user_token');
        addLog(`验证 token: ${savedToken?.substring(0, 30)}...`);
        
        // 跳转
        addLog('准备跳转到首页...');
        setTimeout(() => {
          addLog('正在跳转...');
          window.location.href = '/';
        }, 1000);
      } else {
        addLog(`❌ 登录失败: ${data.message || '未知错误'}`);
      }
    } catch (error: any) {
      addLog(`❌ 请求错误: ${error.message}`);
      addLog(`错误堆栈: ${error.stack}`);
      console.error('登录错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStorage = () => {
    addLog('检查 localStorage...');
    addLog(`user_token: ${localStorage.getItem('user_token')?.substring(0, 30) || 'null'}...`);
    addLog(`user_user: ${localStorage.getItem('user_user') || 'null'}`);
  };

  const clearStorage = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_user');
    addLog('已清空 localStorage');
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
      <Card title="简单登录测试">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label>邮箱：</label>
            <Input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <label>密码：</label>
            <Input.Password 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ marginTop: 8 }}
            />
          </div>
          
          <Space>
            <Button type="primary" onClick={handleLogin} loading={loading}>
              登录
            </Button>
            <Button onClick={checkStorage}>
              检查 Storage
            </Button>
            <Button onClick={clearStorage} danger>
              清空 Storage
            </Button>
          </Space>
          
          <Card title="日志" size="small" style={{ maxHeight: 300, overflow: 'auto' }}>
            <pre style={{ margin: 0, fontSize: 12 }}>
              {logs.join('\n')}
            </pre>
          </Card>
        </Space>
      </Card>
    </div>
  );
}
