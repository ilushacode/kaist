import { memo, useEffect, useRef, useState } from 'react';

const SLEEP_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.png`;
const AWAKE_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_awake.png`;

const AWAKE_DURATION_MS = 2000;
const COOLDOWN_MS = 3000;

interface ScheduleEmptyProps {
  title: string;
  subtitle: string;
  onRetry?: () => void;
}

export const ScheduleEmpty = memo(function ScheduleEmpty({
  title,
  subtitle,
  onRetry,
}: ScheduleEmptyProps) {
  const [isAwake, setIsAwake] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const awakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (awakeTimerRef.current) clearTimeout(awakeTimerRef.current);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const handleGooseClick = () => {
    if (onRetry) return;
    if (isLocked || isAwake) return;

    setIsAwake(true);
    setIsLocked(true);

    if (awakeTimerRef.current) clearTimeout(awakeTimerRef.current);
    awakeTimerRef.current = setTimeout(() => {
      setIsAwake(false);
    }, AWAKE_DURATION_MS);

    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      setIsLocked(false);
    }, AWAKE_DURATION_MS + COOLDOWN_MS);
  };

  if (onRetry) {
    return (
      <div className="schedule--centered">
        <img
          src={SLEEP_IMAGE_SRC}
          alt="Гусь спит"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="schedule__empty-image"
        />
        <p className="schedule__empty-title">{title}</p>
        <p className="schedule__empty-subtitle">{subtitle}</p>
        <button type="button" className="schedule__retry" onClick={onRetry}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="schedule-empty">
      <h2 className="schedule-empty__title">{title}</h2>

      <div className="schedule-empty__illustration-wrap">
        <div
          className={
            'schedule-empty__illustration' +
            (isAwake ? ' schedule-empty__illustration--awake' : '') +
            (isLocked ? ' schedule-empty__illustration--locked' : '')
          }
          onClick={handleGooseClick}
          role="button"
          tabIndex={0}
          aria-label={isAwake ? 'Гусь проснулся' : 'Разбудить гуся'}
          aria-disabled={isLocked}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleGooseClick();
            }
          }}
        >
          <img
            src={SLEEP_IMAGE_SRC}
            alt="Гусь спит"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={
              'schedule-empty__image schedule-empty__image--sleep' +
              (isAwake ? ' schedule-empty__image--hidden' : '')
            }
            draggable={false}
          />
          <img
            src={AWAKE_IMAGE_SRC}
            alt="Гусь проснулся"
            loading="eager"
            decoding="async"
            className={
              'schedule-empty__image schedule-empty__image--awake' +
              (isAwake ? ' schedule-empty__image--visible' : '')
            }
            draggable={false}
          />
        </div>
      </div>

      <div className="schedule-empty__bubble">{subtitle}</div>
    </div>
  );
});