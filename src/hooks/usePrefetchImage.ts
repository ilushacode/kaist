import { useEffect, useState } from 'react';

export const usePrefetchImage = (src: string): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';

    const handleLoad = () => {
      if (!cancelled) setReady(true);
    };
    img.addEventListener('load', handleLoad);
    img.src = src;
    if (img.complete) handleLoad();

    return () => {
      cancelled = true;
      img.removeEventListener('load', handleLoad);
    };
  }, [src]);

  return ready;
};