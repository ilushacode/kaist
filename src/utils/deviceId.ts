const DEVICE_ID_KEY = 'kaist-device-id';

/**
 * Простой 64-битный хэш (djb2 + FNV-подобное смешивание).
 * Возвращает 16 hex-символов.
 */
const hashString = (input: string): string => {
  let h1 = 0x811c9dc5; // FNV offset basis
  let h2 = 5381; // djb2

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193); // FNV prime
    h2 = ((h2 << 5) + h2 + c) | 0;
  }

  const a = (h1 >>> 0).toString(16).padStart(8, '0');
  const b = (h2 >>> 0).toString(16).padStart(8, '0');
  return a + b;
};

/**
 * Собирает «отпечаток» устройства: UA, платформа, язык, часовой пояс,
 * разрешение экрана, аппаратные характеристики. Всё это — публичные данные,
 * которые не идентифицируют пользователя напрямую, но дают стабильный
 * вход для хэша.
 */
const collectFingerprint = (): string => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return 'ssr';
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };

  const parts: string[] = [
    nav.userAgent || '',
    nav.platform || '',
    nav.language || '',
    (nav.languages || []).join(','),
    String(nav.hardwareConcurrency ?? ''),
    String(nav.deviceMemory ?? ''),
    String(window.screen?.width ?? ''),
    String(window.screen?.height ?? ''),
    String(window.screen?.colorDepth ?? ''),
    String(window.devicePixelRatio ?? ''),
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  ];

  return parts.join('|');
};

/**
 * Генерирует уникальный deviceId один раз при первом запуске.
 * Складывает его в localStorage под отдельным ключом, который
 * НЕ очищается функцией сброса приложения.
 *
 * Если localStorage недоступен (приватный режим, отключён) — генерирует
 * временный ID в памяти. Он будет меняться между перезагрузками, но
 * приложение продолжит работать.
 */
export const getOrCreateDeviceId = (): string => {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && /^[0-9a-f]{16}$/i.test(existing)) {
      return existing;
    }
  } catch {
    /* localStorage недоступен — пойдём по пути генерации */
  }

  // Комбинируем отпечаток устройства с текущим временем и случайностью.
  // Время + random гарантируют уникальность даже при одинаковых устройствах,
  // а отпечаток делает ID стабильным на одном устройстве при повторной
  // генерации в редких случаях (например, при очистке localStorage).
  const seed = [
    collectFingerprint(),
    String(Date.now()),
    String(Math.random()),
    String(performance?.now?.() ?? ''),
  ].join('::');

  const id = hashString(seed);

  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    /* noop — работаем с in-memory ID */
  }

  return id;
};