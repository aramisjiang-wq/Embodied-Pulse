/**
 * 页面生命周期工具函数
 * 使用现代 API 替代已弃用的 unload/beforeunload 事件
 */

/**
 * 使用 pagehide 事件监听页面卸载
 * 这是 unload 事件的现代替代方案，在所有浏览器中都有更好的支持
 * 
 * @param callback 页面卸载时的回调函数
 * @returns 清理函数
 */
export function onPageHide(callback: (event: PageTransitionEvent) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('pagehide', callback);
  
  return () => {
    window.removeEventListener('pagehide', callback);
  };
}

/**
 * 使用 visibilitychange 事件监听页面可见性变化
 * 当页面被隐藏或显示时触发（包括标签页切换、最小化等）
 * 
 * @param callback 页面可见性变化时的回调函数
 * @returns 清理函数
 */
export function onVisibilityChange(
  callback: (isVisible: boolean, event: Event) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleVisibilityChange = (event: Event) => {
    const isVisible = !document.hidden;
    callback(isVisible, event);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * 使用 sendBeacon API 发送数据（即使页面正在卸载）
 * 这是发送分析数据或日志的推荐方式
 * 
 * @param url 目标 URL
 * @param data 要发送的数据（字符串、Blob、FormData 等）
 * @returns 是否成功发送
 */
export function sendBeacon(url: string, data: string | Blob | FormData | ArrayBuffer): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    // 降级方案：使用 fetch with keepalive
    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        body: data instanceof FormData ? data : String(data),
        keepalive: true,
        headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      }).catch(() => {
        // 静默失败
      });
      return true;
    }
    return false;
  }

  return navigator.sendBeacon(url, data);
}

/**
 * 组合使用 pagehide 和 visibilitychange 来处理页面卸载
 * 推荐在需要保存数据或发送日志时使用
 * 
 * @param onUnload 页面卸载时的回调
 * @returns 清理函数
 */
export function onPageUnload(
  onUnload: (event: PageTransitionEvent | Event) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // 使用 pagehide 事件（现代标准）
  const cleanupPageHide = onPageHide(onUnload);
  
  // 使用 visibilitychange 作为补充（当页面变为隐藏时）
  const cleanupVisibility = onVisibilityChange((isVisible, event) => {
    if (!isVisible) {
      // 页面被隐藏，可能是卸载的前兆
      onUnload(event as PageTransitionEvent);
    }
  });

  return () => {
    cleanupPageHide();
    cleanupVisibility();
  };
}
