# Embodied Pulse API接口文档

**产品名称**：Embodied Pulse（具身智能脉搏）  
**文档类型**：API接口规格说明书  
**版本**：v4.0  
**Base URL**：http://localhost:3001/api/v1  
**更新日期**：2026-02-17  
**状态**：已发布  

---

## 目录

1. [接口规范](#1-接口规范)
2. [认证接口](#2-认证接口)
3. [内容接口](#3-内容接口)
4. [用户接口](#4-用户接口)
5. [社区接口](#5-社区接口)
6. [订阅接口](#6-订阅接口)
7. [管理接口](#7-管理接口)
8. [同步接口](#8-同步接口)
9. [错误码参考](#9-错误码参考)

---

## 1. 接口规范

### 1.1 统一响应格式

```typescript
interface ApiResponse<T> {
  code: number;      // 状态码：0=成功
  message: string;   // 状态消息
  data: T;           // 响应数据
  timestamp: number; // 时间戳
}
```

### 1.2 分页参数

```typescript
interface PaginationParams {
  page: number;      // 页码，从1开始
  size: number;      // 每页数量，默认20
  sort?: string;     // 排序字段
  order?: 'asc' | 'desc';  // 排序方向
}
```

### 1.3 分页响应

```typescript
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}
```

### 1.4 认证方式

所有需要认证的接口需在请求头携带Token：

```
Authorization: Bearer <access_token>
```

---

## 2. 认证接口

### 2.1 发送邮箱验证码

**POST** `/email-verification/send`

**请求体**：
```json
{
  "email": "user@example.com",
  "type": "register"  // register | reset
}
```

**响应**：
```json
{
  "code": 0,
  "message": "验证码发送成功",
  "data": null
}
```

### 2.2 验证邮箱验证码

**POST** `/email-verification/verify`

**请求体**：
```json
{
  "email": "user@example.com",
  "code": "123456",
  "type": "register"
}
```

### 2.3 用户注册

**POST** `/auth/register`

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户昵称",
  "code": "123456"
}
```

### 2.4 用户登录

**POST** `/auth/login`

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "用户昵称",
      "avatarUrl": null,
      "role": "user"
    }
  }
}
```

### 2.5 请求密码重置

**POST** `/password-reset/request`

**请求体**：
```json
{
  "email": "user@example.com"
}
```

### 2.6 确认密码重置

**POST** `/password-reset/confirm`

**请求体**：
```json
{
  "token": "reset_token_from_email",
  "password": "new_password"
}
```

### 2.7 刷新Token

**POST** `/auth/refresh`

**请求体**：
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.8 获取当前用户

**GET** `/auth/me`

**认证**：需要

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "用户昵称",
    "avatarUrl": null,
    "bio": null,
    "points": 0,
    "role": "user"
  }
}
```

### 2.9 管理员登录

**POST** `/auth/admin/login`

**请求体**：
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### 2.10 获取当前管理员

**GET** `/auth/admin/me`

**认证**：需要管理员Token

---

## 3. 内容接口

### 3.1 获取信息流

**GET** `/feed`

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tab | string | 否 | 类型：recommend/papers/videos/repos/models/jobs |
| page | number | 否 | 页码 |
| size | number | 否 | 每页数量 |

### 3.2 论文接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/papers` | 论文列表 | 否 |
| GET | `/papers/:id` | 论文详情 | 否 |

**论文列表参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| size | number | 每页数量 |
| keyword | string | 搜索关键词 |
| sort | string | 排序字段 |

### 3.3 视频接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/videos` | 视频列表 | 否 |
| GET | `/videos/:id` | 视频详情 | 否 |

### 3.4 仓库接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/repos` | 仓库列表 | 否 |
| GET | `/repos/:id` | 仓库详情 | 否 |

### 3.5 HuggingFace模型接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/huggingface` | 模型列表 | 否 |
| GET | `/huggingface/:id` | 模型详情 | 否 |

### 3.6 职位接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/jobs` | 职位列表 | 否 |
| GET | `/jobs/:id` | 职位详情 | 否 |

### 3.7 发现接口

**GET** `/discovery`

获取发现页内容推荐。

### 3.8 排行榜接口

**GET** `/ranking`

获取热门内容排行榜。

### 3.9 搜索接口

**GET** `/search`

**参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词 |
| type | string | 内容类型 |
| page | number | 页码 |
| size | number | 每页数量 |

### 3.10 统计接口

**GET** `/stats/content`

获取内容统计数据。

### 3.11 公告接口

**GET** `/announcements`

获取系统公告列表。

### 3.12 Banner接口

**GET** `/banners`

获取首页Banner列表。

### 3.13 首页模块接口

**GET** `/home-modules`

获取首页模块配置。

### 3.14 自定义页面接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/pages` | 页面列表 | 否 |
| GET | `/pages/:slug` | 根据slug获取页面 | 否 |

### 3.15 GitHub仓库信息接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/github-repo-info` | 仓库信息列表 | 否 |

---

## 4. 用户接口

### 4.1 用户资料

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/user/profile` | 获取当前用户资料 | 需要 |
| PUT | `/user/profile` | 更新用户资料 | 需要 |

### 4.2 公开用户信息

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/users/:id` | 获取公开用户信息 | 否 |

### 4.3 收藏功能

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/favorites` | 收藏列表 | 需要 |
| POST | `/favorites` | 添加收藏 | 需要 |
| DELETE | `/favorites/:id` | 取消收藏 | 需要 |

**添加收藏请求体**：
```json
{
  "contentType": "paper",  // paper/video/repo/model/job
  "contentId": "uuid"
}
```

### 4.4 通知功能

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/notifications` | 通知列表 | 需要 |
| PUT | `/notifications/:id/read` | 标记已读 | 需要 |
| PUT | `/notifications/read-all` | 全部已读 | 需要 |
| GET | `/notifications/unread-count` | 未读数量 | 需要 |

### 4.5 任务功能

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/tasks/daily` | 每日任务 | 需要 |
| POST | `/tasks/sign-in` | 签到 | 需要 |

---

## 5. 社区接口

### 5.1 帖子接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/posts` | 帖子列表 | 可选 |
| GET | `/posts/my` | 我的帖子 | 需要 |
| GET | `/posts/:id` | 帖子详情 | 可选 |
| POST | `/posts` | 发布帖子 | 需要 |
| PUT | `/posts/:id` | 更新帖子 | 需要 |
| DELETE | `/posts/:id` | 删除帖子 | 需要 |
| POST | `/posts/:id/like` | 点赞帖子 | 需要 |

**发布帖子请求体**：
```json
{
  "title": "帖子标题",
  "content": "帖子内容",
  "tags": ["标签1", "标签2"]
}
```

### 5.2 评论接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/comments` | 评论列表 | 可选 |
| POST | `/comments` | 发表评论 | 需要 |
| DELETE | `/comments/:id` | 删除评论 | 需要 |
| POST | `/comments/:id/like` | 点赞评论 | 需要 |

**发表评论请求体**：
```json
{
  "postId": "uuid",
  "content": "评论内容",
  "parentId": "uuid"  // 可选，回复评论时使用
}
```

### 5.3 社区接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/community` | 社区帖子列表 | 否 |
| GET | `/community/:id` | 社区帖子详情 | 否 |

---

## 6. 订阅接口

### 6.1 关键词订阅

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/subscriptions` | 订阅列表 | 需要 |
| POST | `/subscriptions` | 创建订阅 | 需要 |
| PUT | `/subscriptions/:id` | 更新订阅 | 需要 |
| DELETE | `/subscriptions/:id` | 删除订阅 | 需要 |

**创建订阅请求体**：
```json
{
  "keyword": "具身智能",
  "types": ["paper", "video", "repo"]
}
```

### 6.2 内容订阅

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/content-subscriptions` | 内容订阅列表 | 需要 |
| POST | `/content-subscriptions` | 创建内容订阅 | 需要 |
| DELETE | `/content-subscriptions/:id` | 删除内容订阅 | 需要 |

### 6.3 HuggingFace订阅

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/huggingface-subscriptions` | HF订阅列表 | 需要 |
| POST | `/huggingface-subscriptions` | 创建HF订阅 | 需要 |
| DELETE | `/huggingface-subscriptions/:id` | 删除HF订阅 | 需要 |

### 6.4 订阅更新

**GET** `/subscription-updates`

获取订阅更新内容。

---

## 7. 管理接口

### 7.1 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/users` | 用户列表 |
| PUT | `/admin/users/:id` | 更新用户 |
| DELETE | `/admin/users/:id` | 删除用户 |

### 7.2 管理员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/admins` | 管理员列表 |
| POST | `/admin/admins` | 创建管理员 |
| PUT | `/admin/admins/:id` | 更新管理员 |
| DELETE | `/admin/admins/:id` | 删除管理员 |

### 7.3 内容管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/content/papers` | 论文管理 |
| GET | `/admin/content/videos` | 视频管理 |
| GET | `/admin/content/repos` | 仓库管理 |
| GET | `/admin/content/jobs` | 职位管理 |
| GET | `/admin/content/huggingface` | 模型管理 |

### 7.4 自定义页面管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/pages` | 页面列表 |
| POST | `/admin/pages` | 创建页面 |
| PUT | `/admin/pages/:id` | 更新页面 |
| DELETE | `/admin/pages/:id` | 删除页面 |

**页面数据结构**：
```json
{
  "title": "页面标题",
  "slug": "page-slug",
  "content": "<p>HTML内容</p>",
  "isActive": true,
  "sortOrder": 0
}
```

### 7.5 Banner管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/banners` | Banner列表 |
| POST | `/admin/banners` | 创建Banner |
| PUT | `/admin/banners/:id` | 更新Banner |
| DELETE | `/admin/banners/:id` | 删除Banner |

### 7.6 公告管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/announcements` | 公告列表 |
| POST | `/admin/announcements` | 创建公告 |
| PUT | `/admin/announcements/:id` | 更新公告 |
| DELETE | `/admin/announcements/:id` | 删除公告 |

### 7.7 首页模块管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/home-modules` | 模块列表 |
| POST | `/admin/home-modules` | 创建模块 |
| PUT | `/admin/home-modules/:id` | 更新模块 |
| DELETE | `/admin/home-modules/:id` | 删除模块 |

### 7.8 社区管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/community` | 社区内容管理 |
| GET | `/admin/community-config` | 社区配置 |
| PUT | `/admin/community-config` | 更新社区配置 |

### 7.9 数据源管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/data-sources` | 数据源列表 |
| POST | `/admin/data-sources` | 创建数据源 |
| PUT | `/admin/data-sources/:id` | 更新数据源 |
| DELETE | `/admin/data-sources/:id` | 删除数据源 |

### 7.10 B站UP主管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/bilibili-uploaders` | UP主列表 |
| POST | `/admin/bilibili-uploaders` | 添加UP主 |
| PUT | `/admin/bilibili-uploaders/:id` | 更新UP主 |
| DELETE | `/admin/bilibili-uploaders/:id` | 删除UP主 |

### 7.11 搜索关键词管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/bilibili-search-keywords` | B站关键词列表 |
| POST | `/admin/bilibili-search-keywords` | 添加B站关键词 |
| DELETE | `/admin/bilibili-search-keywords/:id` | 删除B站关键词 |
| GET | `/admin/paper-search-keywords` | 论文关键词列表 |
| POST | `/admin/paper-search-keywords` | 添加论文关键词 |
| DELETE | `/admin/paper-search-keywords/:id` | 删除论文关键词 |

### 7.12 Cookie管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/cookies` | Cookie列表 |
| POST | `/admin/cookies` | 添加Cookie |
| PUT | `/admin/cookies/:id` | 更新Cookie |
| DELETE | `/admin/cookies/:id` | 删除Cookie |

### 7.13 统计分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/stats` | 统计数据 |

---

## 8. 同步接口

### 8.1 数据同步

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/admin/sync/arxiv` | 同步ArXiv论文 |
| POST | `/admin/sync/github` | 同步GitHub仓库 |
| POST | `/admin/sync/bilibili` | 同步B站视频 |
| POST | `/admin/sync/huggingface` | 同步HuggingFace模型 |
| POST | `/admin/sync/jobs` | 同步职位 |
| GET | `/admin/sync/status` | 同步状态 |

### 8.2 同步队列

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/sync-queue` | 同步队列列表 |
| DELETE | `/admin/sync-queue/:id` | 删除队列任务 |

### 8.3 定时任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/scheduler` | 定时任务列表 |
| PUT | `/admin/scheduler/:id` | 更新定时任务 |
| POST | `/admin/scheduler/:id/run` | 手动执行任务 |

### 8.4 职位同步

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/job-sync` | 职位同步配置 |
| POST | `/admin/job-sync` | 触发职位同步 |

### 8.5 HuggingFace API配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/huggingface-api` | HF API配置 |
| PUT | `/admin/huggingface-api` | 更新HF API配置 |

### 8.6 HuggingFace作者订阅

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/huggingface-authors` | HF作者列表 |
| POST | `/admin/huggingface-authors` | 添加HF作者 |
| DELETE | `/admin/huggingface-authors/:id` | 删除HF作者 |

### 8.7 缓存管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/cache` | 缓存状态 |
| DELETE | `/admin/cache` | 清除缓存 |

### 8.8 数据库连接池

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/db-pool` | 连接池状态 |

### 8.9 队列管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/queues` | 队列状态 |

---

## 9. 错误码参考

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| 0 | 成功 | 200 |
| 1001 | 参数错误 | 400 |
| 1002 | 未提供Token | 401 |
| 1003 | Token无效 | 401 |
| 1004 | Token已过期 | 401 |
| 2001 | 资源不存在 | 404 |
| 2002 | 权限不足 | 403 |
| 2003 | 用户已存在 | 409 |
| 2004 | 验证码错误 | 400 |
| 2005 | 验证码已过期 | 400 |
| 2006 | 邮箱或密码错误 | 401 |
| 2007 | 用户已被禁用 | 403 |
| 3001 | 服务器内部错误 | 500 |
| 3002 | 数据库错误 | 500 |
| 3003 | 第三方服务错误 | 502 |

---

## 附录

### A. API路由完整清单

基于后端路由配置，完整API路由如下：

**公开路由**：
- `/auth/*` - 认证相关
- `/password-reset/*` - 密码重置
- `/email-verification/*` - 邮箱验证
- `/feed` - 信息流
- `/papers/*` - 论文
- `/videos/*` - 视频
- `/repos/*` - 仓库
- `/jobs/*` - 职位
- `/huggingface/*` - HuggingFace模型
- `/community/*` - 社区
- `/posts/*` - 帖子
- `/comments/*` - 评论
- `/search` - 搜索
- `/ranking` - 排行榜
- `/discovery` - 发现
- `/stats/*` - 统计
- `/announcements` - 公告
- `/banners` - Banner
- `/home-modules` - 首页模块
- `/pages/*` - 自定义页面
- `/users/*` - 公开用户信息
- `/github-repo-info` - GitHub仓库信息
- `/robots.txt` - robots文件
- `/seo/*` - SEO相关

**需要认证的路由**：
- `/user/*` - 用户资料
- `/favorites/*` - 收藏
- `/subscriptions/*` - 订阅
- `/content-subscriptions/*` - 内容订阅
- `/huggingface-subscriptions/*` - HF订阅
- `/subscription-updates` - 订阅更新
- `/tasks/*` - 任务
- `/notifications/*` - 通知
- `/upload/*` - 文件上传
- `/proxy/*` - 图片代理

**管理端路由**：
- `/admin/*` - 所有管理功能

---

**文档维护**：本文档将随API更新持续维护。
