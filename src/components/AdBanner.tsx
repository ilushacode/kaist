import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { AD_PLACEMENTS, type AdPlacement } from '../config';
import { pickAdUnit, type AdContext } from '../utils/adTargeting';
import {
  createContainerId,
  isAdfoxReady,
  isAdsEnabled,
  renderAdfoxBlock,
  whenAdfoxReady,
} from '../utils/adfox';
import '../styles/AdBanner.css';

interface AdBannerProps {
  /**
   * Рекламное место из `AD_PLACEMENTS` либо несколько мест сразу —
   * тогда компонент отрисует несколько блоков подряд.
   */
  placement: AdPlacement | AdPlacement[];
  /** Контекст для таргетинга: ключевые слова, здание дня, группа. */
  context?: AdContext;
  className?: string;
}

/** Сколько ждём загрузчик, прежде чем предупредить о блокировке. */
const LOADER_WATCHDOG_MS = 5000;

let warnedAboutBlockedLoader = false;

const toPlacementList = (placement: AdPlacement | AdPlacement[]): AdPlacement[] => {
  const list = Array.isArray(placement) ? placement : [placement];
  return Array.from(new Set(list));
};

/** Пока в контейнере нет рекламы — разворачивать нечего. */
const hasAdContent = (host: HTMLElement): boolean =>
  Boolean(host.querySelector('a, iframe, img'));

/** Слот плавно сворачивается в 0px. */
const collapseSlot = (slot: HTMLElement): void => {
  slot.style.maxHeight = '0px';
  slot.style.opacity = '0';
  delete slot.dataset.ready;
};

export const AdBanner = ({ placement, context, className }: AdBannerProps) => {
  const slotsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const observersRef = useRef<Array<() => void>>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  const placementList = useMemo(() => toPlacementList(placement), [placement]);

  // Стабильный ключ: массив-литерал в пропсе не должен вызывать перерисовку блоков.
  const placementsKey = placementList.join('|');

  /** Выбранное объявление для каждого места (по контексту). */
  const picks = useMemo(() => {
    const map: Partial<Record<AdPlacement, string>> = {};
    for (const name of placementList) {
      const unit = pickAdUnit(AD_PLACEMENTS[name], context ?? {});
      if (unit) map[name] = unit.name;
    }
    return map;
  }, [placementList, context]);

  const picksKey = placementList
    .map((name) => `${name}:${picks[name] ?? '-'}`)
    .join('|');

  useEffect(() => {
    observersRef.current.forEach((disconnect) => disconnect());
    observersRef.current = [];

    // Реклама выключена на этом хосте (загрузчик не подключался, см. index.html):
    // не создаём контейнеры и не копим колбэки в очереди SDK.
    if (!isAdsEnabled()) return;

    const placements = placementsKey
      ? (placementsKey.split('|') as AdPlacement[])
      : [];

    let hasPicked = false;

    /**
     * Наблюдатели одного контейнера: разворачивают слот, когда появился креатив.
     * Кэшируются по id, чтобы повторный запуск эффекта не плодил лишние
     * MutationObserver/ResizeObserver на том же host.
     */
    const expanders = new Map<string, { expand: () => void }>();

    const ensureExpander = (
      slot: HTMLDivElement,
      host: HTMLDivElement
    ): { expand: () => void } => {
      const cached = expanders.get(host.id);
      if (cached) return cached;

      let frame = 0;
      const expand = (): void => {
        if (!host.isConnected) return;
        // Основной сигнал — `onRender` от AdFox; эвристика и наблюдатели
        // остаются страховкой для старых версий загрузчика и нестандартных
        // шаблонов, которые `onRender` не вызывают.
        const hasCreative =
          host.dataset.adfoxRendered === 'true' || hasAdContent(host);
        if (!hasCreative) return;

        slot.dataset.ready = 'true';
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const height = host.getBoundingClientRect().height;
          if (height <= 0) return;
          slot.style.maxHeight = `${height}px`;
          slot.style.opacity = '1';
        });
      };

      const mutation = new MutationObserver(expand);
      mutation.observe(host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-adfox-rendered'],
      });

      const resize = new ResizeObserver(expand);
      resize.observe(host);

      observersRef.current.push(() => {
        mutation.disconnect();
        resize.disconnect();
        cancelAnimationFrame(frame);
      });

      const entry = { expand };
      expanders.set(host.id, entry);
      return entry;
    };

    for (const name of placements) {
      const slot = slotsRef.current[name];
      if (!slot) continue;

      const units = AD_PLACEMENTS[name] ?? [];
      const pickedName = picks[name];
      const isDismissed = Boolean(
        pickedName && dismissed[`${name}:${pickedName}`]
      );

      for (const unit of units) {
        const isPicked = unit.name === pickedName;

        // Контейнеры не удаляем: при StrictMode/смене таргета SDK может ещё
        // инициализировать блок и падает с CONTAINER_NOT_FOUND.
        // Невыбранные объявления просто прячем.
        let host = slot.querySelector<HTMLDivElement>(
          `:scope > [data-ad-unit="${unit.name}"]`
        );

        if (isPicked && !host) {
          const created = document.createElement('div');
          created.className = 'ad-banner__host';
          created.dataset.adUnit = unit.name;
          created.id = createContainerId(name);
          slot.appendChild(created);
          host = created;

          const containerId = created.id;

          whenAdfoxReady(() => {
            // Колбэк мог выполниться после размонтирования компонента.
            if (!created.isConnected) return;

            const expander = ensureExpander(slot, created);

            renderAdfoxBlock(unit, containerId, {
              onRender: () => {
                created.dataset.adfoxRendered = 'true';
                expander.expand();
              },
              // Заглушка AdFox — показывать нечего, слот остаётся схлопнутым.
              onStub: () => collapseSlot(slot),
            });
          });
        }

        if (host) host.hidden = !isPicked;
      }

      if (!pickedName) {
        collapseSlot(slot);
        continue;
      }

      const pickedHost = slot.querySelector<HTMLDivElement>(
        `[data-ad-unit="${pickedName}"]`
      );

      if (!pickedHost || isDismissed) {
        collapseSlot(slot);
        continue;
      }

      hasPicked = true;
      ensureExpander(slot, pickedHost).expand();
    }

    // Диагностика: context.js так и не загрузился — обычно это блокировщик
    // рекламы (в консоли будет ERR_BLOCKED_BY_CLIENT) или сетевой фильтр.
    const watchdog = hasPicked
      ? window.setTimeout(() => {
          if (isAdfoxReady() || warnedAboutBlockedLoader) return;
          warnedAboutBlockedLoader = true;
          if (import.meta.env.DEV) {
            console.warn(
              '[AdFox] context.js не загрузился. Вероятно, реклама ' +
                'заблокирована расширением браузера или DNS-фильтром ' +
                '(ERR_BLOCKED_BY_CLIENT).'
            );
          }
        }, LOADER_WATCHDOG_MS)
      : undefined;

    return () => {
      observersRef.current.forEach((disconnect) => disconnect());
      observersRef.current = [];
      if (watchdog !== undefined) window.clearTimeout(watchdog);
    };
  }, [placementsKey, picksKey, dismissed, picks]);

  if (placementList.length === 0) return null;

  const handleDismiss = (name: AdPlacement, unitName: string | undefined): void => {
    if (!unitName) return;
    setDismissed((prev) => ({ ...prev, [`${name}:${unitName}`]: true }));
  };

  return (
    <div className={className ? `ad-banner ${className}` : 'ad-banner'}>
      {placementList.map((name) => {
        const unitName = picks[name];
        const key = `${name}:${unitName ?? '-'}`;
        return (
          <div
            key={name}
            className="ad-banner__slot"
            data-ad-placement={name}
            ref={(el) => {
              slotsRef.current[name] = el;
            }}
          >
            {unitName && !dismissed[key] && (
              <button
                type="button"
                className="ad-banner__close"
                aria-label="Скрыть объявление"
                onClick={() => handleDismiss(name, unitName)}
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
