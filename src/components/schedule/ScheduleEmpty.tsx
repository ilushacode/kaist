import { memo } from 'react';

const EMPTY_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.png`;

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
  if (onRetry) {
    return (
      <div className="schedule--centered">
        <img
          src={EMPTY_IMAGE_SRC}
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
        <div className="schedule-empty__illustration">
          <img
            src={EMPTY_IMAGE_SRC}
            alt="Гусь спит"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="schedule-empty__image"
          />
        </div>
      </div>

      <div className="schedule-empty__bubble">{subtitle}</div>
    </div>
  );
});