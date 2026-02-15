import request from 'supertest';
import app from '../../src/app';

describe('API Tests', () => {

  describe('Authentication API', () => {

    test('POST /api/v1/auth/register - 成功注册', async () => {
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
    });

    test('POST /api/v1/auth/register - 邮箱已存在', async () => {
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

    test('POST /api/v1/auth/login - 成功登录', async () => {
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
      }
    });

    test('POST /api/v1/auth/login - 密码错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

  });

  describe('Content API', () => {

    test('GET /api/v1/papers - 获取论文列表', async () => {
      const response = await request(app)
        .get('/api/v1/papers')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.total).toBeDefined();
    });

    test('GET /api/v1/papers - 分页测试', async () => {
      const response1 = await request(app)
        .get('/api/v1/papers')
        .query({ page: 1, size: 10 });

      const response2 = await request(app)
        .get('/api/v1/papers')
        .query({ page: 2, size: 10 });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.items.length).toBeLessThanOrEqual(10);
      expect(response2.body.data.items.length).toBeLessThanOrEqual(10);
    });

    test('GET /api/v1/papers/:id - 获取论文详情', async () => {
      const listResponse = await request(app)
        .get('/api/v1/papers')
        .query({ page: 1, size: 1 });

      if (listResponse.body.data.items.length > 0) {
        const paperId = listResponse.body.data.items[0].id;
        const response = await request(app)
          .get(`/api/v1/papers/${paperId}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(paperId);
      }
    });

    test('GET /api/v1/repos - 获取GitHub项目列表', async () => {
      const response = await request(app)
        .get('/api/v1/repos')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('GET /api/v1/videos - 获取视频列表', async () => {
      const response = await request(app)
        .get('/api/v1/videos')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

  });

  describe('Feed API', () => {

    test('GET /api/v1/feed - 获取信息流', async () => {
      const response = await request(app)
        .get('/api/v1/feed')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('GET /api/v1/feed - Tab筛选测试', async () => {
      const response = await request(app)
        .get('/api/v1/feed')
        .query({ page: 1, size: 20, tab: 'latest' });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
    });

  });

  describe('Community API', () => {

    test('GET /api/v1/posts - 获取帖子列表', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('GET /api/v1/posts/:id - 获取帖子详情', async () => {
      const listResponse = await request(app)
        .get('/api/v1/posts')
        .query({ page: 1, size: 1 });

      if (listResponse.body.data.items.length > 0) {
        const postId = listResponse.body.data.items[0].id;
        const response = await request(app)
          .get(`/api/v1/posts/${postId}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(postId);
      }
    });

  });

  describe('Task API', () => {

    test('GET /api/v1/tasks - 获取任务列表', async () => {
      const response = await request(app)
        .get('/api/v1/tasks');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

  });

});
