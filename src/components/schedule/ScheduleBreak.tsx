import { memo } from 'react';
import type { LessonGap } from '../../utils/date';

interface ScheduleBreakProps {
  gap: LessonGap;
}

const formatMinutes = (minutes: number): string => {
  const n = Math.max(0, Math.round(minutes));
  const word =
    n % 10 === 1 && n % 100 !== 11
      ? 'минута'
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
        ? 'минуты'
        : 'минут';
  return `${n} ${word}`;
};

/**
 * Разделитель между парами.
 *
 * По горизонтали повторяет сетку карточки пары: слева — пустая колонка
 * шириной с колонку времени, затем вертикальная линия (продолжение
 * таймлайна), справа — текст по центру свободного пространства.
 * Вертикально текст стоит по центру блока.
 */
export const ScheduleBreak = memo(function ScheduleBreak({
  gap,
}: ScheduleBreakProps) {
  const label = gap.kind === 'window' ? 'Окно' : 'Перемена';
  const modifier =
    gap.kind === 'window' ? 'schedule_break--window' : 'schedule_break--break';

  return (
    <div className={`schedule_break ${modifier}`} role="separator">
      {/* Левая колонка — пустая, шириной с время пары */}
      <div className="schedule_break__times" aria-hidden="true" />

      {/* Центральная колонка — продолжение таймлайна */}
      <div className="schedule_break__line" aria-hidden="true">
        <div className="schedule_break__line__line" />
      </div>

      {/* Правая колонка — сам текст */}
      <div className="schedule_break__content">
        <span className="schedule_break__label">
          {label} — {formatMinutes(gap.minutes)}
        </span>
      </div>
    </div>
  );
});