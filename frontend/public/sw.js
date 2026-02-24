const CACHE_NAME = 'embodied-pulse-v4';
const urlsToCache = [
  '/',
  '/papers',
  '/repos',
  '/videos',
  '/community',
  '/favorites',
  '/profile',
];

const CACHE_DURATION = 5 * 60 * 1000;

// 检测是否为开发环境
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

self.addEventListener('install', (event) => {
  // 开发环境：跳过缓存，直接激活
  if (isDevelopment) {
    console.log('[SW] Development mode: skipping cache');
    self.skipWaiting();
    return;
  }

  // 生产环境：尝试缓存，但失败不影响激活
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 使用 Promise.allSettled 确保单个失败不影响其他
      return Promise.allSettled(
        urlsToCache.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[SW] Failed to cache ${url}:`, err.message);
            return null;
          })
        )
      );
    }).catch((error) => {
      console.warn('[SW] Service Worker cache failed:', error.message);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 开发环境：直接返回，不拦截请求
  if (isDevelopment) {
    return;
  }

  // 不缓存非 HTTP(S) 协议的请求（如 chrome-extension, chrome-search 等）
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 排除外部请求
  if (url.hostname !== 'localhost' && !url.hostname.includes('embodiedpulse.com')) {
    return;
  }

  // 开发环境：不缓存 Next.js 静态资源，避免版本不匹配导致的 fetch 失败
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // 开发环境：不缓存 webpack HMR 相关请求
  if (url.pathname.includes('webpack-hmr') || url.pathname.includes('__webpack')) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  // API 请求：network-first 策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 静态资源：cache-first 策略
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // 静态资源加载失败，返回空响应
            return new Response('', { status: 404 });
          });
      })
    );
    return;
  }

  // HTML 页面：network-first 策略
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 如果没有缓存，返回离线页面
          return new Response('Offline - Please check your connection', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
