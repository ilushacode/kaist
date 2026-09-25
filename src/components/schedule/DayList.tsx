import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayCell } from './DayCell';
import { DAY_LIST_GAP, DAY_LIST_EDGE_PADDING } from './constants';
import { compareDay, getMondayOfWeek } from '../../utils/date';

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

interface DayListProps {
  today: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
}

export const DayList = ({
  today,
  selectedDate,
  setSelectedDate,
  onPrevWeek,
  onNextWeek,
  canPrev = true,
  canNext = true,
}: DayListProps) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useIsDesktop();

  const weeks = useMemo(() => {
    const { start, end } = getSemesterRange(today);
    return buildWeeks(start, end);
  }, [today]);

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
    virtualizer.scrollToIndex(weekIndex, { align: 'start' });
    const restore = () => {
      if (el) el.style.scrollSnapType = prevSnap || 'x mandatory';
    };
    const timeout = setTimeout(restore, 350);
    return () => {
      clearTimeout(timeout);
      restore();
    };
  }, [selectedDate, weeks, virtualizer]);

  const showNav =
    isDesktop && Boolean(onPrevWeek && onNextWeek) && weeks.length > 1;

  return (
    <div className={'day_list-wrapper' + (showNav ? ' day_list-wrapper--with-nav' : '')}>
      {showNav && (
        <button
          type="button"
          className="day_list__nav day_list__nav--prev"
          onClick={onPrevWeek}
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
                    <DayCell
                      key={date.toISOString()}
                      date={date}
                      selectedDate={selectedDate}
                      today={today}
                      onSelect={setSelectedDate}
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
          onClick={onNextWeek}
          disabled={!canNext}
          aria-label="Следующая неделя"
        >
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};