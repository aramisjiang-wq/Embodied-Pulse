# Embodied Pulse 项目笔记

> **当前版本：** v2.1
> **最后更新：** 2026-02-22

---

## 📋 版本更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v2.1 | 2026-02-22 | 修复强制登录/登录后闪退问题：添加 authStore.initialize() 方法；修复 onRehydrateStorage 直接 mutation 不触发 React 重渲染的问题 |
| v2.0 | 2026-02-15 | 重构文档结构，按用户使用场景分类（快速入门/服务器运维/开发参考/需求管理） |
| v1.3 | 2026-02-15 | 新增目录导航，便于快速跳转 |
| v1.2 | 2026-02-15 | 新增"需求记录"章节，包含外部数据源和需求清单（12月/1月） |
| v1.1 | 2026-02-15 | 新增服务器信息、服务器运维命令、SSH密钥；调整章节编号 |
| v1.0 | 2026-02-15 | 初始版本，包含项目基本信息、本地启动命令、API密钥、核心页面、走查提示词等 |

---

## 📑 目录

### 一、快速入门
- [1.1 项目基本信息](#11-项目基本信息)
- [1.2 本地启动命令](#12-本地启动命令)
- [1.3 项目依赖](#13-项目依赖)

### 二、服务器运维
- [2.1 服务器登录信息](#21-服务器登录信息)
- [2.2 服务器运维命令](#22-服务器运维命令)
- [2.3 定时任务](#23-定时任务)

### 三、开发参考
- [3.1 核心页面清单](#31-核心页面清单)
- [3.2 API密钥与授权](#32-api密钥与授权)
- [3.3 日常开发命令](#33-日常开发命令)

### 四、Bug修复记录
- [4.1 2026-02-22 强制登录/登录后闪退问题](#41-2026-02-22-强制登录登录后闪退问题)

## 4.1 2026-02-22 强制登录/登录后闪退问题

**问题描述：** 用户登录后刷新页面，或在私有页面（收藏、订阅）刷新时，出现闪退或内容无法加载的问题。

**影响范围：**
- 收藏页面、订阅页面等私有页面刷新后内容不显示
- 登录后刷新页面已登录状态无法正确恢复
- 管理端调用 initialize() 抛出 TypeError

**Bug 1：initialize 方法不存在**

- **原因：** `AuthProvider.tsx` 和 `admin/layout.tsx` 都调用了 `initialize()`，但该方法从未在 `authStore` 中定义，导致 `TypeError: initialize is not a function`
- **修复：** 在 `authStore` 中添加 `initialize()` 方法，它会从 `localStorage` 手动读取 token 和用户信息，并将 `hydrated` 设为 `true`

**Bug 2：onRehydrateStorage 直接 mutation 不触发 React 重渲染**

- **原因：** 旧代码直接修改对象属性，Zustand 不知道状态变了

```typescript
// 旧代码（有 Bug）
state.hydrated = true;  // 直接修改对象属性，Zustand 不知道状态变了！
```

- **修复：** 通过 `set()` 触发订阅者通知和 React 重渲染

```typescript
// 新代码（正确）
state.setHydrated(true);  // 通过 set() 触发订阅者通知和 React 重渲染
```

**这两个 Bug 共同造成的结果：**
- `hydrated` 永久为 false（React 组件视角）
- 私有页面（收藏、订阅）中 `if (!hydrated) return` 永久阻断，内容永远加载不出来
- 登录后刷新页面时，已登录状态无法被正确恢复，导致闪退或内容不显示
- 管理端 `initialize()` 调用抛出 TypeError，干扰认证检查流程

**相关文件：**
- `frontend/src/store/authStore.ts`
- `frontend/src/components/AuthProvider.tsx`
- `frontend/src/app/admin/layout.tsx`

**GitHub Token：** 已配置，详见 `.env` 文件

### 五、需求管理
- [4.1 外部数据源](#41-外部数据源)
- [4.2 需求清单](#42-需求清单)
- [4.3 开发走查提示词](#43-开发走查提示词)

### 六、附录
- [5.1 每日文档更新要求](#51-每日文档更新要求)

---

# 一、快速入门

## 1.1 项目基本信息

| 项目 | 信息 |
|------|------|
| 项目名称 | Embodied Pulse |
| GitHub 地址 | https://github.com/aramisjiang-wq/Embodied.git |
| 前端端口 | 3000 |
| 后端端口 | 3001 |

---

## 1.2 本地启动命令

### 一键启动前后端

```bash
cd /Users/dong/Documents/Product/Embodied
./scripts/start-dev.sh
```

### 手动启动（非Docker）

**1. 检查并安装依赖服务：**
```bash
brew install postgresql@15 redis
```

**2. 启动服务：**
```bash
brew services start postgresql@15
brew services start redis
```

**3. 创建数据库：**
```bash
createdb embodiedpulse 2>/dev/null || echo "数据库可能已存在"
```

**4. 启动后端（新终端）：**
```bash
cd /Users/dong/Documents/Product/Embodied/backend
PORT=3001 NODE_ENV=development \
DATABASE_URL="postgresql://$(whoami)@localhost:5432/embodiedpulse" \
JWT_SECRET="dev_secret_key_for_embodied_pulse_2026" \
REDIS_URL="redis://localhost:6379" \
npm run dev
```

**5. 启动前端（另一个新终端）：**
```bash
cd /Users/dong/Documents/Product/Embodied/frontend
NEXT_PUBLIC_API_URL="http://localhost:3001" npm run dev
```

---

## 1.3 项目依赖

### 必需服务

| 服务 | 版本 | 用途 |
|------|------|------|
| PostgreSQL | 15 | 主数据库（必需） |
| Redis | 7 | 缓存和任务队列（必需） |

### 可选服务

| 服务 | 版本 | 用途 |
|------|------|------|
| Elasticsearch | 8 | 搜索功能（可选，当前使用数据库查询） |

---

# 二、服务器运维

## 2.1 服务器登录信息

| 项目 | 信息 |
|------|------|
| 服务器IP | 101.200.222.139 |
| 用户名 | root |
| 密码 | XLj4kUnh |

**SSH登录命令：**
```bash
ssh root@101.200.222.139
```

**拉取最新代码：**
```bash
cd /srv/EmbodiedPulse2026
git pull origin main
```

---

## 2.2 服务器运维命令

### 具身视频命令

**运行诊断脚本（查看视频状态）：**
```bash
source venv/bin/activate
python3 scripts/check_video_update_status.py
```

**对比数据库和API的播放量：**
```bash
bash scripts/check_bilibili_play_counts.sh
```

**强制更新所有视频的播放量：**
```bash
bash scripts/update_all_play_counts.sh

# 或者使用Python脚本
python3 scripts/update_video_play_counts.py --force
```

**手动运行B站数据抓取脚本（完整抓取）：**
```bash
cd /srv/EmbodiedPulse2026
python fetch_bilibili_data.py
```

**更新视频播放量（稳妥方式）：**
```bash
python3 scripts/update_video_play_counts.py
```

### 处理服务器失效

**问题：** 网页无法登录，报错500

**解决方案：**
```bash
ssh root@101.200.222.139
cd /srv/EmbodiedPulse2026

# 杀死所有Gunicorn进程
pkill -f gunicorn
sleep 3

# 确认没有Gunicorn进程残留
ps aux | grep gunicorn | grep -v grep

# 设置环境变量（确保使用5001端口）
export PORT=5001

# 启动Gunicorn（使用配置文件）
cd /srv/EmbodiedPulse2026
source venv/bin/activate
nohup gunicorn -c gunicorn_config.py app:app > /tmp/gunicorn_start.log 2>&1 &

# 查看启动日志
tail -20 /tmp/gunicorn_start.log

# 等待几秒让Gunicorn启动
sleep 5

# 检查进程和端口
ps aux | grep gunicorn | grep -v grep
ss -tlnp | grep python
```

---

## 2.3 定时任务

后端已启动定时任务调度器，自动执行以下任务：

| 任务 | 执行频率 |
|------|----------|
| 全量数据同步 | 每天凌晨2点 |
| arXiv论文同步 | 每6小时 |
| GitHub项目同步 | 每8小时 |
| 视频内容同步（Bilibili + YouTube） | 每12小时 |
| HuggingFace模型同步 | 每12小时 |

---

# 三、开发参考

## 3.1 核心页面清单

### 用户端页面

| 页面 | 地址 | 说明 |
|------|------|------|
| 首页 | http://localhost:3000/ | 信息流展示 |
| 论文 | http://localhost:3000/papers | 论文列表 |
| 论文详情 | http://localhost:3000/papers/[id] | 论文详情 |
| 视频 | http://localhost:3000/videos | 视频列表 |
| 视频详情 | http://localhost:3000/videos/[id] | 视频详情 |
| 代码仓库 | http://localhost:3000/repos | GitHub仓库列表 |
| 仓库详情 | http://localhost:3000/repos/[id] | 仓库详情 |
| HuggingFace | http://localhost:3000/huggingface | 模型列表 |
| 模型详情 | http://localhost:3000/huggingface/[id] | 模型详情 |
| 职位 | http://localhost:3000/jobs | 招聘职位列表 |
| 职位详情 | http://localhost:3000/jobs/[id] | 职位详情 |
| 社区 | http://localhost:3000/community | 帖子列表 |
| 帖子详情 | http://localhost:3000/community/[id] | 帖子详情 |
| 搜索 | http://localhost:3000/search | 全局搜索 |
| 排行榜 | http://localhost:3000/ranking | 热门排行 |
| 收藏夹 | http://localhost:3000/favorites | 收藏管理 |
| 订阅 | http://localhost:3000/subscriptions | 订阅管理 |
| 订阅详情 | http://localhost:3000/subscriptions/[id] | 订阅详情 |
| 个人中心 | http://localhost:3000/profile | 用户资料 |
| 设置 | http://localhost:3000/settings | 账号设置 |
| 登录 | http://localhost:3000/login | 用户登录 |
| 注册 | http://localhost:3000/register | 用户注册 |

### 管理端页面

| 页面 | 地址 |
|------|------|
| 管理后台 | http://localhost:3000/admin |
| 内容管理 | http://localhost:3000/admin/content |
| 用户管理 | http://localhost:3000/admin/users |
| 管理员管理 | http://localhost:3000/admin/admins |
| 社区管理 | http://localhost:3000/admin/community |
| 数据同步 | http://localhost:3000/admin/sync |
| 首页模块 | http://localhost:3000/admin/home-modules |
| Banner管理 | http://localhost:3000/admin/banners |
| 数据统计 | http://localhost:3000/admin/stats |

### 页面统计

| 类型 | 数量 |
|------|------|
| 用户端页面 | 26 |
| 管理端页面 | 31 |
| **总计** | **57** |

---

## 3.2 API密钥与授权

| 服务 | 用途 | 密钥/Token |
|------|------|------------|
| QQ邮箱 | 邮箱授权码 | 已配置，详见 `.env` 文件 |
| Google API | - | 已配置 |
| GitHub Token | 抓取数据 | 已配置，详见 `.env` 文件 |

**GitHub Token 管理地址：** https://github.com/settings/tokens/

### SSH密钥

```
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
```

---

## 3.3 日常开发命令

### 同步新闻

```bash
cd /Users/dong/Documents/Product/Embodied/backend
npx tsx src/scripts/sync-news.ts
```

---

# 四、需求管理

## 4.1 外部数据源

| 来源 | 类型 | 地址 |
|------|------|------|
| Allen AI | 论文 | https://allenai.org/papers |
| NVIDIA Research | 论文 | https://research.nvidia.com/publications |
| Physical Intelligence | 论文/博客 | https://www.physicalintelligence.company/ |
| HuggingFace Papers | 论文 | https://huggingface.co/papers/month/2025-12 |

---

## 4.2 需求清单

### 2025年12月

| 日期 | 提出人 | 模块 | 需求描述 | 状态 |
|------|--------|------|----------|------|
| 12-19 | YC | 具身视频 | 新增 teslaai、星尘智能 | 待开发 |
| 12-19 | Sober | 具身论文 | 融入 Allen AI、NVIDIA、Physical Intelligence 等前沿论文源 | 待评估 |
| 12-22 | Issac | 具身论文 | 接入 HuggingFace Papers，论文放最上面比较直观 | 待开发 |
| 12-22 | Sober | 论文阅读 | 新增"稍后再看"功能，类似B站，维护一个list，按时间戳排序 | 待开发 |
| 12-30 | Yuquan | 管理后台 | 新增自定义UP主功能 | 待开发 |
| 12-30 | Yuquan | 管理后台 | 新增数据看板 | 待开发 |
| 12-30 | Daniel | 论文 | 全量抓取所有论文 | 待开发 |
| 12-30 | Daniel | 论文 | 支持自定义标签（如 3dgs、simulation） | 待开发 |

### 2026年1月

| 日期 | 提出人 | 模块 | 需求描述 | 状态 |
|------|--------|------|----------|------|
| 01-05 | Tao | 论文 | 支持自定义标签 | 待开发 |
| 01-05 | Tao | 论文 | 支持跟踪作者并推送提醒 | 待开发 |
| 01-05 | Jason | 论文 | 升级论文标签UI/UX样式，参考淘宝 | 待开发 |

---

## 4.3 开发走查提示词

执行一次系统性的用户端UI/UX优化与数据路由检查修复任务，覆盖以下7个核心页面：

- http://localhost:3000/videos
- http://localhost:3000/papers
- http://localhost:3000/repos
- http://localhost:3000/huggingface
- http://localhost:3000/jobs
- http://localhost:3000/news
- http://localhost:3000/bilibili-analytics

### 任务要求

#### 1. 统一设计规范

- 严格遵循设计系统标准：
  - https://design-system-r6er.vercel.app/design-systems/02-minimalism/example.html
  - https://design-system-r6er.vercel.app/design-systems/02-minimalism/README.md
- 全面检查并优化所有模块的间距、样式、排版紧凑度，确保7个页面在视觉与交互层面保持一致
- 建立可量化的设计走查清单（间距token、字体层级、色彩变量、组件状态），逐页验收

#### 2. 数据可用性治理

- 对huggingface、bilibili-analytics等无数据或空白页面进行根因分析：区分"接口无返回"与"前端未渲染"两类问题
- 为每类问题建立标准化修复流程：
  - a) 接口无数据 → 增加兜底空状态组件、添加重试与缓存策略、接入告警
  - b) 前端渲染异常 → 补充容错边界（ErrorBoundary）、增加骨架屏、完善TypeScript类型守卫
- 输出"数据可用性矩阵"，记录每个页面在修复前后的数据覆盖率、白屏率、接口成功率

#### 3. 系统性缺陷修复

- 基于已知报错建立日志映射表，将错误栈逐条关联到具体页面与组件
- 采用"一页一档案"模式：为每个页面创建Issue跟踪单，包含复现步骤、修复方案、测试用例、回归结果
- 修复完成后进行交叉评审：设计师走查UI一致性、后端验证数据完整性、QA执行回归与性能测试

#### 4. 交付物与验收标准

- 7个页面100%通过设计走查，0视觉回归缺陷
- 所有页面首屏数据加载成功率≥99%，白屏率降至0.1%以下
- 提供可视化报告（Lighthouse性能、Web Vitals、接口监控）与可合并的PR链接
- 代码层面：新增或更新的单元测试覆盖率≥80%，E2E测试用例覆盖主流程，CI流水线全绿

**另外：** 管理端 http://localhost:3000/admin 所有子页面也都需要检查数据问题，并统一优化UI

---

# 五、附录

## 5.1 每日文档更新要求

每天结束后更新项目相关文档，包括但不限于：

| 文档类型 | 内容要求 |
|----------|----------|
| 沟通记录 | 整理并更新所有项目相关的会议纪要、邮件往来、即时通讯记录等，确保信息完整、时间线清晰 |
| 发版记录 | 详细记录每次产品发版的版本号、发布时间、新增功能、修复的问题、影响范围及回滚方案等 |
| 产品全生命周期管理文档 | 更新产品从概念提出、需求分析、设计开发、测试验收、市场推广到运维支持等各阶段的管理文档 |
| 项目管理文档 | 更新项目计划、任务分配、进度跟踪、资源调配、风险管理、质量控制等项目管理相关文档 |

**要求：** 所有文档更新应遵循统一的文档规范，确保格式一致、内容准确、易于查阅。
