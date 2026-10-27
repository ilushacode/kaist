import { useStore } from '../hooks/useStore';

/**
 * Принудительно удаляет все Service Worker'ы и кэши (Cache Storage).
 * Данные пользователя (localStorage, IndexedDB) не трогает.
 */
async function clearCachesOnly(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log('[Reset] Service workers unregistered');
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('[Reset] Caches cleared:', cacheNames);
    }
  } catch (err) {
    console.warn('[Reset] clearCachesOnly failed', err);
  }
}

/**
 * Полный сброс всего, что приложение сохранило (кроме deviceId).
 */
async function clearEverything(): Promise<void> {
  // 1. Кэши и SW
  await clearCachesOnly();

  // 2. Данные приложения (IndexedDB + localStorage из стора)
  try {
    await useStore.getState().resetAll();
  } catch (err) {
    console.warn('[Reset] resetAll failed', err);
  }

  // 3. Остальные ключи localStorage
  try {
    localStorage.removeItem('theme');
    localStorage.removeItem('install-banner-dismissed-until');
    localStorage.removeItem('install-banner-installed');
    localStorage.removeItem('kaist-app-v5');
    localStorage.removeItem('kaist-app-version');
    localStorage.removeItem('kaist-force-reload-flag');
  } catch {
    /* noop */
  }

  // ВАЖНО: 'kaist-device-id' намеренно НЕ трогаем.
}

/**
 * Проверяет URL на наличие ?reset=cache или ?reset=all.
 * Если найден — выполняет сброс и перезагружает страницу.
 * @returns true, если был выполнен сброс (рендер надо остановить).
 */
export async function handleResetFromUrl(): Promise<boolean> {
  const url = new URL(window.location.href);
  const mode = url.searchParams.get('reset');

  if (!mode) return false;

  console.log(`[Reset] Triggered from URL: reset=${mode}`);

  try {
    if (mode === 'cache') {
      await clearCachesOnly();
    } else if (mode === 'all') {
      await clearEverything();
    } else {
      console.warn(`[Reset] Unknown reset mode: ${mode}`);
      return false;
    }

    // Небольшая задержка — iOS иногда нужно время, чтобы завершить операции.
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Перезагружаемся уже без параметра reset, чтобы не зациклиться
    url.searchParams.delete('reset');
    url.searchParams.set('_r', Date.now().toString());
    window.location.replace(url.toString());
    return true;
  } catch (err) {
    console.error('[Reset] Failed', err);
    return false;
  }
}

/**
 * Полный сброс данных приложения (используется в DebugModal).
 */
export async function resetApp({ reload = true }: { reload?: boolean } = {}): Promise<void> {
  await clearEverything();

  if (reload) {
    window.location.reload();
  }
}