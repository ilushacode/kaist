import { useStore } from '../hooks/useStore';

/**
 * Полный сброс данных приложения.
 *
 * Чистит Zustand-стор (включая IndexedDB-кэши через resetAll) и все
 * localStorage-ключи, которые использует приложение, включая ключи
 * install-баннера. После успешного сброса перезагружает страницу.
 */
export async function resetApp({ reload = true }: { reload?: boolean } = {}): Promise<void> {
  try {
    await useStore.getState().resetAll();
  } catch (err) {
    console.warn('[resetApp] resetAll failed', err);
  }

  try {
    // resetAll уже чистит эти ключи, но подстрахуемся на случай
    // рассинхрона версий стора.
    localStorage.removeItem('theme');
    localStorage.removeItem('install-banner-dismissed-until');
    localStorage.removeItem('install-banner-installed');
    localStorage.removeItem('kaist-app-v5');
  } catch {
    /* noop */
  }

  if (reload) {
    window.location.reload();
  }
}