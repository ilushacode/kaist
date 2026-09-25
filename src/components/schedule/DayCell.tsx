import { memo } from 'react';
import { DAY_NAMES } from './constants';
import { compareDay } from '../../utils/date';

interface DayCellProps {
  date: Date;
  selectedDate: Date;
  today: Date;
  onSelect: (date: Date) => void;
}

export const DayCell = memo(function DayCell({
  date,
  selectedDate,
  today,
  onSelect,
}: DayCellProps) {
  const isSelected = selectedDate?.toDateString() === date.toDateString();
  const isPast = compareDay(date, today) < 0;

  const dayOfWeek = DAY_NAMES[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const className = [
    'day_list__item',
    isSelected && 'day_list__item__active',
    !isSelected && isPast && 'day_list__item__disabled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div onClick={() => onSelect(date)} className={className}>
      <span className="day_list__item__day">{dayOfWeek}</span>
      <span className="day_list__item__date">
        {day}
        <span>{month}</span>
      </span>
      <span className="day_list__item__dot" />
    </div>
  );
});