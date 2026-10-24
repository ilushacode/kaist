import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { pickAdForGroup } from '../../utils/ads';
import type { AdRaw } from '../../types';
import '../../styles/AdBanner.css';

const SPRING = { type: 'spring', stiffness: 400, damping: 36, mass: 0.6 } as const;

function openExternal(url: string): void {
  if (!url) return;

  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // Некоторые webview требуют, чтобы ссылка была в DOM перед кликом.
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    a.style.top = '0';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  } catch {
    /* пробуем fallback ниже */
  }

  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    /* последний шанс — перейти в текущем окне */
    window.location.href = url;
  }
}

interface AdBannerProps {
  adsRaw: AdRaw[];
  group: string | null;
  today: Date;
}

export const AdBanner = ({ adsRaw, group, today }: AdBannerProps) => {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [imageReady, setImageReady] = useState(false);

  const ad = useMemo(
    () => pickAdForGroup(adsRaw, group, today, hiddenIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adsRaw, group, hiddenIds]
  );

  useEffect(() => {
    if (!ad?.image) {
      setImageReady(false);
      return;
    }

    let cancelled = false;
    setImageReady(false);

    const img = new Image();
    img.decoding = 'async';

    const done = () => {
      if (!cancelled) setImageReady(true);
    };

    img.addEventListener('load', done);
    img.addEventListener('error', done);
    img.src = ad.image;
    if (img.complete) done();

    return () => {
      cancelled = true;
      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
    };
  }, [ad?.image]);

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!ad) return;
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.add(ad.id);
        return next;
      });
    },
    [ad]
  );

  const handleClick = useCallback(() => {
    if (!ad?.link) return;
    openExternal(ad.link);
  }, [ad]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!ad?.link) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openExternal(ad.link);
      }
    },
    [ad]
  );

  const hasLink = Boolean(ad?.link);
  const visible = Boolean(ad) && imageReady;

  return (
    <AnimatePresence initial={false}>
      {visible && ad && (
        <motion.div
          key={ad.id}
          className="ad-banner"
          initial={{ opacity: 0, y: -8, maxHeight: 0 }}
          animate={{ opacity: 1, y: 0, maxHeight: 200 }}
          exit={{ opacity: 0, y: -8, maxHeight: 0 }}
          transition={SPRING}
          onClick={hasLink ? handleClick : undefined}
          onKeyDown={hasLink ? handleKeyDown : undefined}
          role={hasLink ? 'link' : undefined}
          tabIndex={hasLink ? 0 : undefined}
          title={ad.caption || undefined}
          style={{ cursor: hasLink ? 'pointer' : 'default' }}
        >
          <div className="ad-banner__inner">
            <img
              className="ad-banner__image"
              src={ad.image}
              alt={ad.caption || 'Объявление'}
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <button
              type="button"
              className="ad-banner__close"
              onClick={handleDismiss}
              aria-label="Скрыть объявление"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};