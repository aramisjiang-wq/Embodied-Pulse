---
name: "architecture-analyzer"
description: "Analyzes project architecture from global perspective, explaining overall structure, modules, data flow, and how components interact. Invoke when user asks about project architecture, wants to understand the big picture, or needs clarification on system design and component relationships."
---

# Project Architecture Analyzer

This skill provides a comprehensive analysis of the EmbodiedPulse project architecture, helping you understand the system from a global perspective down to specific components.

## What This Skill Does

1. **Global Architecture Overview**
   - Project structure analysis (frontend, backend, database, configuration)
   - Technology stack and frameworks used
   - Directory organization and purpose

2. **Module Breakdown**
   - Core modules and their responsibilities
   - How modules interact with each other
   - Data flow between components

3. **Route Architecture**
   - User-side routes (public & authenticated)
   - Admin-side routes (admin-only)
   - API endpoints and their purposes
   - Authentication and authorization patterns

4. **Data Flow Analysis**
   - Request lifecycle (frontend → backend → database)
   - Authentication flow (login → token → protected routes)
   - Data synchronization patterns

5. **Key Concepts Explained**
   - What each component does
   - When and how to use each part
   - Best practices and patterns

## When to Invoke

Invoke this skill when:
- User asks "What is the project architecture?"
- User asks "How does X work in this project?"
- User wants to understand "the big picture" or "global view"
- User asks about relationships between components
- User needs clarification on system design
- User mentions "从全局视野" (from global perspective)
- User wants to understand "what link does what" (什么环节什么板块)

## Analysis Process

### Step 1: Project Structure Analysis
```
EmbodiedPulse/
├── frontend/          # Next.js 14 + TypeScript
│   ├── src/app/       # App Router pages
│   ├── src/lib/       # Utilities, API clients, components
│   └── public/         # Static assets
├── backend/           # Express.js + TypeScript
│   ├── src/routes/     # API route definitions
│   ├── src/controllers/ # Business logic handlers
│   ├── src/services/    # Business logic layer
│   ├── src/middleware/  # Auth, validation, etc.
│   ├── src/config/      # Database, environment config
│   └── prisma/         # Database schemas
└── docs/              # Documentation
```

### Step 2: Core Modules Breakdown

#### Authentication & Authorization Module
**Purpose**: Handle user/admin login, token management, access control

**Components**:
- `auth.routes.ts` - Login/register endpoints
- `auth.controller.ts` - Auth logic
- `auth.middleware.ts` - Token verification
- `jwt.ts` - Token generation/validation

**Flow**:
1. User submits credentials → `/api/auth/login`
2. Backend validates → Generates JWT token
3. Frontend stores token → `localStorage`
4. Subsequent requests include `Authorization: Bearer <token>`
5. Middleware validates token → Sets `req.user`
6. Protected routes access granted

**Key Points**:
- Separate databases for users and admins
- Two token types: `access` (short-lived) and `refresh` (long-lived)
- Role-based access control: `user`, `admin`, `super_admin`

#### Content Management Module
**Purpose**: Manage papers, videos, news, HuggingFace models, GitHub repos, jobs

**Components**:
- `paper.routes.ts` - Paper CRUD
- `video.routes.ts` - Video CRUD
- `news.routes.ts` - News management
- `huggingface.routes.ts` - HuggingFace models
- `repo.routes.ts` - GitHub repos
- `job.routes.ts` - Job postings

**Flow**:
1. Admin adds content → `/api/admin/content/*`
2. Content stored in database
3. Data synced from external APIs → `/api/admin/sync/*`
4. Users view content → `/api/papers`, `/api/videos`, etc.
5. Optional authentication for personalized recommendations

**Key Points**:
- User routes use `optionalAuthenticate` (public with personalization if logged in)
- Admin routes use `authenticate + requireAdmin`
- External API integration for data fetching

#### Subscription System Module
**Purpose**: Allow users to subscribe to content and receive notifications

**Components**:
- `subscription.routes.ts` - User subscriptions
- `content-subscription.routes.ts` - Content subscriptions
- `subscription-update.routes.ts` - Update checking
- `notification.routes.ts` - Notifications

**Flow**:
1. User creates subscription → `/api/subscriptions`
2. System periodically checks for updates → `/api/subscription-updates`
3. New content matched → Create notification → `/api/notifications`
4. User views notifications → Frontend displays alerts

**Key Points**:
- Subscription criteria: keywords, tags, authors, uploaders
- Scheduled job checks for updates
- Real-time notification system

#### Data Synchronization Module
**Purpose**: Fetch data from external sources and keep database updated

**Components**:
- `sync.routes.ts` - Manual sync triggers
- `sync-admin.routes.ts` - Admin-to-user sync
- `sync-queue.routes.ts` - Queue management
- `scheduler.routes.ts` - Scheduled tasks

**Flow**:
1. Admin triggers sync → `/api/admin/sync/*`
2. System fetches from external APIs (Arxiv, GitHub, HuggingFace, etc.)
3. Data processed and stored in database
4. Queue manages concurrent sync tasks
5. Scheduler runs periodic syncs automatically

**Key Points**:
- Multiple data sources: Arxiv, GitHub, HuggingFace, Bilibili, YouTube, 36kr, etc.
- Cookie management for Bilibili API
- Queue system for handling large sync jobs
- Health monitoring and error tracking

#### Community & Marketplace Module
**Purpose**: User-generated content, discussions, job seeking

**Components**:
- `post.routes.ts` - Posts
- `comment.routes.ts` - Comments
- `favorite.routes.ts` - Favorites
- `community.routes.ts` - Community features

**Flow**:
1. User creates post → `/api/posts`
2. Other users view posts → `/api/posts`
3. Users can like/comment → `/api/posts/:id/like`, `/api/comments`
4. Save favorites → `/api/favorites`

**Key Points**:
- Content moderation (admin can delete/restore/pin)
- Hot topics tracking
- Active users ranking

### Step 3: Route Architecture Analysis

#### Route Organization Pattern

```
/api/
├── /auth              # Authentication (public)
├── /feed              # Content feed (public + optional auth)
├── /papers            # Papers (public + optional auth)
├── /videos            # Videos (public + optional auth)
├── /repos             # GitHub repos (public + optional auth)
├── /jobs              # Jobs (public + optional auth)
├── /huggingface        # HF models (public + optional auth)
├── /news              # News (public)
├── /posts             # Community posts (public + optional auth)
├── /comments          # Comments (public + optional auth)
├── /favorites         # User favorites (private)
├── /subscriptions      # User subscriptions (private)
├── /user              # User profile (private)
├── /search            # Global search (public)
├── /discovery         # Discovery page (public)
├── /notifications      # Notifications (private)
├── /analytics         # Analytics (private)
├── /stats             # Public stats (public)
├── /announcements     # Announcements (public)
├── /home-modules      # Homepage modules (public + admin)
├── /banners           # Banners (public)
├── /upload            # File upload (admin)
├── /proxy             # Image proxy (public)
├── /community         # Community features (public)
└── /admin/            # ALL ADMIN ROUTES (private + admin)
    ├── /me                    # Current admin info
    ├── /users                 # User management
    ├── /admins                # Admin management
    ├── /posts                 # Post moderation
    ├── /subscriptions         # Subscription management
    ├── /stats                 # Statistics
    ├── /content/*            # Content management
    ├── /sync/*               # Data sync
    ├── /bilibili-uploaders    # Bilibili UP主
    ├── /bilibili-cookies      # Bilibili cookies
    ├── /bilibili-search-keywords  # Bilibili keywords
    ├── /paper-search-keywords  # Paper keywords
    ├── /news-search-keywords   # News keywords
    ├── /huggingface-api        # HuggingFace API
    ├── /huggingface-authors    # HF author subscriptions
    ├── /huggingface-models     # HF model management
    ├── /github-repo-info       # GitHub repo info
    ├── /data-sources          # Data source management
    ├── /sync-queue            # Sync queue
    ├── /scheduler             # Scheduled tasks
    ├── /cookies               # Cookie management
    ├── /db-pool               # Database pool
    └── /community-config       # Community config
```

#### Authentication Patterns

| Pattern | Usage | Example |
|---------|---------|----------|
| `Public` | No authentication required | `/api/auth/login`, `/api/papers` |
| `optionalAuthenticate` | Public, but personalized if logged in | `/api/feed`, `/api/videos` |
| `authenticate` | Must be logged in | `/api/user/profile`, `/api/favorites` |
| `authenticate + requireAdmin` | Must be logged in AND be admin | `/api/admin/*` |

### Step 4: Data Flow Analysis

#### Request Lifecycle

```
User Action
    ↓
Frontend (Next.js)
    ↓ (HTTP Request with optional Bearer token)
Backend (Express.js)
    ↓
Middleware (auth.middleware.ts)
    ↓
├─→ Token valid? ──No──→ Return 401 Unauthorized
│   ↓ Yes
├─→ User exists? ──No──→ Return 404 Not Found
│   ↓ Yes
├─→ User active? ──No──→ Return 403 Forbidden
│   ↓ Yes
└─→ Controller (business logic)
    ↓
Service Layer (data access)
    ↓
Database (Prisma + SQLite)
    ↓
Response (JSON)
    ↓
Frontend (display data)
```

#### Authentication Flow

```
1. Login Request
   POST /api/auth/login
   Body: { email, password }
   
2. Backend Validation
   - Check credentials in database
   - Generate JWT access token (expires in 7 days)
   - Generate JWT refresh token (expires in 30 days)
   
3. Response
   {
     token: "access_token",
     refreshToken: "refresh_token",
     user: { id, username, email, role, ... }
   }
   
4. Frontend Storage
   localStorage.setItem('user_token', token)
   localStorage.setItem('user_refresh_token', refreshToken)
   
5. Authenticated Request
   GET /api/user/profile
   Headers: { Authorization: "Bearer <token>" }
   
6. Middleware Validation
   - Extract token from header
   - Verify JWT signature and expiration
   - Set req.user = decoded user data
   
7. Controller Access
   - Use req.user.id to fetch user data
   - Return user profile
```

#### Data Sync Flow

```
1. Admin Triggers Sync
   POST /api/admin/sync/arxiv
   
2. Controller Receives Request
   - Validate admin permissions
   - Call sync service
   
3. Service Layer
   - Fetch from external API (Arxiv)
   - Process and normalize data
   - Store in database
   
4. Queue Management (if large job)
   - Add to sync queue
   - Track progress and status
   
5. Response
   {
     synced: 150,
     errors: 2,
     duration: "12.5s"
   }
   
6. User Views Data
   GET /api/papers
   Returns newly synced papers
```

### Step 5: Key Concepts Explained

#### What is "Route" (路由)?
**Definition**: A URL path that maps to a specific handler function

**Purpose**: Defines how the application responds to client requests

**Example**:
- Route: `GET /api/papers`
- Handler: `getPaperList` in `paper.controller.ts`
- What it does: Returns a list of papers

**How to Use**:
1. Define route in `.routes.ts` file
2. Map HTTP method (GET/POST/PUT/DELETE) to path
3. Attach controller function as handler
4. Apply middleware (auth, validation, etc.)

#### What is "Controller" (控制器)?
**Definition**: Functions that handle HTTP requests and return responses

**Purpose**: Contains business logic for specific endpoints

**Example**:
- Controller: `getPaperList` in `paper.controller.ts`
- What it does: Fetches papers from database, applies filters, returns response

**How to Use**:
1. Import service functions for data access
2. Extract parameters from `req.query` or `req.body`
3. Call service layer
4. Format response using `sendSuccess()` or `sendError()`

#### What is "Service" (服务)?
**Definition**: Business logic layer that handles data operations

**Purpose**: Encapsulates database operations and business rules

**Example**:
- Service: `getPapers()` in `paper.service.ts`
- What it does: Queries database, applies business rules, returns data

**How to Use**:
1. Use Prisma client for database operations
2. Implement business logic (filtering, sorting, etc.)
3. Return data to controller
4. Handle errors appropriately

#### What is "Middleware" (中间件)?
**Definition**: Functions that execute before route handlers

**Purpose**: Cross-cutting concerns (auth, logging, validation)

**Example**:
- Middleware: `authenticate` in `auth.middleware.ts`
- What it does: Verifies JWT token, sets `req.user`

**How to Use**:
1. Define middleware function with `(req, res, next)` signature
2. Perform logic (auth, validation, logging)
3. Call `next()` to pass control to next middleware/handler
4. Apply to routes using `router.use(middleware)`

#### What is "Prisma"?
**Definition**: ORM (Object-Relational Mapping) for database operations

**Purpose**: Type-safe database access and migrations

**Example**:
- Prisma Schema: `model Paper { id String @id, title String, ... }`
- Usage: `prisma.paper.findMany({ where: { ... } })`

**How to Use**:
1. Define schema in `schema.prisma`
2. Generate Prisma client: `npx prisma generate`
3. Import and use in services
4. Run migrations: `npx prisma migrate`

#### What is "JWT" (JSON Web Token)?
**Definition**: Stateless authentication token

**Purpose**: Securely transmit user identity between client and server

**Example**:
- Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Contains: { userId, username, role, type, exp, iat }

**How to Use**:
1. Server generates token on login
2. Client stores token and sends in Authorization header
3. Server verifies token on each request
4. Token expires after configured time

## Common Patterns

### 1. Separation of Concerns
- **Routes** → Define endpoints
- **Controllers** → Handle requests
- **Services** → Business logic
- **Database** → Data persistence

### 2. Authentication Strategy
- **User routes**: `optionalAuthenticate` (public with personalization)
- **Private routes**: `authenticate` (must be logged in)
- **Admin routes**: `authenticate + requireAdmin` (must be admin)

### 3. Error Handling
- Use `sendSuccess(res, data, message)` for success
- Use `sendError(res, code, message, status)` for errors
- Consistent error codes across the application

### 4. Response Format
```typescript
{
  code: 0,           // 0 = success, non-zero = error
  message: "success",  // Human-readable message
  data: { ... },      // Response payload
  timestamp: 1234567890
}
```

## How to Use This Skill

### For Understanding Architecture
Ask: "帮我分析一下项目架构"
Ask: "从全局视角解释一下这个项目"
Ask: "我想了解整个系统的设计"

### For Understanding Specific Components
Ask: "认证模块是怎么工作的？"
Ask: "数据同步的流程是什么？"
Ask: "路由和控制器的关系是什么？"

### For Troubleshooting
Ask: "为什么这个API返回401？"
Ask: "用户端和管理端的区别是什么？"

### For Development Guidance
Ask: "我应该在哪里添加新的API？"
Ask: "如何实现一个新的功能模块？"

## Output Format

This skill provides:
1. **Architecture Overview** - High-level system design
2. **Module Breakdown** - Detailed component analysis
3. **Flow Diagrams** - Visual representation of data flow
4. **Code References** - Links to relevant files
5. **Best Practices** - Recommended patterns and conventions

## Key Files Reference

### Backend Core
- [app.ts](file:///Users/dong/Documents/Product/Embodied/backend/src/app.ts) - Express app setup
- [server.ts](file:///Users/dong/Documents/Product/Embodied/backend/src/server.ts) - Server startup
- [routes/index.ts](file:///Users/dong/Documents/Product/Embodied/backend/src/routes/index.ts) - Route registration

### Frontend Core
- [src/app/page.tsx](file:///Users/dong/Documents/Product/Embodied/frontend/src/app/page.tsx) - Homepage
- [src/lib/api/client.ts](file:///Users/dong/Documents/Product/Embodied/frontend/src/lib/api/client.ts) - API client setup

### Configuration
- [backend/.env](file:///Users/dong/Documents/Product/Embodied/backend/.env) - Environment variables
- [backend/prisma/schema.prisma](file:///Users/dong/Documents/Product/Embodied/backend/prisma/schema.prisma) - Database schema
