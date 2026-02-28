# Embodied Pulse Pro - 项目架构文档

## 1. 项目概览

### 1.1 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + TypeScript |
| 后端框架 | Express.js + TypeScript |
| 数据库 | SQLite + Prisma ORM |
| 认证 | JWT (访问令牌 + 刷新令牌) |
| UI 组件库 | Ant Design |
| 状态管理 | Zustand |

### 1.2 项目结构

```
EmbodiedPulsePro/
├── frontend/                    # Next.js 前端应用
│   ├── src/
│   │   ├── app/                 # App Router 页面
│   │   ├── lib/                 # 工具函数和 API 客户端
│   │   ├── store/               # Zustand 状态管理
│   │   └── components/          # React 组件
│   └── public/                  # 静态资源
├── backend/                     # Express.js 后端
│   ├── src/
│   │   ├── routes/              # API 路由定义
│   │   ├── controllers/         # 控制器（请求处理）
│   │   ├── services/            # 服务层（业务逻辑）
│   │   ├── middleware/          # 中间件（认证、验证等）
│   │   ├── config/              # 配置
│   │   ├── utils/               # 工具函数
│   │   └── types/               # 类型定义
│   └── prisma/                  # 数据库 schema
└── docs/                        # 文档
```

---

## 2. 页面清单

### 2.1 用户端页面（公开访问）

| 路径 | 页面名称 | 功能描述 |
|------|----------|----------|
| `/` | 首页 | 展示首页内容、推荐内容 |
| `/login` | 登录 | 用户登录 |
| `/register` | 注册 | 用户注册 |
| `/forgot-password` | 忘记密码 | 密码重置请求 |
| `/reset-password` | 重置密码 | 密码重置 |
| `/profile` | 个人资料 | 用户个人资料页面 |
| `/settings` | 设置 | 用户设置 |
| `/papers` | 论文列表 | arXiv 论文浏览 |
| `/papers/[id]` | 论文详情 | 单篇论文详情 |
| `/videos` | 视频列表 | Bilibili/YouTube 视频 |
| `/videos/[id]` | 视频详情 | 单个视频详情 |
| `/repos` | GitHub 项目 | GitHub 仓库列表 |
| `/repos/[id]` | 项目详情 | 仓库详情页 |
| `/jobs` | 招聘信息 | 职位列表 |
| `/jobs/[id]` | 职位详情 | 职位详情 |
| `/huggingface` | HuggingFace 模型 | ML 模型列表 |
| `/huggingface/[id]` | 模型详情 | 模型详情页 |
| `/news` | 每日资讯 | 新闻列表 |
| `/news/[id]` | 资讯详情 | 新闻详情 |
| `/community` | 社区 | 用户社区帖子列表 |
| `/community/[id]` | 帖子详情 | 社区帖子详情 |
| `/my-community` | 我的社区 | 用户发布的帖子 |
| `/search` | 搜索 | 全局搜索 |
| `/ranking` | 排行榜 | 内容排行榜 |
| `/discovery` | 发现 | 发现页 |
| `/favorites` | 收藏 | 用户收藏夹 |
| `/subscriptions` | 订阅 | 内容订阅管理 |
| `/subscriptions/[id]` | 订阅详情 | 订阅详情页 |
| `/subscriptions-new` | 新建订阅 | 创建新订阅 |
| `/user/[id]` | 用户主页 | 其他用户公开主页 |
| `/test-login` | 测试登录 | 开发测试用 |

### 2.2 管理端页面（需要管理员权限）

| 路径 | 页面名称 | 功能描述 |
|------|----------|----------|
| `/admin/login` | 管理员登录 | 管理员登录 |
| `/admin` | 管理首页 | 仪表盘 |
| `/admin/admins` | 管理员管理 | 创建/管理管理员账号 |
| `/admin/users` | 用户管理 | 用户列表与管理 |
| `/admin/stats` | 数据统计 | 系统统计信息 |
| `/admin/home-modules` | 首页模块 | 首页运营模块配置 |
| `/admin/banners` | 横幅管理 | 首页横幅配置 |
| `/admin/announcements` | 公告管理 | 系统公告 |
| `/admin/content/papers` | 论文管理 | 论文内容管理 |
| `/admin/content/videos` | 视频管理 | 视频内容管理 |
| `/admin/content/repos` | 项目管理 | GitHub 项目管理 |
| `/admin/content/jobs` | 职位管理 | 招聘信息管理 |
| `/admin/content/huggingface` | 模型管理 | HuggingFace 模型管理 |
| `/admin/content` | 内容管理 | 综合内容管理 |
| `/admin/community` | 社区管理 | 社区帖子管理 |
| `/admin/community-config` | 社区配置 | 社区功能配置 |
| `/admin/subscriptions` | 订阅管理 | 用户订阅管理 |
| `/admin/sync` | 数据同步 | 手动触发数据同步 |
| `/admin/sync-queue` | 同步队列 | 同步任务队列 |
| `/admin/scheduler` | 定时任务 | 定时任务管理 |
| `/admin/data-sources` | 数据源 | 外部数据源配置 |
| `/admin/bilibili-uploaders` | UP主管理 | Bilibili UP主管理 |
| `/admin/bilibili-cookies` | Bilibili Cookie | Cookie 管理 |
| `/admin/bilibili-search-keywords` | B站关键词 | 搜索关键词管理 |
| `/admin/paper-search-keywords` | 论文关键词 | 论文搜索关键词 |
| `/admin/cookies` | Cookie 管理 | 浏览器 Cookie |
| `/admin/analytics/bilibili` | B站分析 | Bilibili 数据分析 |
| `/admin/system` | 系统设置 | 系统配置 |
| `/admin/system/health` | 系统健康 | 系统健康状态 |
| `/admin/system/tech-debt` | 技术债务 | 技术债务追踪 |

---

## 3. 路由流程分析

### 3.1 API 路由架构

```
/api/v1/
├── 公开路由 (无需认证)
│   ├── /auth/login              # 用户登录
│   ├── /auth/register          # 用户注册
│   ├── /papers                 # 论文列表
│   ├── /videos                 # 视频列表
│   ├── /repos                  # GitHub 项目
│   ├── /jobs                   # 招聘信息
│   ├── /huggingface            # HuggingFace 模型
│   ├── /news                   # 每日资讯
│   ├── /community              # 社区帖子
│   ├── /comments               # 评论
│   ├── /search                 # 搜索
│   ├── /discovery              # 发现
│   ├── /ranking                # 排行榜
│   ├── /stats                  # 公开统计
│   ├── /announcements          # 公告
│   ├── /home-modules           # 首页模块
│   ├── /banners               # 横幅
│   └── /github-repo-info       # GitHub 仓库信息
│
├── 可选认证路由 (公开，但登录后个性化)
│   ├── /feed                   # 内容订阅源
│   ├── /users/:id              # 用户公开资料
│   └── /posts/:id              # 帖子详情
│
├── 需要认证路由 (必须登录)
│   ├── /user/profile           # 用户资料
│   ├── /favorites              # 收藏夹
│   ├── /subscriptions          # 用户订阅
│   ├── /notifications          # 通知
│   └── /subscriptions/:id/*    # 订阅操作
│
└── 管理端路由 (需要管理员权限)
    ├── /admin/me               # 当前管理员信息
    ├── /admin/users            # 用户管理
    ├── /admin/admins           # 管理员管理
    ├── /admin/posts            # 帖子管理
    ├── /admin/subscriptions    # 订阅管理
    ├── /admin/stats            # 统计数据
    ├── /admin/content/*        # 内容管理
    ├── /admin/sync/*           # 数据同步
    ├── /admin/*                # 其他管理功能
```

### 3.2 认证流程

```
┌─────────────────────────────────────────────────────────────┐
│                      用户登录流程                           │
└─────────────────────────────────────────────────────────────┘

1. 用户提交凭证
   POST /api/v1/auth/login
   Body: { email, password }

2. 后端验证
   - 查询数据库验证凭证
   - 生成 JWT 访问令牌 (7天有效期)
   - 生成 JWT 刷新令牌 (30天有效期)

3. 响应
   {
     token: "access_token",
     refreshToken: "refresh_token",
     user: { id, username, email, role, ... }
   }

4. 前端存储
   localStorage.setItem('user_token', token)
   localStorage.setItem('user_refresh_token', refreshToken)

5. 后续请求
   GET /api/v1/user/profile
   Headers: { Authorization: "Bearer <token>" }

6. 中间件验证
   - 提取并验证 JWT
   - 设置 req.user
```

### 3.3 权限控制模式

| 模式 | 说明 | 示例 |
|------|------|------|
| 公开 | 无需认证 | `/api/papers`, `/api/videos` |
| 可选认证 | 公开，登录后个性化 | `/api/feed`, `/api/users/:id` |
| 需认证 | 必须登录 | `/api/user/profile`, `/api/favorites` |
| 管理员专用 | 需是管理员 | `/api/admin/*` |

---

## 4. 数据库结构

### 4.1 用户数据库 (dev-user.db)

#### users - 用户表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 用户ID |
| user_number | String | Unique | 用户编号 |
| username | String | Unique | 用户名 |
| email | String | Unique | 邮箱 |
| password_hash | String | | 密码哈希 |
| avatar_url | String | Nullable | 头像URL |
| bio | String | Nullable | 个人简介 |
| github_id | String | Unique | GitHub ID |
| level | Int | Default 1 | 用户等级 |
| points | Int | Default 0 | 积分 |
| is_vip | Boolean | Default false | VIP状态 |
| is_active | Boolean | Default true | 账号状态 |
| last_login_at | DateTime | Nullable | 最后登录时间 |
| tags | String | Nullable | 标签 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### subscriptions - 内容订阅表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 订阅ID |
| user_id | String | FK | 用户ID |
| content_type | String | | 内容类型 (papers/videos/repos等) |
| keywords | String | Nullable | 关键词 |
| tags | String | Nullable | 标签 |
| authors | String | Nullable | 作者 |
| uploaders | String | Nullable | 上传者 |
| platform | String | Nullable | 平台 |
| is_public | Boolean | Default false | 是否公开 |
| is_active | Boolean | Default true | 启用状态 |
| notify_enabled | Boolean | Default true | 通知启用 |
| sync_enabled | Boolean | Default true | 同步启用 |
| new_count | Int | Default 0 | 新内容数 |
| total_matched | Int | Default 0 | 匹配总数 |
| last_notified | DateTime | Nullable | 最后通知时间 |
| last_checked | DateTime | Nullable | 最后检查时间 |
| last_sync_at | DateTime | Nullable | 最后同步时间 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### papers - 论文表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 论文ID |
| arxiv_id | String | Unique | arXiv ID |
| title | String | | 标题 |
| authors | String | | 作者 |
| abstract | String | Nullable | 摘要 |
| pdf_url | String | Nullable | PDF链接 |
| published_date | DateTime | Nullable | 发布日期 |
| citation_count | Int | Default 0 | 引用数 |
| venue | String | Nullable | 发表场所 |
| categories | String | Nullable | 分类 |
| view_count | Int | Default 0 | 浏览数 |
| favorite_count | Int | Default 0 | 收藏数 |
| share_count | Int | Default 0 | 分享数 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### videos - 视频表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 视频ID |
| platform | String | | 平台 (bilibili/youtube) |
| video_id | String | | 视频平台ID |
| bvid | String | Unique | Bilibili BV号 |
| title | String | | 标题 |
| description | String | Nullable | 描述 |
| cover_url | String | Nullable | 封面URL |
| duration | Int | Nullable | 时长(秒) |
| uploader | String | Nullable | 上传者 |
| uploader_id | String | Nullable | 上传者ID |
| published_date | DateTime | Nullable | 发布日期 |
| play_count | Int | Default 0 | 播放数 |
| like_count | Int | Default 0 | 点赞数 |
| view_count | Int | Default 0 | 浏览数 |
| favorite_count | Int | Default 0 | 收藏数 |
| tags | String | Nullable | 标签 |
| metadata | String | Nullable | 元数据 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### github_repos - GitHub 仓库表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 仓库ID |
| repo_id | Int | | GitHub 仓库ID |
| name | String | | 仓库名 |
| full_name | String | Unique | 完整名称 |
| owner | String | Nullable | 所有者 |
| description | String | Nullable | 描述 |
| html_url | String | Nullable | HTML链接 |
| language | String | Nullable | 主要语言 |
| stars_count | Int | Default 0 | 星标数 |
| forks_count | Int | Default 0 | Fork数 |
| issues_count | Int | Default 0 | Issue数 |
| topics | String | Nullable | 主题 |
| created_date | DateTime | Nullable | 创建日期 |
| updated_date | DateTime | Nullable | 更新日期 |
| view_count | Int | Default 0 | 浏览数 |
| favorite_count | Int | Default 0 | 收藏数 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |
| category | String | Nullable | 分类 |

#### jobs - 招聘信息表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 职位ID |
| title | String | | 职位名称 |
| company | String | | 公司名称 |
| location | String | Nullable | 工作地点 |
| salary_min | Int | Nullable | 最低薪资 |
| salary_max | Int | Nullable | 最高薪资 |
| description | String | Nullable | 职位描述 |
| requirements | String | Nullable | 任职要求 |
| status | String | Default "open" | 状态 |
| view_count | Int | Default 0 | 浏览数 |
| favorite_count | Int | Default 0 | 收藏数 |
| tags | String | Nullable | 标签 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### huggingface_models - HuggingFace 模型表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 模型ID |
| full_name | String | Unique | 完整名称 |
| description | String | Nullable | 描述 |
| task | String | Nullable | 任务类型 |
| downloads | Int | Default 0 | 下载数 |
| likes | Int | Default 0 | 喜欢数 |
| last_modified | DateTime | Nullable | 最后修改 |
| view_count | Int | Default 0 | 浏览数 |
| favorite_count | Int | Default 0 | 收藏数 |
| share_count | Int | Default 0 | 分享数 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### posts - 社区帖子表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 帖子ID |
| user_id | String | FK | 作者ID |
| content_type | String | | 内容类型 |
| content_id | String | | 内容ID |
| title | String | Nullable | 标题 |
| content | String | | 内容 |
| view_count | Int | Default 0 | 浏览数 |
| like_count | Int | Default 0 | 点赞数 |
| comment_count | Int | Default 0 | 评论数 |
| status | String | Default "active" | 状态 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### comments - 评论表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 评论ID |
| user_id | String | FK | 用户ID |
| post_id | String | FK | 帖子ID |
| parent_id | String | Nullable | 父评论ID |
| content | String | | 内容 |
| like_count | Int | Default 0 | 点赞数 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### favorites - 收藏表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 收藏ID |
| user_id | String | FK | 用户ID |
| content_type | String | | 内容类型 |
| content_id | String | | 内容ID |
| folder_id | String | Nullable | 文件夹ID |
| created_at | DateTime | | 创建时间 |

#### notifications - 通知表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 通知ID |
| user_id | String | FK | 用户ID |
| type | String | | 通知类型 |
| title | String | | 标题 |
| content | String | | 内容 |
| link_url | String | Nullable | 链接URL |
| is_read | Boolean | Default false | 已读状态 |
| created_at | DateTime | | 创建时间 |

### 4.2 管理员数据库 (dev-admin.db)

#### admins - 管理员表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 管理员ID |
| username | String | Unique | 用户名 |
| email | String | Unique | 邮箱 |
| password_hash | String | | 密码哈希 |
| avatar_url | String | Nullable | 头像URL |
| role | String | Default "admin" | 角色 |
| is_active | Boolean | Default true | 账号状态 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |
| last_login_at | DateTime | Nullable | 最后登录时间 |
| tags | String | Nullable | 标签 |
| admin_number | String | Unique | 管理员编号 |

#### admin_permissions - 管理员权限表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 权限ID |
| admin_id | String | FK | 管理员ID |
| module | String | | 模块名称 |
| can_view | Boolean | Default false | 查看权限 |
| can_create | Boolean | Default false | 创建权限 |
| can_update | Boolean | Default false | 更新权限 |
| can_delete | Boolean | Default false | 删除权限 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### banners - 横幅表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 横幅ID |
| title | String | | 标题 |
| description | String | Nullable | 描述 |
| image_url | String | | 图片URL |
| link_url | String | Nullable | 链接URL |
| order | Int | Default 0 | 排序 |
| is_active | Boolean | Default true | 启用状态 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### announcements - 公告表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 公告ID |
| title | String | | 标题 |
| content | String | | 内容 |
| type | String | Default "info" | 类型 |
| link_url | String | Nullable | 链接URL |
| is_active | Boolean | Default true | 启用状态 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### home_modules - 首页模块表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 模块ID |
| name | String | Unique | 模块名称 |
| title | String | | 显示标题 |
| description | String | Nullable | 描述 |
| config | String | Nullable | 配置JSON |
| is_active | Boolean | Default true | 启用状态 |
| order | Int | Default 0 | 排序 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### data_sources - 数据源配置表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 数据源ID |
| name | String | Unique | 数据源名称 |
| display_name | String | | 显示名称 |
| enabled | Boolean | Default true | 启用状态 |
| tags | String | Nullable | 标签 |
| api_base_url | String | | API基础URL |
| config | String | | 配置JSON |
| health_status | String | Default "unknown" | 健康状态 |
| last_health_check | DateTime | Nullable | 最后健康检查 |
| last_sync_status | String | Nullable | 最后同步状态 |
| last_sync_result | String | Nullable | 最后同步结果 |
| last_sync_at | DateTime | Nullable | 最后同步时间 |
| created_at | DateTime | | 创建时间 |
| updated_at | DateTime | | 更新时间 |

#### admin_audit_logs - 管理员操作日志表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | 日志ID |
| admin_id | String | | 管理员ID |
| action | String | | 操作类型 |
| target | String | Nullable | 操作目标 |
| details | String | Nullable | 详情JSON |
| ip | String | Nullable | IP地址 |
| created_at | DateTime | | 创建时间 |

---

## 5. 模块详解

### 5.1 认证与授权模块

**功能**：处理用户/管理员登录、令牌管理、访问控制

**核心组件**：
- `auth.routes.ts` - 登录/注册端点
- `auth.controller.ts` - 认证逻辑
- `auth.middleware.ts` - 令牌验证
- `jwt.ts` - 令牌生成/验证

**流程**：
1. 用户提交凭证 → `/api/auth/login`
2. 后端验证 → 生成 JWT 令牌
3. 前端存储令牌 → `localStorage`
4. 后续请求包含 `Authorization: Bearer <token>`
5. 中间件验证令牌 → 设置 `req.user`
6. 受保护路由访问授权

### 5.2 内容管理模块

**功能**：管理论文、视频、新闻、HuggingFace模型、GitHub仓库、职位

**核心组件**：
- `paper.routes.ts` - 论文 CRUD
- `video.routes.ts` - 视频 CRUD
- `job.routes.ts` - 职位管理
- `huggingface.routes.ts` - HuggingFace 模型

### 5.3 订阅系统模块

**功能**：允许用户订阅内容并接收通知

**核心组件**：
- `subscription.routes.ts` - 用户订阅
- `notification.routes.ts` - 通知

**流程**：
1. 用户创建订阅 → `/api/subscriptions`
2. 系统定期检查更新 → 定时任务
3. 新内容匹配 → 创建通知 → 用户查看

### 5.4 数据同步模块

**功能**：从外部来源获取数据并保持数据库更新

**数据来源**：
- arXiv (论文)
- GitHub (仓库)
- HuggingFace (模型)
- Bilibili (视频)
- YouTube (视频)
- 36kr (新闻)
- Semantic Scholar (论文)

---

## 6. 关键文件参考

### 后端核心
| 文件 | 说明 |
|------|------|
| `backend/src/app.ts` | Express 应用设置 |
| `backend/src/server.ts` | 服务器启动 |
| `backend/src/routes/index.ts` | 路由注册 |
| `backend/src/middleware/auth.middleware.ts` | 认证中间件 |

### 前端核心
| 文件 | 说明 |
|------|------|
| `frontend/src/app/page.tsx` | 首页 |
| `frontend/src/lib/api/client.ts` | API 客户端 |
| `frontend/src/store/authStore.ts` | 认证状态管理 |

### 配置
| 文件 | 说明 |
|------|------|
| `backend/prisma/schema.user.prisma` | 用户数据库 Schema |
| `backend/prisma/schema.admin.prisma` | 管理员数据库 Schema |

---

*文档最后更新：2026-02-27*
