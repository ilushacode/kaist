import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DAY_LIST_GAP,
  DAY_LIST_EDGE_PADDING,
  DAY_NAMES,
} from '../schedule/constants';
import { compareDay, getMondayOfWeek, shiftDate } from '../../utils/date';

const DESKTOP_QUERY = '(min-width: 900px)';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(DESKTOP_QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

function getSemesterRange(today: Date): { start: Date; end: Date } {
  const year = today.getFullYear();
  const autumnStart = new Date(year, 8, 1);
  const autumnEnd = new Date(year, 11, 31);
  if (compareDay(today, autumnEnd) <= 0) {
    return { start: autumnStart, end: autumnEnd };
  }
  const springStart = new Date(year + 1, 1, 1);
  const springEnd = new Date(year + 1, 4, 31);
  return { start: springStart, end: springEnd };
}

function buildWeeks(start: Date, end: Date): Date[][] {
  const firstMonday = getMondayOfWeek(start);
  const weeks: Date[][] = [];
  const cursor = new Date(firstMonday);
  cursor.setHours(0, 0, 0, 0);

  while (compareDay(cursor, end) <= 0) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor);
      date.setDate(cursor.getDate() + d);
      date.setHours(0, 0, 0, 0);
      if (compareDay(date, start) >= 0 && compareDay(date, end) <= 0) {
        week.push(date);
      }
    }
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

interface TeacherDayListProps {
  today: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  /** Возвращает true, если в указанный день у препода есть пары. */
  isBusyDay: (date: Date) => boolean;
}

export const TeacherDayList = ({
  today,
  selectedDate,
  setSelectedDate,
  isBusyDay,
}: TeacherDayListProps) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useIsDesktop();

  const weeks = useMemo(() => {
    const { start, end } = getSemesterRange(today);
    return buildWeeks(start, end);
  }, [today]);

  // Неделя, которую сейчас видно в полосе. Используется только для стрелок -
  // сам selectedDate при ручной прокрутке не меняется.
  const [visibleMonday, setVisibleMonday] = useState<Date>(() =>
    getMondayOfWeek(selectedDate)
  );

  // Флаг: идёт программный скролл. Пока он активен, не обновляем visibleMonday
  // из события scroll - оно может «промежуточно» указывать на соседние недели.
  const isProgrammaticScrollRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: weeks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => parentRef.current?.clientWidth ?? 320,
    horizontal: true,
    overscan: 3,
    getItemKey: (index) => weeks[index]?.[0]?.toISOString() ?? index,
  });

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => virtualizer.measure());
    const ro = new ResizeObserver(() => virtualizer.measure());
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [virtualizer]);

  // Программный скролл полосы к неделе выбранного дня.
  useEffect(() => {
    if (!selectedDate || weeks.length === 0) return;
    const targetMonday = getMondayOfWeek(selectedDate);
    const weekIndex = weeks.findIndex((week) =>
      week.some((date) => compareDay(date, targetMonday) === 0)
    );
    if (weekIndex < 0) return;

    const el = parentRef.current;
    const prevSnap = el?.style.scrollSnapType;
    if (el) el.style.scrollSnapType = 'none';

    isProgrammaticScrollRef.current = true;
    virtualizer.scrollToIndex(weekIndex, { align: 'start' });
    setVisibleMonday(targetMonday);

    const release = () => {
      if (el) el.style.scrollSnapType = prevSnap || 'x mandatory';
      isProgrammaticScrollRef.current = false;
    };
    const timeout = setTimeout(release, 400);
    return () => {
      clearTimeout(timeout);
      release();
    };
  }, [selectedDate, weeks, virtualizer]);

  // Отслеживаем видимую неделю по скроллу — только чтобы стрелки работали
  // относительно того, что видит пользователь.
  useEffect(() => {
    const el = parentRef.current;
    if (!el || weeks.length === 0) return;

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const updateVisible = () => {
      if (isProgrammaticScrollRef.current) return;
      const weekWidth = el.clientWidth;
      if (weekWidth <= 0) return;
      const weekIndex = Math.round(el.scrollLeft / weekWidth);
      const week = weeks[weekIndex];
      if (!week || week.length === 0) return;
      const monday = week[0];
      if (compareDay(monday, visibleMonday) !== 0) {
        setVisibleMonday(monday);
      }
    };

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateVisible, 100);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [weeks, visibleMonday]);

  // Стрелки работают относительно ВИДИМОЙ недели
  const canPrev = useMemo(() => {
    if (weeks.length === 0) return false;
    const firstMonday = weeks[0][0];
    if (!firstMonday) return false;
    return compareDay(visibleMonday, firstMonday) > 0;
  }, [weeks, visibleMonday]);

  const canNext = useMemo(() => {
    if (weeks.length === 0) return false;
    const lastWeek = weeks[weeks.length - 1];
    const lastMonday = lastWeek[0];
    if (!lastMonday) return false;
    return compareDay(visibleMonday, lastMonday) < 0;
  }, [weeks, visibleMonday]);

  // Сдвигаем selectedDate на неделю, но день недели сохраняем.
  const handlePrev = () => {
    if (!canPrev) return;
    setSelectedDate(shiftDate(selectedDate, -7));
  };

  const handleNext = () => {
    if (!canNext) return;
    setSelectedDate(shiftDate(selectedDate, 7));
  };

  const showNav = isDesktop && weeks.length > 1;

  return (
    <div className={'day_list-wrapper' + (showNav ? ' day_list-wrapper--with-nav' : '')}>
      {showNav && (
        <button
          type="button"
          className="day_list__nav day_list__nav--prev"
          onClick={handlePrev}
          disabled={!canPrev}
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>
      )}

      <div
        className="day_list"
        ref={parentRef}
        style={{
          height: '60px',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          boxSizing: 'border-box',
          scrollbarWidth: 'none',
          touchAction: 'pan-x',
          scrollSnapType: 'x mandatory',
        }}
      >
        <div
          style={{
            width: `${virtualizer.getTotalSize()}px`,
            height: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const week = weeks[virtualItem.index];
            if (!week) return null;
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${virtualItem.size}px`,
                  height: '100%',
                  transform: `translateX(${virtualItem.start}px)`,
                  boxSizing: 'border-box',
                  padding: `0 ${DAY_LIST_EDGE_PADDING}px`,
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: `${DAY_LIST_GAP}px`,
                    height: '100%',
                  }}
                >
                  {week.map((date) => (
                    <TeacherDayCell
                      key={date.toISOString()}
                      date={date}
                      selectedDate={selectedDate}
                      today={today}
                      onSelect={setSelectedDate}
                      isBusy={isBusyDay(date)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showNav && (
        <button
          type="button"
          className="day_list__nav day_list__nav--next"
          onClick={handleNext}
          disabled={!canNext}
          aria-label="Следующая неделя"
        >
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};

interface TeacherDayCellProps {
  date: Date;
  selectedDate: Date;
  today: Date;
  onSelect: (date: Date) => void;
  isBusy: boolean;
}

function TeacherDayCell({
  date,
  selectedDate,
  today,
  onSelect,
  isBusy,
}: TeacherDayCellProps) {
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
      <span
        className={
          'day_list__item__busy-mark' +
          (isBusy ? ' day_list__item__busy-mark--visible' : '')
        }
        aria-hidden="true"
      />
    </div>
  );
}