import { API_BASE, TRACK_TIMEOUT_MS } from '../config';
import { getOrCreateDeviceId } from '../utils/deviceId';
import type { Theme } from '../types';

const TRACK_PATH = '/api/track';

type ApiTheme = 'light' | 'dark' | 'system';

const toApiTheme = (theme: Theme): ApiTheme => {
  if (theme === 'light' || theme === 'dark') return theme;
  return 'system';
};

export interface TrackPayload {
  deviceId: string;
  theme: ApiTheme;
  groups: string[];
}

/**
 * Отправляет статистику на сервер. Fire-and-forget:
 * не бросает ошибок наружу и не блокирует UI.
 */
export const trackLaunch = (theme: Theme, groups: string[]): void => {
  if (typeof fetch === 'undefined') {
    console.warn('[track] fetch недоступен');
    return;
  }

  let payload: TrackPayload;
  try {
    payload = {
      deviceId: getOrCreateDeviceId(),
      theme: toApiTheme(theme),
      groups: Array.isArray(groups) ? groups.filter(Boolean) : [],
    };
  } catch (err) {
    console.warn('[track] failed to build payload', err);
    return;
  }

  const url = `${API_BASE}${TRACK_PATH}`;

  // Видимый след в консоли — чтобы понимать, что функция вызывается.
  console.debug('[track] POST', url, payload);

  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), TRACK_TIMEOUT_MS)
    : null;

  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      credentials: 'omit',
      signal: controller?.signal,
    })
      .then((res) => {
        console.debug('[track] response', res.status);
        // Тело не нужно — освобождаем ресурсы.
        if (res.body) {
          res.body.cancel?.().catch(() => {});
        }
      })
      .catch((err) => {
        // Не AbortError показываем явно — это реальная проблема (CORS, DNS, 4xx).
        if (err?.name === 'AbortError') {
          console.debug('[track] aborted (timeout)');
        } else {
          console.warn('[track] request failed', err);
        }
      })
      .finally(() => {
        if (timer) clearTimeout(timer);
      });
  } catch (err) {
    if (timer) clearTimeout(timer);
    console.warn('[track] fetch threw synchronously', err);
  }
};