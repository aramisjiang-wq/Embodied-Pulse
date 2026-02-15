import request from 'supertest';
import app from '../../src/app';

describe('Content API Tests', () => {

  describe('GET /api/v1/papers', () => {
    test('应该返回论文列表', async () => {
      const response = await request(app)
        .get('/api/v1/papers')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(typeof response.body.data.total).toBe('number');
    });

    test('应该支持分页', async () => {
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

    test('应该支持自定义页面大小', async () => {
      const response = await request(app)
        .get('/api/v1/papers')
        .query({ page: 1, size: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });

    test('应该处理无效的分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/papers')
        .query({ page: -1, size: 0 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
    });
  });

  describe('GET /api/v1/papers/:id', () => {
    test('应该返回论文详情', async () => {
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
        expect(response.body.data.title).toBeDefined();
      }
    });

    test('应该处理不存在的论文ID', async () => {
      const response = await request(app)
        .get('/api/v1/papers/999999');

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });

    test('应该处理无效的论文ID格式', async () => {
      const response = await request(app)
        .get('/api/v1/papers/invalid-id');

      expect(response.status).toBe(200);
      expect(response.body.code).not.toBe(0);
    });
  });

  describe('GET /api/v1/repos', () => {
    test('应该返回GitHub项目列表', async () => {
      const response = await request(app)
        .get('/api/v1/repos')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/repos')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/repos/:id', () => {
    test('应该返回项目详情', async () => {
      const listResponse = await request(app)
        .get('/api/v1/repos')
        .query({ page: 1, size: 1 });

      if (listResponse.body.data.items.length > 0) {
        const repoId = listResponse.body.data.items[0].id;
        const response = await request(app)
          .get(`/api/v1/repos/${repoId}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(repoId);
      }
    });
  });

  describe('GET /api/v1/videos', () => {
    test('应该返回视频列表', async () => {
      const response = await request(app)
        .get('/api/v1/videos')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/videos')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/videos/:id', () => {
    test('应该返回视频详情', async () => {
      const listResponse = await request(app)
        .get('/api/v1/videos')
        .query({ page: 1, size: 1 });

      if (listResponse.body.data.items.length > 0) {
        const videoId = listResponse.body.data.items[0].id;
        const response = await request(app)
          .get(`/api/v1/videos/${videoId}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(videoId);
      }
    });
  });

  describe('GET /api/v1/news', () => {
    test('应该返回新闻列表', async () => {
      const response = await request(app)
        .get('/api/v1/news')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/news')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/jobs', () => {
    test('应该返回招聘信息列表', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(10);
    });

    test('应该支持筛选参数', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ page: 1, size: 20, type: 'full-time' });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    test('应该返回招聘信息详情', async () => {
      const listResponse = await request(app)
        .get('/api/v1/jobs')
        .query({ page: 1, size: 1 });

      if (listResponse.body.data.items.length > 0) {
        const jobId = listResponse.body.data.items[0].id;
        const response = await request(app)
          .get(`/api/v1/jobs/${jobId}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(jobId);
      }
    });
  });

  describe('GET /api/v1/huggingface', () => {
    test('应该返回HuggingFace模型列表', async () => {
      const response = await request(app)
        .get('/api/v1/huggingface')
        .query({ page: 1, size: 20 });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/huggingface')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(10);
    });
  });

});
