# 工具函数说明

## pageLifecycle.ts

### 关于 "Unload event listeners are deprecated" 警告

如果你在浏览器控制台看到这个警告，这是正常的。这个警告通常来自：

1. **Next.js 框架本身** - Next.js 内部可能使用了已弃用的事件
2. **第三方库** - 某些依赖库可能仍在使用旧的事件 API
3. **浏览器扩展** - 某些浏览器扩展可能会注册这些事件监听器

### 重要说明

- ✅ **这个警告不会影响应用功能**
- ✅ **应用仍然可以正常工作**
- ⚠️ **这是浏览器对旧 API 的弃用警告，不是错误**

### 如果需要在页面卸载时执行操作

如果你需要在页面卸载时保存数据或发送日志，请使用 `pageLifecycle.ts` 中提供的现代 API：

```typescript
import { onPageUnload, sendBeacon } from '@/utils/pageLifecycle';

// 在组件中使用
useEffect(() => {
  const cleanup = onPageUnload((event) => {
    // 使用 sendBeacon 发送数据（即使页面正在卸载也能成功）
    sendBeacon('/api/analytics', JSON.stringify({
      action: 'page_unload',
      timestamp: Date.now(),
    }));
  });

  return cleanup;
}, []);
```

### 推荐的现代 API

1. **`pagehide` 事件** - 替代 `unload` 事件
2. **`visibilitychange` 事件** - 检测页面可见性变化
3. **`navigator.sendBeacon()`** - 在页面卸载时发送数据

### 更多信息

- [MDN: Page Lifecycle API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [MDN: sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
- [Chrome: Page Lifecycle API](https://developer.chrome.com/blog/page-lifecycle-api/)
