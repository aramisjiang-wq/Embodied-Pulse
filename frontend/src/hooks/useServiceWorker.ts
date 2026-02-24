import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isReady, setIsReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // 开发环境：跳过Service Worker注册
    if (process.env.NODE_ENV === 'development') {
      console.log('[SW] Development mode: Service Worker registration skipped');
      return;
    }

    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const registerSW = async () => {
        try {
          const swRegistration = await navigator.serviceWorker.register('/sw.js');
          setRegistration(swRegistration);
          setIsReady(true);

          swRegistration.addEventListener('updatefound', () => {
            const newWorker = swRegistration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New content is available; please refresh.');
                }
              });
            }
          });

          console.log('Service Worker registered successfully');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  const updateServiceWorker = async () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isReady,
    updateServiceWorker,
    registration,
  };
}
