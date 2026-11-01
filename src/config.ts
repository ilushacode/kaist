export const API_BASE = 'https://api.kaist.pro';

export const REQUEST_TIMEOUT_MS = 15000;
export const BOOTSTRAP_TIMEOUT_MS = 30000;
export const MIN_LOADER_MS = 1000;

export const TRACK_TIMEOUT_MS = 5000;

export const TELEGRAM_CHANNEL = 'kaist_app';

/**
 * Таргетинг объявления AdFox.
 * Сейчас НЕ используется: любое объявление показывается на своём месте.
 * Оставлено для будущего (ключевые слова, здания, группы).
 */
export interface AdfoxTargeting {
  /** Ключевые слова: предмет пары, тема, название события и т.п. */
  keywords?: string[];
  /** Здания (корпуса) 1–8: одно или несколько. */
  buildings?: number[];
  /** Группы целиком (точное совпадение), например `['3439', '4191']`. */
  groups?: string[];
  /**
   * Ограничения по цифрам номера группы.
   *
   * Массив до 4 элементов — допустимые цифры на каждой позиции.
   * `null` или пустой массив — любая цифра на этой позиции.
   *
   * Пример: `[[3], [4], [3, 5], [9]]` — подходят группы 3439 и 3459.
   */
  groupDigits?: Array<number[] | null>;
}

/**
 * Объявление AdFox — одно рекламное место с параметрами показа.
 *
 * Блок рисуется вызовом `Ya.adfoxCode.create({ ownerId, containerId, params })`.
 * Загрузчик (context.js) подключается один раз в index.html.
 */
export interface AdfoxUnit {
  /** Имя объявления — для отладки и тестов. */
  name: string;
  /** ownerId площадки AdFox. */
  ownerId: number;
  /** Параметры показа: p1 — рекламное место, p2 — площадка. */
  params: Record<string, string>;
  /** Кому показывать. Сейчас не используется (всегда показываем). */
  targeting?: AdfoxTargeting;
  /** Приоритет, когда подходят несколько объявлений (больше — важнее). */
  priority?: number;
}

/** Допустимое название рекламного места. */
export type AdPlacement =
  | 'schedule-top'
  | 'students-top'
  | 'teachers-top'
  | 'lesson-bottom';

/**
 * Рекламные места приложения → объявления AdFox.
 *
 * Пока на каждом месте одно объявление и без таргета: AdFox сам решает,
 * какой баннер показать. Новые клиенты добавляются в AdFox без правок кода.
 */
export const AD_PLACEMENTS: Record<AdPlacement, AdfoxUnit[]> = {
  /** Над расписанием. */
  'schedule-top': [
    {
      name: 'schedule-default',
      ownerId: 330181,
      params: { p1: 'dsoze', p2: 'jwhj' },
      priority: 1,
    },
  ],

  /** Перед списком одногруппников (в поиске не показывается). */
  'students-top': [
    {
      name: 'students-default',
      ownerId: 330181,
      params: { p1: 'dsozf', p2: 'jwhj' },
      priority: 1,
    },
  ],

  /** Перед списком преподавателей (в поиске не показывается). */
  'teachers-top': [
    {
      name: 'teachers-default',
      ownerId: 330181,
      params: { p1: 'dsozg', p2: 'jwhj' },
      priority: 1,
    },
  ],

  /** Внизу модалки деталей пары. */
  'lesson-bottom': [
    {
      name: 'lesson-default',
      ownerId: 330181,
      params: { p1: 'dsozh', p2: 'jwhj' },
      priority: 1,
    },
  ],
};

// Автоматическая версия, генерируется при сборке
export const APP_VERSION = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev';
