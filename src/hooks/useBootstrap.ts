import { useEffect, useState } from 'react';
import { useStore } from './useStore';
import { fetchHashes, type AppHashes } from '../api/hash';
import { fetchSchedule, fetchExams, fetchStudents } from '../api/data';
import { fetchAdsData } from '../api/ads';
import { isCancelError } from '../api/client';
import { BOOTSTRAP_TIMEOUT_MS } from '../config';

const CACHE_LOAD_TIMEOUT_MS = 10_000;

/** Валидность кэша: наличие хотя бы одной группы. */
const hasGroups = (groups: Record<string, unknown> | null | undefined): boolean =>
  !!groups && Object.keys(groups).length > 0;

/**
 * Нужно ли перекачивать раздел.
 *
 * Правило:
 *  - серверного хэша нет → качаем только если локального кэша нет/он пуст;
 *  - серверный хэш есть → качаем, если локальный хэш отсутствует или
 *    отличается, или кэш пуст.
 */
const needsReload = (
  serverHash: string | null,
  localHash: string | null,
  localCacheIsValid: boolean
): boolean => {
  if (!localCacheIsValid) return true;
  if (serverHash && serverHash !== localHash) return true;
  return false;
};

/** Таймаут для loadHeavyCache, чтобы не зависнуть на IndexedDB. */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

export default function useBootstrap(): boolean {
  const [ready, setReady] = useState(false);
  const bootstrapRetry = useStore((s) => s.bootstrapRetry);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => {
      controller.abort(new DOMException('timeout', 'TimeoutError'));
    }, BOOTSTRAP_TIMEOUT_MS);

    (async () => {
      // 1. Тяжёлый кэш из IndexedDB. Если IndexedDB не ответит за 10 сек —
      //    продолжаем без кэша (bootstrap всё равно сходит за свежими данными).
      try {
        await withTimeout(useStore.getState().loadHeavyCache(), CACHE_LOAD_TIMEOUT_MS);
      } catch (err) {
        console.warn('Bootstrap: loadHeavyCache failed.', err);
      }
      if (cancelled) return;

      // 2. Есть ли валидный кэш расписания?
      const initial = useStore.getState();
      const hasScheduleCache = hasGroups(initial.scheduleGroups);
      const hasExamsCache = hasGroups(initial.examsGroups);
      const hasStudentsCache = hasGroups(initial.studentsGroups);

      if (hasScheduleCache) {
        setReady(true);
      } else {
        initial.setScheduleLoading(true);
        initial.setScheduleError(false);
      }
      if (!hasExamsCache) initial.setExamsLoading(true);
      if (!hasStudentsCache) initial.setStudentsLoading(true);

      // 3. Серверные хэши.
      let serverHashes: AppHashes | null = null;
      try {
        serverHashes = await fetchHashes({
          signal: controller.signal,
          timeout: BOOTSTRAP_TIMEOUT_MS,
        });
      } catch (err) {
        if (!isCancelError(err)) {
          console.warn('Bootstrap: /api/hash недоступен.', err);
        }
        serverHashes = null;
      }
      if (cancelled) return;

      // 4. Расписание.
      {
        const s = useStore.getState();
        const reload = needsReload(
          serverHashes?.schedule ?? null,
          s.scheduleHash,
          hasGroups(s.scheduleGroups)
        );
        if (reload) {
          try {
            const data = await fetchSchedule({
              signal: controller.signal,
              timeout: BOOTSTRAP_TIMEOUT_MS,
            });
            if (cancelled) return;
            if (hasGroups(data.groups)) {
              useStore.getState().setScheduleCache({
                groups: data.groups,
                contentHash: serverHashes?.schedule ?? data.contentHash,
                updatedAt: data.updatedAt,
              });
            } else {
              useStore.getState().setScheduleError(true);
              useStore.getState().setScheduleLoading(false);
            }
          } catch (err) {
            if (!isCancelError(err)) {
              console.warn('Bootstrap: расписание недоступно.', err);
            }
            if (!hasGroups(useStore.getState().scheduleGroups)) {
              useStore.getState().setScheduleError(true);
            }
            useStore.getState().setScheduleLoading(false);
          }
        } else {
          useStore.getState().setScheduleError(false);
          useStore.getState().setScheduleLoading(false);
        }
      }

      if (cancelled) return;

      // 5. Экзамены. Пустые groups не кэшируем: если сервер вернул пустоту,
      //    значит, что-то пошло не так — оставляем старый кэш и ставим ошибку.
      {
        const s = useStore.getState();
        const reload = needsReload(
          serverHashes?.exams ?? null,
          s.examsHash,
          hasGroups(s.examsGroups)
        );
        if (reload) {
          try {
            const data = await fetchExams({
              signal: controller.signal,
              timeout: BOOTSTRAP_TIMEOUT_MS,
            });
            if (cancelled) return;
            if (hasGroups(data.groups)) {
              useStore.getState().setExamsCache({
                groups: data.groups,
                contentHash: serverHashes?.exams ?? data.contentHash,
                updatedAt: data.updatedAt,
              });
            } else {
              useStore.getState().setExamsError(true);
              useStore.getState().setExamsLoading(false);
            }
          } catch (err) {
            if (!isCancelError(err)) {
              console.warn('Bootstrap: экзамены недоступны.', err);
            }
            if (!hasGroups(useStore.getState().examsGroups)) {
              useStore.getState().setExamsError(true);
            }
            useStore.getState().setExamsLoading(false);
          }
        } else {
          useStore.getState().setExamsError(false);
          useStore.getState().setExamsLoading(false);
        }
      }

      if (cancelled) return;

      // 6. Студенты. Тот же принцип, что и у экзаменов.
      {
        const s = useStore.getState();
        const reload = needsReload(
          serverHashes?.students ?? null,
          s.studentsHash,
          hasGroups(s.studentsGroups)
        );
        if (reload) {
          try {
            const data = await fetchStudents({
              signal: controller.signal,
              timeout: BOOTSTRAP_TIMEOUT_MS,
            });
            if (cancelled) return;
            if (hasGroups(data.groups)) {
              useStore.getState().setStudentsCache({
                groups: data.groups,
                contentHash: serverHashes?.students ?? data.contentHash,
                updatedAt: data.updatedAt,
              });
            } else {
              useStore.getState().setStudentsError(true);
              useStore.getState().setStudentsLoading(false);
            }
          } catch (err) {
            if (!isCancelError(err)) {
              console.warn('Bootstrap: студенты недоступны.', err);
            }
            if (!hasGroups(useStore.getState().studentsGroups)) {
              useStore.getState().setStudentsError(true);
            }
            useStore.getState().setStudentsLoading(false);
          }
        } else {
          useStore.getState().setStudentsError(false);
          useStore.getState().setStudentsLoading(false);
        }
      }

      if (cancelled) return;

      // 7. Реклама. Сервер не отдаёт хэш — сравниваем локальные хэши
      //    (до и после получения списка). Пустой список — валидное состояние.
      {
        try {
          const data = await fetchAdsData({
            signal: controller.signal,
            timeout: BOOTSTRAP_TIMEOUT_MS,
          });
          if (cancelled) return;
          const current = useStore.getState().adsHash;
          if (data.contentHash !== current) {
            useStore.getState().setAdsCache({
              list: data.list,
              contentHash: data.contentHash,
              updatedAt: data.updatedAt,
            });
          }
        } catch (err) {
          if (!isCancelError(err)) {
            console.warn('Bootstrap: объявления недоступны.', err);
          }
        }
      }

      if (cancelled) return;
      setReady(true);
      clearTimeout(timeoutTimer);
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutTimer);
      controller.abort();
    };
  }, [bootstrapRetry]);

  return ready;
}