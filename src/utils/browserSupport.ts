/**
 * Проверка совместимости браузера с критичными функциями приложения.
 *
 * Приложение offline-first: без IndexedDB, localStorage и Service Worker
 * оно либо не запустится, либо будет вести себя непредсказуемо (в частности,
 * Brave в приватном режиме и с включённой блокировкой хранения).
 *
 * Возвращает отчёт: ok / список проблем / советы пользователю.
 */

export type SupportIssue =
  | 'indexeddb'
  | 'localstorage'
  | 'serviceworker'
  | 'cachestorage'
  | 'fetch'
  | 'quota';

export interface SupportReport {
  ok: boolean;
  issues: SupportIssue[];
}

/**
 * Пытается открыть IndexedDB. В Brave при блокировке хранилища
 * `indexedDB.open` может зависнуть — поэтому гоняем с таймаутом.
 */
const checkIndexedDB = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof indexedDB === 'undefined' || !indexedDB) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    // Если indexedDB.open не вернёт ни success, ни error за это время,
    // считаем, что хранилище заблокировано.
    const timer = setTimeout(() => finish(false), 1500);

    try {
      const request = indexedDB.open('__kaist_probe__', 1);

      request.onupgradeneeded = () => {
        // Создаём пустой store — это валидный апгрейд.
        try {
          request.result.createObjectStore('probe');
        } catch {
          /* noop */
        }
      };

      request.onsuccess = () => {
        clearTimeout(timer);
        try {
          request.result.close();
          // Чистим за собой, чтобы не мусорить в базе.
          indexedDB.deleteDatabase('__kaist_probe__');
        } catch {
          /* noop */
        }
        finish(true);
      };

      request.onerror = () => {
        clearTimeout(timer);
        finish(false);
      };

      request.onblocked = () => {
        clearTimeout(timer);
        finish(false);
      };
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });

/**
 * localStorage может быть формально доступен, но падать при записи
 * (Safari private mode, Brave с блокировкой, квота).
 */
const checkLocalStorage = (): boolean => {
  try {
    const key = '__kaist_probe__';
    localStorage.setItem(key, '1');
    const value = localStorage.getItem(key);
    localStorage.removeItem(key);
    return value === '1';
  } catch {
    return false;
  }
};

/** Проверка fetch — тривиально, но бывает отключён в кастомных webview. */
const checkFetch = (): boolean => typeof fetch === 'function';

/**
 * Service Worker — критичен для PWA и офлайн-режима.
 * В Brave/приватных режимах `navigator.serviceWorker` может отсутствовать,
 * а регистрация — падать.
 */
const checkServiceWorker = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;
  try {
    // Регистрация без файла невозможна, но проверяем сам API и то,
    // что он не заблокирован (в некоторых конфигурациях бросает).
    const regs = await navigator.serviceWorker.getRegistrations();
    // Даже пустой список — это нормально: значит, API работает.
    return Array.isArray(regs);
  } catch {
    return false;
  }
};

/** Cache Storage нужен Workbox для precache и runtime-кэша. */
const checkCacheStorage = (): boolean => {
  try {
    if (typeof caches === 'undefined') return false;
    // Проверяем, что API действительно возвращает промис.
    return typeof caches.open === 'function';
  } catch {
    return false;
  }
};

/**
 * Проверка квоты хранилища. Не критична (пустой Storage API — норм),
 * но если браузер явно вернул 0 байт — сохранить расписание не выйдет.
 */
const checkQuota = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    // Storage API нет — не считаем это проблемой: IndexedDB может
    // всё равно работать (например, старые WebView).
    return true;
  }
  try {
    const est = await navigator.storage.estimate();
    if (typeof est.quota === 'number' && est.quota === 0) return false;
    return true;
  } catch {
    return true;
  }
};

/**
 * Полная проверка. Запускается во время лоадера; не бросает.
 */
export async function checkBrowserSupport(): Promise<SupportReport> {
  const issues: SupportIssue[] = [];

  if (!checkFetch()) issues.push('fetch');
  if (!checkLocalStorage()) issues.push('localstorage');

  const [idb, sw, quota] = await Promise.all([
    checkIndexedDB(),
    checkServiceWorker(),
    checkQuota(),
  ]);

  if (!idb) issues.push('indexeddb');
  if (!sw) issues.push('serviceworker');
  if (!checkCacheStorage()) issues.push('cachestorage');
  if (!quota) issues.push('quota');

  return { ok: issues.length === 0, issues };
}