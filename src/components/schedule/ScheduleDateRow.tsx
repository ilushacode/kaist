import { formatDayMonth, formatISO, isEvenAcademicWeek, startOfDay } from '../../utils/date';

interface ScheduleDateRowProps {
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
}

export function ScheduleDateRow({ selectedDate, onDateChange }: ScheduleDateRowProps) {
  return (
    <div className="schedule-date-row">
      <button
        type="button"
        className="schedule-date-row__date"
        disabled={!onDateChange}
        title="Вернуться к сегодняшней дате"
        aria-label={`${formatDayMonth(selectedDate)}. Вернуться к сегодняшней дате`}
        onClick={() => onDateChange?.(startOfDay(new Date()))}
      >
        <time dateTime={formatISO(selectedDate)}>{formatDayMonth(selectedDate)}</time>
      </button>
      <span
        className="schedule-date-row__parity"
        aria-label={isEvenAcademicWeek(selectedDate) ? 'Чётная неделя' : 'Нечётная неделя'}
      >
        {isEvenAcademicWeek(selectedDate) ? 'чётная' : 'нечётная'}
      </span>
    </div>
  );
}
