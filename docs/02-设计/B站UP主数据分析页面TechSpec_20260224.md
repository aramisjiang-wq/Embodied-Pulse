# B站UP主数据分析页面 技术规格文档

**文档版本**: v1.0
**创建日期**: 2026-02-24
**最后更新**: 2026-02-24
**维护人**: AI助手团队

---

## 1. 技术栈选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 前端框架 | Next.js + React | 14.x / 18.x | 项目已有，支持SSR和路由 |
| 前端语言 | TypeScript | 5.x | 项目已有，类型安全 |
| UI组件库 | Ant Design | 5.x | 项目已有，组件丰富 |
| 图表库 | Recharts | 3.x | 项目已有，适合数据分析 |
| 状态管理 | Zustand | 5.x | 项目已有，轻量级 |
| 后端框架 | Express | 4.x | 项目已有，成熟稳定 |
| 后端语言 | TypeScript | 5.x | 项目已有，类型安全 |
| ORM | Prisma | 5.x | 项目已有，类型安全 |
| 数据库 | SQLite | 3.x | 项目已有，轻量级 |

---

## 2. 系统架构

### 2.1 系统上下文图（C4 Level 1）

```
+--------------------------------------------------------------------------------+
|                              系统上下文图                                       |
+--------------------------------------------------------------------------------+
|                                                                                |
|    +-------------+                    +------------------+                     |
|    |             |                    |                  |                     |
|    |  VIP用户    +------------------> |                  |                     |
|    |             |    访问数据分析    |   Embodied       |                     |
|    +-------------+                    |   Pulse 系统     |                     |
|                                       |                  |                     |
|    +-------------+                    |                  |                     |
|    |             |                    +--------+---------+                     |
|    |  非VIP用户  +------------------> |        |                                |
|    |             |    被拒绝访问      |        v                                |
|    +-------------+                    |  +-------------+                       |
|                                       |  |             |                       |
|    +-------------+                    |  |  B站API     |                       |
|    |             |                    |  |  (外部依赖) |                       |
|    |  管理员     +------------------> |  |             |                       |
|    |             |    配置VIP权限     |  +-------------+                       |
|    +-------------+                    |                                        |
|                                       +----------------------------------------+
|                                                                                |
+--------------------------------------------------------------------------------+
```

### 2.2 容器图（C4 Level 2）

```
+--------------------------------------------------------------------------------+
|                                  容器图                                        |
+--------------------------------------------------------------------------------+
|                                                                                |
|    +-------------+                                                              |
|    |             |                                                              |
|    |  用户       |                                                              |
|    |  (浏览器)   |                                                              |
|    |             |                                                              |
|    +------+------+                                                              |
|           |                                                                     |
|           | HTTPS                                                               |
|           v                                                                     |
|    +------+------+          +-------------+          +-------------+            |
|    |             |   REST   |             |  Prisma  |             |            |
|    |  Frontend   +--------->|  Backend    +--------->|  SQLite     |            |
|    |  (Next.js)  |   API    |  (Express)  |   ORM    |  Database   |            |
|    |             |          |             |          |             |            |
|    +-------------+          +------+------+          +-------------+            |
|                                   |                                           |
|                                   | HTTP                                      |
|                                   v                                           |
|                            +-------------+                                    |
|                            |             |                                    |
|                            |  B站API     |                                    |
|                            |  (外部)     |                                    |
|                            |             |                                    |
|                            +-------------+                                    |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### 2.3 组件图（C4 Level 3）

```
+--------------------------------------------------------------------------------+
|                              前端组件图                                        |
+--------------------------------------------------------------------------------+
|                                                                                |
|  Frontend (Next.js)                                                            |
|  +----------------------------------------------------------------------------+|
|  |                                                                            ||
|  |  +------------------+    +------------------+    +------------------+      ||
|  |  |                  |    |                  |    |                  |      ||
|  |  |  Analytics Page  +--->|  Analytics API   +--->|  Auth Provider   |      ||
|  |  |  (数据分析页)    |    |  (API调用)       |    |  (权限检查)      |      ||
|  |  |                  |    |                  |    |                  |      ||
|  |  +--------+---------+    +--------+---------+    +--------+---------+      ||
|  |           |                       |                       |               ||
|  |           v                       v                       v               ||
|  |  +--------+---------+    +--------+---------+    +--------+---------+      ||
|  |  |                  |    |                  |    |                  |      ||
|  |  |  Filter Section  |    |  Charts Section  |    |  VIP Guard       |      ||
|  |  |  (筛选区)        |    |  (图表区)        |    |  (路由守卫)      |      ||
|  |  |                  |    |                  |    |                  |      ||
|  |  +------------------+    +------------------+    +------------------+      ||
|  |                                                                            ||
|  +----------------------------------------------------------------------------+|
|                                                                                |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
|                              后端组件图                                        |
+--------------------------------------------------------------------------------+
|                                                                                |
|  Backend (Express)                                                             |
|  +----------------------------------------------------------------------------+|
|  |                                                                            ||
|  |  +------------------+    +------------------+    +------------------+      ||
|  |  |                  |    |                  |    |                  |      ||
|  |  |  Analytics       +--->|  Analytics       +--->|  Video Service   |      ||
|  |  |  Routes          |    |  Controller      |    |  (数据查询)      |      ||
|  |  |                  |    |                  |    |                  |      ||
|  |  +--------+---------+    +--------+---------+    +------------------+      ||
|  |           |                       |                                       ||
|  |           v                       v                                       ||
|  |  +--------+---------+    +--------+---------+                            ||
|  |  |                  |    |                  |                            ||
|  |  |  VIP Middleware  |    |  Prisma Client   |                            ||
|  |  |  (权限验证)      |    |  (数据库访问)    |                            ||
|  |  |                  |    |                  |                            ||
|  |  +------------------+    +------------------+                            ||
|  |                                                                            ||
|  +----------------------------------------------------------------------------+|
|                                                                                |
+--------------------------------------------------------------------------------+
```

### 2.4 数据流图

```
+--------------------------------------------------------------------------------+
|                                数据流图                                        |
+--------------------------------------------------------------------------------+
|                                                                                |
|  +----------+     +----------+     +----------+     +----------+              |
|  |          |     |          |     |          |     |          |              |
|  |  用户    +---->|  前端    +---->|  后端    +---->|  数据库  |              |
|  |          |     |  页面    |     |  API     |     |  SQLite |              |
|  |          |     |          |     |          |     |          |              |
|  +----------+     +----+-----+     +----+-----+     +----------+              |
|                        |                |                                     |
|                        |                |                                     |
|                        v                v                                     |
|                   +----------+     +----------+                               |
|                   |          |     |          |                               |
|                   |  VIP权限 |     |  缓存    |                               |
|                   |  检查    |     |  Redis   |                               |
|                   |          |     |          |                               |
|                   +----------+     +----------+                               |
|                                                                                |
|  数据流向:                                                                     |
|  1. 用户访问数据分析页 -> 前端路由守卫检查VIP权限                              |
|  2. 前端调用API -> 后端中间件验证权限                                          |
|  3. 后端查询数据库 -> 返回数据给前端                                           |
|  4. 前端渲染图表 -> 用户查看分析结果                                           |
|                                                                                |
+--------------------------------------------------------------------------------+
```

---

## 3. 数据模型

### 3.1 现有数据模型（无需修改）

```
+------------------------------------------+
|              BilibiliUploader             |
+------------------------------------------+
| id: String (PK)                          |
| mid: String (Unique)                     |
| name: String                             |
| avatar: String?                          |
| description: String?                     |
| tags: String? (JSON)                     |
| isActive: Boolean                        |
| lastSyncAt: DateTime?                    |
| videoCount: Int                          |
| createdAt: DateTime                      |
| updatedAt: DateTime                      |
+------------------------------------------+

+------------------------------------------+
|                 Video                     |
+------------------------------------------+
| id: String (PK)                          |
| platform: String                         |
| videoId: String                          |
| bvid: String? (Unique)                   |
| title: String                            |
| description: String?                     |
| coverUrl: String?                        |
| duration: Int?                           |
| uploader: String?                        |
| uploaderId: String?                      |
| publishedDate: DateTime?                 |
| playCount: Int                           |
| likeCount: Int                           |
| viewCount: Int                           |
| favoriteCount: Int                       |
| tags: String?                            |
| metadata: String?                        |
| isPinned: Boolean                        |
| pinnedAt: DateTime?                      |
| createdAt: DateTime                      |
| updatedAt: DateTime                      |
+------------------------------------------+

+------------------------------------------+
|                  User                     |
+------------------------------------------+
| id: String (PK)                          |
| isVip: Boolean                           |
| tags: String? (JSON, 包含vipPermissions) |
| ...其他字段                              |
+------------------------------------------+
```

### 3.2 VIP权限数据结构

用户表中的 `tags` 字段存储VIP权限配置：

```json
{
  "tags": ["标签1", "标签2"],
  "vipPermissions": ["bilibili-analytics", "premium-content"]
}
```

---

## 4. API 设计

### 4.1 认证方式

- **类型**: JWT Bearer Token
- **有效期**: 7 天
- **Header**: `Authorization: Bearer <token>`

### 4.2 API 清单

| 方法 | 路径 | 模块 | 描述 | VIP权限 |
|------|------|------|------|---------|
| GET | /api/analytics/bilibili/uploaders | analytics | 获取UP主列表 | bilibili-analytics |
| GET | /api/analytics/bilibili/overview | analytics | 获取概览统计 | bilibili-analytics |
| GET | /api/analytics/bilibili/publish-trend | analytics | 获取发布趋势 | bilibili-analytics |
| GET | /api/analytics/bilibili/play-heatmap | analytics | 获取播放热力图 | bilibili-analytics |
| GET | /api/analytics/bilibili/rankings | analytics | 获取排行榜 | bilibili-analytics |
| GET | /api/analytics/bilibili/uploader-detail | analytics | 获取UP主详情 | bilibili-analytics |
| PUT | /api/admin/users/:userId/vip | admin | 更新用户VIP状态 | admin |
| GET | /api/user/profile | user | 获取当前用户信息（含VIP权限） | - |

### 4.3 VIP权限中间件

```typescript
// backend/src/middleware/vip-permission.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function checkVipPermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return sendError(res, 1002, '未登录', 401);
      }
      
      if (!user.isVip) {
        return sendError(res, 1003, '需要VIP权限', 403);
      }
      
      const vipPermissions = user.vipPermissions || [];
      if (!vipPermissions.includes(permission)) {
        return sendError(res, 1003, '无权访问此功能', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

### 4.4 请求/响应格式

**成功响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "timestamp": 1234567890
}
```

**错误响应：**
```json
{
  "code": 1003,
  "message": "需要VIP权限",
  "data": null,
  "timestamp": 1234567890
}
```

---

## 5. 项目结构

### 5.1 前端新增文件

```
frontend/src/
├── app/
│   └── analytics/                    # 新增：数据分析模块
│       └── bilibili/                 # B站UP主分析
│           ├── page.tsx              # 主页面
│           ├── page.module.css       # 样式文件
│           └── components/           # 页面组件
│               ├── FilterSection.tsx        # 筛选区
│               ├── OverviewCards.tsx        # 概览卡片
│               ├── PublishTrendChart.tsx    # 发布趋势图
│               ├── PlayHeatmap.tsx          # 播放热力图
│               ├── UploaderRanking.tsx      # UP主排行榜
│               ├── UploaderDetailPanel.tsx  # UP主详情面板
│               └── VipUpgradePrompt.tsx     # VIP升级提示
├── components/
│   └── VipGuard.tsx                  # 新增：VIP路由守卫组件
├── hooks/
│   └── useVipPermission.ts           # 新增：VIP权限检查Hook
└── lib/
    └── api/
        └── analytics.ts              # 已有：API调用（需确认类型）
```

### 5.2 后端新增/修改文件

```
backend/src/
├── middleware/
│   └── vip-permission.middleware.ts  # 新增：VIP权限中间件
├── routes/
│   └── analytics.routes.ts           # 修改：添加VIP权限检查
├── controllers/
│   └── analytics.controller.ts       # 已有：控制器（无需修改）
└── services/
    └── admin.service.ts              # 已有：VIP配置服务（无需修改）
```

---

## 6. 依赖清单

### 6.1 前端依赖（已有）

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "next": "^14.2.35",
    "antd": "^5.12.0",
    "recharts": "^3.7.0",
    "zustand": "^5.0.11",
    "@tanstack/react-query": "^5.28.0",
    "dayjs": "^1.11.10",
    "axios": "^1.6.7"
  }
}
```

### 6.2 后端依赖（已有）

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.9.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

---

## 7. 环境配置

### 7.1 必需环境变量（已有）

| 变量名 | 描述 | 示例 |
|--------|------|------|
| DATABASE_URL | 用户数据库连接 | file:./dev-user.db |
| JWT_SECRET | JWT密钥 | your-secret-key |

### 7.2 VIP权限标识

| 标识 | 描述 |
|------|------|
| bilibili-analytics | B站UP主数据分析页面访问权限 |

---

## 8. 代码规范

### 8.1 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | getUploaderDetail |
| 组件 | PascalCase | UploaderRanking |
| 常量 | UPPER_SNAKE | VIP_PERMISSION_KEY |
| 文件（组件） | PascalCase.tsx | UploaderRanking.tsx |
| 文件（其他） | kebab-case | vip-permission.middleware.ts |
| CSS模块 | page.module.css | analytics/page.module.css |

### 8.2 格式化规则

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

### 8.3 颜色规范

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色 | #1890ff | 品牌蓝色 |
| 辅助色 | #52c41a | 成功/增长 |
| 错误色 | #ff4d4f | 错误/下降 |
| **禁止** | 紫色 | Banner/按钮背景禁止使用 |

---

## 9. 技术约束

### 9.1 安全要求

- VIP权限检查：前端路由守卫 + 后端API中间件双重验证
- JWT Token验证：所有API请求需携带有效Token
- 敏感数据保护：非VIP用户无法获取分析数据

### 9.2 性能要求

- 页面首次加载时间 < 3秒
- API响应时间 < 2秒
- 图表渲染时间 < 1秒
- 使用React Query缓存API响应

### 9.3 兼容性要求

- 浏览器：Chrome/Firefox/Safari 最新版本
- 屏幕宽度：>= 1280px（桌面端）

---

## 10. 实现任务清单

### 10.1 后端任务

| 优先级 | 任务 | 文件 |
|--------|------|------|
| P0 | 创建VIP权限中间件 | src/middleware/vip-permission.middleware.ts |
| P0 | 修改analytics路由添加权限检查 | src/routes/analytics.routes.ts |
| P0 | 确保用户信息返回vipPermissions | src/controllers/auth.controller.ts |

### 10.2 前端任务

| 优先级 | 任务 | 文件 |
|--------|------|------|
| P0 | 创建VIP路由守卫组件 | src/components/VipGuard.tsx |
| P0 | 创建VIP权限Hook | src/hooks/useVipPermission.ts |
| P0 | 创建数据分析页面 | src/app/analytics/bilibili/page.tsx |
| P0 | 创建筛选区组件 | src/app/analytics/bilibili/components/FilterSection.tsx |
| P0 | 创建概览卡片组件 | src/app/analytics/bilibili/components/OverviewCards.tsx |
| P0 | 创建发布趋势图组件 | src/app/analytics/bilibili/components/PublishTrendChart.tsx |
| P0 | 创建播放热力图组件 | src/app/analytics/bilibili/components/PlayHeatmap.tsx |
| P0 | 创建排行榜组件 | src/app/analytics/bilibili/components/UploaderRanking.tsx |
| P1 | 创建详情面板组件 | src/app/analytics/bilibili/components/UploaderDetailPanel.tsx |
| P1 | 创建VIP升级提示组件 | src/app/analytics/bilibili/components/VipUpgradePrompt.tsx |

### 10.3 管理端任务

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | 确认VIP配置功能 | 已有，在用户管理页面 |

---

## META（供其他 Skill 解析）

```yaml
project:
  name: B站UP主数据分析页面
  version: "1.0"

tech_stack:
  frontend:
    framework: Next.js
    language: TypeScript
    ui: Ant Design
    charts: Recharts
    state: Zustand
    data_fetching: React Query
  backend:
    runtime: Node.js
    framework: Express
    language: TypeScript
    orm: Prisma
  database:
    type: SQLite

architecture:
  pattern: MVC
  api_style: RESTful
  auth_method: JWT
  layers:
    - route
    - controller
    - service
    - middleware

modules:
  - name: vip-permission
    type: backend
    priority: P0
    dependencies: []
    files:
      - src/middleware/vip-permission.middleware.ts
    description: VIP权限验证中间件

  - name: analytics-page
    type: frontend
    priority: P0
    dependencies: [vip-permission]
    files:
      - src/app/analytics/bilibili/page.tsx
      - src/app/analytics/bilibili/page.module.css
      - src/app/analytics/bilibili/components/FilterSection.tsx
      - src/app/analytics/bilibili/components/OverviewCards.tsx
      - src/app/analytics/bilibili/components/PublishTrendChart.tsx
      - src/app/analytics/bilibili/components/PlayHeatmap.tsx
      - src/app/analytics/bilibili/components/UploaderRanking.tsx
    description: 数据分析主页面

  - name: vip-guard
    type: frontend
    priority: P0
    dependencies: []
    files:
      - src/components/VipGuard.tsx
      - src/hooks/useVipPermission.ts
    description: VIP路由守卫

  - name: uploader-detail
    type: frontend
    priority: P1
    dependencies: [analytics-page]
    files:
      - src/app/analytics/bilibili/components/UploaderDetailPanel.tsx
    description: UP主详情面板

endpoints:
  - method: GET
    path: /api/analytics/bilibili/uploaders
    vip_permission: bilibili-analytics
  - method: GET
    path: /api/analytics/bilibili/overview
    vip_permission: bilibili-analytics
  - method: GET
    path: /api/analytics/bilibili/publish-trend
    vip_permission: bilibili-analytics
  - method: GET
    path: /api/analytics/bilibili/play-heatmap
    vip_permission: bilibili-analytics
  - method: GET
    path: /api/analytics/bilibili/rankings
    vip_permission: bilibili-analytics
  - method: GET
    path: /api/analytics/bilibili/uploader-detail
    vip_permission: bilibili-analytics

vip_permissions:
  - id: bilibili-analytics
    name: B站UP主数据分析
    description: 访问B站UP主数据分析页面

environment:
  node_version: ">=20.0.0"
  required_env_vars:
    - name: DATABASE_URL
      description: SQLite数据库文件路径
    - name: JWT_SECRET
      description: JWT签名密钥

code_style:
  naming:
    variables: camelCase
    functions: camelCase
    components: PascalCase
    constants: UPPER_SNAKE
    files_component: PascalCase
    files_other: kebab-case
  formatting:
    indent: 2
    quotes: single
    semicolons: true
    max_line_length: 100
  color_rules:
    forbidden_background_colors:
      - purple
      - "#667eea"
      - "#764ba2"
      - "#722ed1"
```
