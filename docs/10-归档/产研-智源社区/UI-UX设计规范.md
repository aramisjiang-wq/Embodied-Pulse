# 智源社区UI/UX设计规范

## 1. 设计原则

### 1.1 核心设计理念
- **简洁专业**: 避免过度装饰，突出内容本身
- **信息层次**: 清晰的视觉层次，引导用户注意力
- **高效获取**: 快速找到所需信息，减少操作步骤
- **一致性**: 统一的视觉语言和交互模式
- **响应式**: 适配各种设备和屏幕尺寸

### 1.2 设计目标
- 提升内容可读性
- 优化信息发现效率
- 增强用户参与度
- 提高转化率
- 降低学习成本

## 2. 视觉设计规范

### 2.1 色彩系统

#### 主色调
```css
/* 品牌色 - 智源蓝 */
--primary-color: #1890FF;
--primary-hover: #40A9FF;
--primary-active: #096DD9;

/* 辅助色 - 成功、警告、错误 */
--success-color: #52C41A;
--warning-color: #FAAD14;
--error-color: #FF4D4F;
--info-color: #1890FF;
```

#### 中性色
```css
/* 文字颜色 */
--text-primary: #262626;      /* 主要文字 */
--text-secondary: #595959;    /* 次要文字 */
--text-tertiary: #8C8C8C;     /* 辅助文字 */
--text-disabled: #BFBFBF;     /* 禁用文字 */

/* 背景颜色 */
--bg-primary: #FFFFFF;        /* 主背景 */
--bg-secondary: #FAFAFA;      /* 次背景 */
--bg-tertiary: #F5F5F5;       /* 三级背景 */
--bg-disabled: #F5F5F5;       /* 禁用背景 */

/* 边框颜色 */
--border-color: #D9D9D9;      /* 边框 */
--border-light: #F0F0F0;      /* 浅边框 */
```

#### 暗黑模式
```css
/* 暗黑模式色彩 */
--dark-bg-primary: #141414;
--dark-bg-secondary: #1F1F1F;
--dark-bg-tertiary: #262626;
--dark-text-primary: #E8E8E8;
--dark-text-secondary: #B8B8B8;
--dark-border-color: #434343;
```

### 2.2 字体系统

#### 字体家族
```css
/* 中文字体 */
--font-family-zh: -apple-system, BlinkMacSystemFont, "PingFang SC",
                  "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑",
                  Arial, sans-serif;

/* 英文字体 */
--font-family-en: -apple-system, BlinkMacSystemFont, "Segoe UI",
                  Roboto, "Helvetica Neue", Arial, sans-serif;

/* 代码字体 */
--font-family-code: "SF Mono", Monaco, "Cascadia Code",
                    "Roboto Mono", Consolas, "Courier New",
                    monospace;
```

#### 字号规范
```css
/* 标题字号 */
--font-size-h1: 32px;    /* 页面主标题 */
--font-size-h2: 24px;    /* 区块标题 */
--font-size-h3: 20px;    /* 子标题 */
--font-size-h4: 16px;    /* 小标题 */

/* 正文字号 */
--font-size-base: 14px;  /* 基础字号 */
--font-size-lg: 16px;    /* 大号文字 */
--font-size-sm: 12px;    /* 小号文字 */
--font-size-xs: 10px;    /* 超小号文字 */

/* 行高 */
--line-height-base: 1.5;
--line-height-heading: 1.2;
```

#### 字重规范
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 2.3 间距系统

```css
/* 基础间距单位 */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;

/* 组件间距 */
--component-padding-sm: 8px 12px;
--component-padding-md: 12px 16px;
--component-padding-lg: 16px 24px;
```

### 2.4 圆角规范

```css
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 8px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### 2.5 阴影规范

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## 3. 页面布局设计

### 3.1 整体布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                        顶部导航栏                             │
│  Logo  |  导航菜单  |  搜索框  |  用户菜单                    │
├─────────────────────────────────────────────────────────────┤
│                        分类导航栏                             │
│  ML论文  DataAI4Science  Multimodal  AIGen  NLP  ...         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   侧边栏     │               主内容区                        │
│              │                                              │
│  热门文章    │  ┌────────────────────────────────────────┐  │
│              │  │           文章卡片 1                    │  │
│  标签云      │  ├────────────────────────────────────────┤  │
│              │  │           文章卡片 2                    │  │
│  推荐阅读    │  ├────────────────────────────────────────┤  │
│              │  │           文章卡片 3                    │  │
│  广告位      │  ├────────────────────────────────────────┤  │
│              │  │           文章卡片 4                    │  │
│              │  └────────────────────────────────────────┘  │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┤
│                        页脚                                 │
│  关于我们  联系方式  隐私政策  版权声明                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 响应式断点

```css
/* 移动端 */
@media (max-width: 576px) {
  /* 单栏布局，隐藏侧边栏 */
}

/* 平板端 */
@media (min-width: 577px) and (max-width: 992px) {
  /* 双栏布局，侧边栏在底部 */
}

/* 桌面端 */
@media (min-width: 993px) and (max-width: 1200px) {
  /* 双栏布局，侧边栏在左侧 */
}

/* 大屏端 */
@media (min-width: 1201px) {
  /* 宽屏布局，优化间距 */
}
```

### 3.3 核心页面设计

#### 3.3.1 首页设计

**布局结构**:
- 顶部导航栏（固定）
- 分类导航栏（可滚动）
- 主内容区 + 侧边栏
- 页脚

**内容区块**:
1. **Banner区域**（可选）
   - 轮播图展示重要资讯
   - 3-5张精选文章

2. **最新资讯**
   - 文章卡片列表
   - 无限滚动加载
   - 每页显示10-20条

3. **侧边栏**
   - 热门文章（Top 10）
   - 标签云
   - 推荐阅读
   - 订阅入口

**文章卡片设计**:
```
┌─────────────────────────────────────────────────────────────┐
│  [分类标签]  文章标题                                        │
│                                                              │
│  文章摘要（150字左右，超出显示"..."）                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  作者  |  发布时间  |  阅读量  |  点赞数  |  收藏      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3.2 文章详情页设计

**布局结构**:
```
┌─────────────────────────────────────────────────────────────┐
│  面包屑导航：首页 > ML论文 > 文章标题                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  文章标题                                                    │
│  ─────────────────────────────────────────────────────────   │
│  作者 | 发布时间 | 分类 | 标签 | 阅读量 | 点赞数              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │                  文章正文内容                          │ │
│  │                                                        │ │
│  │                  （支持Markdown渲染）                  │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  操作栏：点赞  收藏  分享  评论                              │
│                                                              │
│  相关文章推荐                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  相关文章卡片 1                                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  相关文章卡片 2                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  评论区（v2.0功能）                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  评论列表                                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3.3 分类页面设计

**布局结构**:
- 分类标题和描述
- 筛选条件（时间、热度等）
- 文章列表
- 分页/无限滚动

**筛选器设计**:
```
┌─────────────────────────────────────────────────────────────┐
│  分类：ML论文                                               │
│                                                              │
│  排序方式：[最新发布 ▼]  [最多阅读]  [最多点赞]             │
│                                                              │
│  时间筛选：[全部]  [今天]  [本周]  [本月]  [本年]           │
│                                                              │
│  标签筛选：[深度学习] [自然语言处理] [计算机视觉] ...        │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3.4 搜索结果页设计

**布局结构**:
- 搜索框和搜索关键词
- 搜索结果数量
- 搜索结果列表
- 相关搜索推荐

**搜索结果卡片**:
```
┌─────────────────────────────────────────────────────────────┐
│  文章标题（关键词高亮）                                      │
│                                                              │
│  文章摘要（关键词高亮）                                      │
│                                                              │
│  分类：ML论文  |  标签：深度学习  |  发布时间：2024-01-15     │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3.5 用户个人中心设计

**布局结构**:
```
┌─────────────────────────────────────────────────────────────┐
│  用户头像  用户名  简介                                      │
│  ─────────────────────────────────────────────────────────   │
│  [编辑资料]  [设置]                                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  侧边栏菜单   │               内容区                        │
│              │                                              │
│  我的收藏    │  ┌────────────────────────────────────────┐  │
│              │  │  收藏的文章列表                          │  │
│  阅读历史    │  └────────────────────────────────────────┘  │
│              │                                              │
│  我的评论    │  ┌────────────────────────────────────────┐  │
│              │  │  评论历史列表                            │  │
│  消息通知    │  └────────────────────────────────────────┘  │
│              │                                              │
│  账号设置    │  ┌────────────────────────────────────────┐  │
│              │  │  账号信息表单                            │  │
│              │  └────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────┘
```

#### 3.3.6 管理后台设计

**布局结构**:
```
┌─────────────────────────────────────────────────────────────┐
│  Logo  管理后台  用户信息  退出                             │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  侧边栏菜单   │               内容区                        │
│              │                                              │
│  仪表盘      │  ┌────────────────────────────────────────┐  │
│              │  │  数据统计卡片                            │  │
│  文章管理    │  │  图表展示                                │  │
│              │  └────────────────────────────────────────┘  │
│  分类管理    │                                              │
│              │  ┌────────────────────────────────────────┐  │
│  用户管理    │  │  文章列表表格                            │  │
│              │  │  操作按钮（编辑、删除）                  │  │
│  标签管理    │  └────────────────────────────────────────┘  │
│              │                                              │
│  数据统计    │  ┌────────────────────────────────────────┐  │
│              │  │  编辑表单                                │  │
│  系统设置    │  └────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────┘
```

## 4. 组件设计规范

### 4.1 按钮组件

#### 主要按钮
```css
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  background-color: var(--primary-active);
  transform: translateY(0);
}
```

#### 次要按钮
```css
.btn-secondary {
  background-color: white;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
```

#### 文字按钮
```css
.btn-text {
  background-color: transparent;
  color: var(--primary-color);
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-text:hover {
  background-color: var(--bg-tertiary);
}
```

### 4.2 卡片组件

```css
.card {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
}

.card-body {
  color: var(--text-secondary);
  line-height: var(--line-height-base);
}

.card-footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}
```

### 4.3 标签组件

```css
.tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-primary {
  background-color: rgba(24, 144, 255, 0.1);
  color: var(--primary-color);
}

.tag-primary:hover {
  background-color: rgba(24, 144, 255, 0.2);
}

.tag-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.tag-secondary:hover {
  background-color: var(--border-light);
}
```

### 4.4 输入框组件

```css
.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

### 4.5 搜索框组件

```css
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 8px 40px 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}

.search-icon {
  position: absolute;
  right: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
}
```

### 4.6 加载组件

```css
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-tertiary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 4.7 空状态组件

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-sm);
}

.empty-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
```

## 5. 交互设计规范

### 5.1 动画效果

#### 过渡动画
```css
/* 标准过渡 */
.transition {
  transition: all 0.3s ease;
}

/* 快速过渡 */
.transition-fast {
  transition: all 0.15s ease;
}

/* 慢速过渡 */
.transition-slow {
  transition: all 0.5s ease;
}
```

#### 悬停效果
```css
/* 卡片悬停 */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 按钮悬停 */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 链接悬停 */
.link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}
```

#### 点击效果
```css
/* 按钮点击 */
.btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* 卡片点击 */
.card:active {
  transform: translateY(-2px);
}
```

### 5.2 反馈机制

#### 加载反馈
- 页面加载：骨架屏
- 按钮加载：加载图标
- 列表加载：底部加载指示器
- 表单提交：提交中状态

#### 成功反馈
- Toast提示：操作成功
- 页面跳转：成功页面
- 表单提交：成功提示

#### 错误反馈
- 表单验证：错误提示
- 网络错误：错误页面
- 操作失败：错误提示

### 5.3 手势交互（移动端）

#### 手势操作
- 下拉刷新
- 上拉加载
- 左右滑动
- 长按操作

#### 触摸反馈
- 点击反馈：缩放效果
- 滑动反馈：跟随手指
- 长按反馈：震动提示

## 6. 无障碍设计

### 6.1 键盘导航
- Tab键导航
- Enter键确认
- Esc键取消
- 快捷键支持

### 6.2 屏幕阅读器
- ARIA标签
- 语义化HTML
- alt文本
- 焦点管理

### 6.3 色彩对比度
- 文字对比度 ≥ 4.5:1
- 大号文字对比度 ≥ 3:1
- 非文字元素对比度 ≥ 3:1

### 6.4 字体大小
- 最小字号 12px
- 支持字体缩放
- 行高 ≥ 1.5

## 7. 性能优化设计

### 7.1 图片优化
- 响应式图片
- 懒加载
- WebP格式
- 图片压缩

### 7.2 代码优化
- 代码分割
- 懒加载
- Tree Shaking
- 压缩混淆

### 7.3 缓存策略
- 浏览器缓存
- CDN缓存
- Service Worker
- 本地存储

## 8. 设计交付物

### 8.1 设计稿
- 高保真设计稿（Figma/Sketch）
- 响应式设计稿
- 暗黑模式设计稿
- 交互原型

### 8.2 设计规范
- 组件库文档
- 设计系统文档
- 图标库
- 字体文件

### 8.3 资源文件
- 切图资源
- 图标资源
- 字体资源
- 样式文件

---

**文档版本**: v1.0
**创建日期**: 2026-02-05
**最后更新**: 2026-02-05
**文档状态**: 待审核
