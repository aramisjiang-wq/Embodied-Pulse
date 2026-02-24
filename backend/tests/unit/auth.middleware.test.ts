/**
 * 认证中间件单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate, requireAdmin, requireSuperAdmin } from '../../src/middleware/auth.middleware';
import * as jwtUtils from '../../src/utils/jwt';
import * as userService from '../../src/services/user.service';
import * as adminAuthService from '../../src/services/admin-auth.service';

vi.mock('../../src/utils/jwt');
vi.mock('../../src/services/user.service');
vi.mock('../../src/services/admin-auth.service');
vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = (): NextFunction => vi.fn();

describe('authenticate middleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/v1/test',
      originalUrl: '/api/v1/test',
    };
    res = mockResponse();
    next = mockNext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('extractToken', () => {
    it('应该拒绝缺少 Authorization header 的请求', async () => {
      await authenticate(req as Request, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1002,
          message: '未提供Token',
        })
      );
    });

    it('应该拒绝格式错误的 Authorization header', async () => {
      req.headers = { authorization: 'InvalidFormat' };
      
      await authenticate(req as Request, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1002,
          message: '未提供Token',
        })
      );
    });

    it('应该正确提取 Bearer token', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      
      vi.mocked(jwtUtils.verifyToken).mockReturnValue({
        userId: 'user-1',
        username: 'testuser',
        type: 'access',
      });
      
      vi.mocked(userService.getUserById).mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      } as any);

      await authenticate(req as Request, res, next);
      
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-token');
    });
  });

  describe('token validation', () => {
    it('应该拒绝过期的 token', async () => {
      req.headers = { authorization: 'Bearer expired-token' };
      
      vi.mocked(jwtUtils.verifyToken).mockImplementation(() => {
        throw new Error('TOKEN_EXPIRED');
      });

      await authenticate(req as Request, res, next);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1003,
          message: 'Token已过期',
        })
      );
    });

    it('应该拒绝无效的 token', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      
      vi.mocked(jwtUtils.verifyToken).mockImplementation(() => {
        throw new Error('INVALID_TOKEN');
      });

      await authenticate(req as Request, res, next);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1003,
          message: 'Token无效',
        })
      );
    });

    it('应该拒绝 refresh token 用于访问', async () => {
      req.headers = { authorization: 'Bearer refresh-token' };
      
      vi.mocked(jwtUtils.verifyToken).mockReturnValue({
        userId: 'user-1',
        username: 'testuser',
        type: 'refresh',
      });

      await authenticate(req as Request, res, next);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1003,
          message: 'Token类型错误',
        })
      );
    });
  });

  describe('user resolution', () => {
    it('应该拒绝不存在的用户', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      
      vi.mocked(jwtUtils.verifyToken).mockReturnValue({
        userId: 'nonexistent',
        username: 'ghost',
        type: 'access',
      });
      
      vi.mocked(userService.getUserById).mockResolvedValue(null);

      await authenticate(req as Request, res, next);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1005,
          message: '用户不存在',
        })
      );
    });

    it('应该拒绝被禁用的用户', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      
      vi.mocked(jwtUtils.verifyToken).mockReturnValue({
        userId: 'user-1',
        username: 'banned',
        type: 'access',
      });
      
      vi.mocked(userService.getUserById).mockResolvedValue({
        id: 'user-1',
        username: 'banned',
        isActive: false,
      } as any);

      await authenticate(req as Request, res, next);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1004,
          message: '账号已被禁用',
        })
      );
    });

    it('应该成功认证有效用户', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      
      vi.mocked(jwtUtils.verifyToken).mockReturnValue({
        userId: 'user-1',
        username: 'testuser',
        type: 'access',
      });
      
      vi.mocked(userService.getUserById).mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      } as any);

      await authenticate(req as Request, res, next);
      
      expect(next).toHaveBeenCalled();
      expect((req as any).user).toBeDefined();
      expect((req as any).user.id).toBe('user-1');
      expect((req as any).isAdmin).toBe(false);
    });
  });

  describe('admin path handling', () => {
    it('管理员路径应该查询管理员表', async () => {
      req.headers = { authorization: 'Bearer admin-token' };
      req.path = '/api/admin/users';
      req.originalUrl = '/api/admin/users';
      
      vi.mocked(jwtUtils.verifyToken).mockReturnValue({
        userId: 'admin-1',
        username: 'adminuser',
        type: 'access',
      });
      
      vi.mocked(adminAuthService.getAdminById).mockResolvedValue({
        id: 'admin-1',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
        is_active: 1,
      } as any);

      await authenticate(req as Request, res, next);
      
      expect(adminAuthService.getAdminById).toHaveBeenCalledWith('admin-1');
      expect((req as any).isAdmin).toBe(true);
    });
  });
});

describe('optionalAuthenticate middleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {}, path: '/api/v1/test' };
    res = mockResponse();
    next = mockNext();
    vi.clearAllMocks();
  });

  it('没有 token 时应该继续', async () => {
    await optionalAuthenticate(req as Request, res, next);
    
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('无效 token 时应该继续', async () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    
    vi.mocked(jwtUtils.verifyToken).mockImplementation(() => {
      throw new Error('INVALID_TOKEN');
    });

    await optionalAuthenticate(req as Request, res, next);
    
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('有效 token 时应该设置用户', async () => {
    req.headers = { authorization: 'Bearer valid-token' };
    
    vi.mocked(jwtUtils.verifyToken).mockReturnValue({
      userId: 'user-1',
      username: 'testuser',
      type: 'access',
    });
    
    vi.mocked(userService.getUserById).mockResolvedValue({
      id: 'user-1',
      username: 'testuser',
      isActive: true,
    } as any);

    await optionalAuthenticate(req as Request, res, next);
    
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user-1');
  });
});

describe('requireAdmin middleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = mockResponse();
    next = mockNext();
    vi.clearAllMocks();
  });

  it('应该拒绝未登录用户', () => {
    requireAdmin(req as Request, res, next);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 1002,
        message: '未登录',
      })
    );
  });

  it('应该拒绝非管理员用户', () => {
    (req as any).user = { id: 'user-1', username: 'normal' };
    (req as any).isAdmin = false;

    requireAdmin(req as Request, res, next);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 1006,
        message: '无权限访问',
      })
    );
  });

  it('应该接受管理员用户', () => {
    (req as any).user = { id: 'admin-1', username: 'admin', role: 'admin' };
    (req as any).isAdmin = true;

    requireAdmin(req as Request, res, next);
    
    expect(next).toHaveBeenCalled();
  });

  it('应该接受超级管理员', () => {
    (req as any).user = { id: 'super-1', username: 'superadmin', role: 'super_admin' };
    (req as any).isAdmin = true;

    requireAdmin(req as Request, res, next);
    
    expect(next).toHaveBeenCalled();
  });
});

describe('requireSuperAdmin middleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = mockResponse();
    next = mockNext();
    vi.clearAllMocks();
  });

  it('应该拒绝未登录用户', () => {
    requireSuperAdmin(req as Request, res, next);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 1002,
        message: '未登录',
      })
    );
  });

  it('应该拒绝普通管理员', () => {
    (req as any).user = { id: 'admin-1', username: 'admin', role: 'admin' };

    requireSuperAdmin(req as Request, res, next);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 1006,
        message: '需要超级管理员权限',
      })
    );
  });

  it('应该接受超级管理员', () => {
    (req as any).user = { id: 'super-1', username: 'superadmin', role: 'super_admin' };

    requireSuperAdmin(req as Request, res, next);
    
    expect(next).toHaveBeenCalled();
  });
});
