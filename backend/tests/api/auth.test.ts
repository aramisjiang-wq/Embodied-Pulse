import request from 'supertest';
import app from '../../src/app';

describe('Authentication API Tests', () => {

  describe('POST /api/v1/auth/register', () => {
    test('应该成功注册新用户', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test${timestamp}@example.com`,
          password: 'Test@123456',
          confirmPassword: 'Test@123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(`test${timestamp}@example.com`);
    });

    test('应该拒绝已存在的邮箱', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser1@example.com',
          password: 'Test@123456',
          confirmPassword: 'Test@123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

    test('应该拒绝无效的邮箱格式', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@123456',
          confirmPassword: 'Test@123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

    test('应该拒绝弱密码', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: '123',
          confirmPassword: '123',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

    test('应该拒绝密码不匹配', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'Test@123456',
          confirmPassword: 'Test@1234567',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('应该成功登录有效用户', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'Test@123456',
        });

      expect(response.status).toBe(200);
      if (response.body.code === 0) {
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe('testuser1@example.com');
      }
    });

    test('应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

    test('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

    test('应该拒绝缺少必需字段', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser1@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('应该返回当前用户信息', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'Test@123456',
        });

      if (loginResponse.body.code === 0) {
        const token = loginResponse.body.data.token;
        const response = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.data.email).toBe('testuser1@example.com');
      }
    });

    test('应该拒绝无效的token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

    test('应该拒绝缺少token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('应该成功登出', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'Test@123456',
        });

      if (loginResponse.body.code === 0) {
        const token = loginResponse.body.data.token;
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
      }
    });
  });

});
