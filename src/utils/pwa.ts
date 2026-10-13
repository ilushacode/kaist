export const isStandaloneMode = (): boolean => {
  // Vite подставляет process.env.NODE_ENV на этапе сборки.
  // В ts-jest — стандартный process.env, без import.meta.
  const isDev =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  if (isDev) return true;
  if (typeof window === 'undefined') return false;

  const displayModes = ['standalone', 'fullscreen', 'minimal-ui'] as const;
  const matchesDisplayMode = displayModes.some((mode) =>
    window.matchMedia?.(`(display-mode: ${mode})`).matches
  );
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean })
    ?.standalone === true;
  return matchesDisplayMode || iosStandalone;
};

export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS || /Android/i.test(ua);
};