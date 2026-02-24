'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // 开发环境：取消已注册的Service Worker并跳过注册
    if (process.env.NODE_ENV === 'development') {
      console.log('[SW] Development mode: Service Worker registration skipped');
      
      // 清理已注册的Service Worker
      if ('serviceWorker' in navigator && typeof window !== 'undefined') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().then((success) => {
              if (success) {
                console.log('[SW] Unregistered existing Service Worker');
              }
            });
          });
        });
      }
      
      return;
    }

    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const registerSW = async () => {
        try {
          const swRegistration = await navigator.serviceWorker.register('/sw.js');

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

  return null;
}
