/**
 * Глобальные объекты, которые создаёт загрузчик AdFox / РСЯ
 * (https://yandex.ru/ads/system/context.js, подключается из index.html).
 */

export {};

declare global {
  interface YandexAdfoxCreateOptions {
    /** Владелец площадки (ownerId из кода AdFox). */
    ownerId: number;
    /** ID DOM-элемента, в который рендерится блок. */
    containerId: string;
    /** Параметры показа блока: p1 — рекламное место, p2 — площадка. */
    params?: Record<string, string>;
    /** Креатив отрисован в контейнере. */
    onRender?: () => void;
    /** Не удалось создать/отрисовать блок. */
    onError?: (error: unknown) => void;
    /** Вместо креатива показана заглушка. */
    onStub?: () => void;
  }

  interface YandexAdfoxCode {
    create: (options: YandexAdfoxCreateOptions) => void;
  }

  interface YandexAdsNamespace {
    adfoxCode?: YandexAdfoxCode;
  }

  interface Window {
    /** Очередь колбэков загрузчика; выполняется после загрузки context.js. */
    yaContextCb?: Array<() => void>;
    /** SDK AdFox / РСЯ, появляется только после загрузки context.js. */
    Ya?: YandexAdsNamespace;
    /**
     * `true`, если загрузчик AdFox подключён на этом хосте.
     * Выставляет инлайновый скрипт в index.html.
     */
    __adsEnabled?: boolean;
  }
}
