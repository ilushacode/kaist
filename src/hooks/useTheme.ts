import { useEffect, useState } from 'react';
import { useStore } from './useStore';
import type { Theme } from '../types';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const useTheme = (): 'light' | 'dark' => {
  const theme = useStore((s) => s.theme ?? 'auto') as Theme;
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MEDIA_QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const resolved: 'light' | 'dark' =
    theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const prev = root.dataset.theme;

    const apply = () => {
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#0f1216' : '#f2f5fb');
      }
    };

    if (!prev) {
      apply();
      return;
    }
    if (prev === resolved) return;

    const docWithVT = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (typeof docWithVT.startViewTransition === 'function') {
      docWithVT.startViewTransition(apply);
      return;
    }
    apply();
  }, [resolved]);

  return resolved;
};