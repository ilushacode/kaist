import { useEffect, useRef } from 'react';
import { useStore } from './useStore';
import { trackLaunch } from '../api/track';

export const useStats = (): void => {
  const hasHydrated = useStore((s) => s._hasHydrated);
  const groups = useStore((s) => s.groups);
  const theme = useStore((s) => s.theme);

  // Защита от повторной отправки (StrictMode двойной mount).
  const sentRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (sentRef.current) return;
    sentRef.current = true;

    setTimeout(() => {
      try {
        trackLaunch(theme, groups);
      } catch (err) {
        console.warn('[useStats] trackLaunch failed', err);
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);
};