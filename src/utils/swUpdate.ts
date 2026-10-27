import { registerSW } from 'virtual:pwa-register';
import { APP_VERSION } from '../config';

const VERSION_KEY = 'kaist-app-version';
const RELOAD_FLAG_KEY = 'kaist-force-reload-flag';

/**
 * Гибридная проверка обновлений.
 * 1. Пытается обновить через Service Worker.
 * 2. Если SW завис (iOS), принудительно перезагружает страницу с cache-bust.
 * 3. Если после перезагрузки версия всё ещё старая — пускает приложение (защита от вечного цикла).
 */
export const checkAndApplyUpdates = (): Promise<void> => {
  return new Promise((resolve) => {
    // В dev-режиме не мучаем воркер
    if (!('serviceWorker' in navigator) || APP_VERSION === 'dev') {
      resolve();
      return;
    }

    // Предотвращаем бесконечный цикл перезагрузок:
    // если мы уже пытались обновиться в этой сессии и не вышло — пропускаем.
    const isForceReload = localStorage.getItem(RELOAD_FLAG_KEY) === 'true';
    
    if (isForceReload) {
      if (localStorage.getItem(VERSION_KEY) !== APP_VERSION) {
        // Если после force-reload версия всё ещё старая, значит, мы застряли.
        // Сбрасываем флаг и позволяем приложению загрузиться, чтобы не блокировать пользователя.
        console.log('[SW] Force reload did not update the app. Proceeding with stale version.');
        localStorage.removeItem(RELOAD_FLAG_KEY);
        resolve();
        return;
      }
      localStorage.removeItem(RELOAD_FLAG_KEY);
    }

    let isSettled = false;
    const settle = () => {
      if (!isSettled) {
        isSettled = true;
        resolve();
      }
    };

    const timeoutId = setTimeout(() => {
      // Если SW молчит дольше 2.5 секунд, не блокируем пользователя
      console.log('[SW] Update check timed out, continuing...');
      settle();
    }, 2500);

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[SW] Update found, applying...');
        updateSW(true).catch(() => {
          forceReload();
        });
      },
      onOfflineReady() {
        clearTimeout(timeoutId);
        settle();
      },
      onRegisteredSW(_, registration) {
        if (registration) {
          registration.update().catch(() => {});
        }
      },
      onRegisterError(error) {
        console.error('[SW] Registration error', error);
        clearTimeout(timeoutId);
        settle();
      },
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (localStorage.getItem(VERSION_KEY) !== APP_VERSION) {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        window.location.reload();
      }
    });

    setTimeout(() => {
      if (isSettled && !isForceReload) {
        const cachedVersion = localStorage.getItem(VERSION_KEY);
        if (cachedVersion && cachedVersion !== APP_VERSION) {
          forceReload();
        } else if (!cachedVersion) {
          localStorage.setItem(VERSION_KEY, APP_VERSION);
        }
      }
    }, 2600);
  });
};

function forceReload() {
  console.log('[SW] Forcing reload due to stale SW...');
  localStorage.setItem(RELOAD_FLAG_KEY, 'true');
  
  const url = new URL(window.location.href);
  url.searchParams.set('v', APP_VERSION);
  url.searchParams.set('t', Date.now().toString());
  
  window.location.replace(url.toString());
}