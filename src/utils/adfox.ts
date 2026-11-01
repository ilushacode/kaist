import type { AdfoxUnit } from '../config';

/**
 * Обёртка над загрузчиком AdFox / РСЯ.
 *
 * Сам загрузчик (context.js) подключается один раз в index.html — и только
 * на боевом хосте (`isAdsEnabled`). Здесь — работа с очередью `yaContextCb`
 * и вызов создания блока.
 */

/**
 * Включена ли реклама на текущем хосте.
 *
 * Загрузчик подключается только на боевом домене: на localhost/превью он не
 * грузится, чтобы тестовые открытия не попадали в статистику AdFox. Принудительно
 * включить локально — `?ads=1`.
 */
export const isAdsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.__adsEnabled === true;
};

/** Загрузился ли SDK (context.js) и доступен ли `Ya.adfoxCode`. */
export const isAdfoxReady = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Ya?.adfoxCode?.create);
};

/** Очередь колбэков, которую загрузчик выполняет после инициализации. */
export const getAdfoxQueue = (): Array<() => void> => {
  if (typeof window === 'undefined') return [];
  window.yaContextCb = window.yaContextCb || [];
  return window.yaContextCb;
};

/**
 * Выполняет колбэк сразу, если SDK уже загружен, иначе ставит его в очередь.
 * Колбэк выполнится ровно один раз.
 */
export const whenAdfoxReady = (callback: () => void): void => {
  if (typeof window === 'undefined') return;
  if (isAdfoxReady()) {
    callback();
    return;
  }
  getAdfoxQueue().push(callback);
};

/** События блока, которые отдаёт сам AdFox (см. документацию `create`). */
export interface AdfoxRenderHandlers {
  /** Креатив отрисован в контейнере — слот можно разворачивать. */
  onRender?: () => void;
  /** Не удалось создать/отрисовать блок (ошибка SDK или запроса). */
  onError?: (error: unknown) => void;
  /** Вместо креатива AdFox показал заглушку. */
  onStub?: () => void;
}

/**
 * Создаёт рекламный блок AdFox в контейнере с указанным id.
 *
 * Ошибки не пробрасываются наружу: исключение внутри колбэка, который вызывает
 * загрузчик, ломает инициализацию остальных блоков на странице. Всё уходит в
 * `onError` (и в консоль в dev-сборке).
 *
 * @returns `true`, если вызов `create` ушёл в SDK.
 */
export const renderAdfoxBlock = (
  unit: AdfoxUnit,
  containerId: string,
  handlers: AdfoxRenderHandlers = {}
): boolean => {
  const adfox = window.Ya?.adfoxCode;
  if (!adfox?.create) return false;

  const fail = (error: unknown): void => {
    if (import.meta.env.DEV) {
      console.warn(`[AdFox] блок ${containerId} не создан:`, error);
    }
    handlers.onError?.(error);
  };

  try {
    adfox.create({
      ownerId: unit.ownerId,
      containerId,
      params: { ...unit.params },
      onRender: () => handlers.onRender?.(),
      onError: fail,
      onStub: () => handlers.onStub?.(),
    });
    return true;
  } catch (error) {
    fail(error);
    return false;
  }
};

let containerUid = 0;

/**
 * Уникальный id контейнера для `containerId`.
 *
 * Нужен, чтобы один и тот же блок можно было безопасно перемонтировать
 * (SPA-переходы, StrictMode) и ставить несколько блоков на странице.
 */
export const createContainerId = (placement: string): string => {
  containerUid += 1;
  const safePlacement = placement.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `adfox_${safePlacement}_${containerUid}`;
};
