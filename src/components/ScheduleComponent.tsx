import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSwipeable } from 'react-swipeable';
import { ScheduleLesson } from './schedule/ScheduleLesson';
import { ScheduleEmpty } from './schedule/ScheduleEmpty';
import { AdBanner } from './schedule/AdBanner';
import { useStore } from '../hooks/useStore';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import { getLessonsForDate } from '../utils/schedule';
import { formatDM, getLessonGaps, shiftDate } from '../utils/date';
import { EMPTY_SUBTITLES } from '../content/emptySubtitles';
import { slideVariants, slideTransition } from '../animations/variants';
import Loader from './LoaderComponent';
import type { Direction } from '../types';
import '../styles/Schedule.css';

const EMPTY_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.png`;

interface ScheduleComponentProps {
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
}

export const ScheduleComponent = ({ selectedDate, onDateChange }: ScheduleComponentProps) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const scheduleGroups = useStore((s) => s.scheduleGroups);
  const scheduleError = useStore((s) => s.scheduleError);
  const scheduleLoading = useStore((s) => s.scheduleLoading);
  const retryBootstrap = useStore((s) => s.retryBootstrap);
  const adsRaw = useStore((s) => s.adsRaw);

  const [direction, setDirection] = useState<Direction>(0);
  const [renderedDate, setRenderedDate] = useState<Date>(selectedDate);
  const [emptySubtitleIndex, setEmptySubtitleIndex] = useState(0);

  const lessons = useMemo(
    () => getLessonsForDate(scheduleGroups[selectedGroup ?? ''] ?? [], renderedDate),
    [scheduleGroups, selectedGroup, renderedDate]
  );

  // Промежутки между парами: перемена / окно.
  const gaps = useMemo(() => getLessonGaps(lessons), [lessons]);

  const gapByAfterIndex = useMemo(() => {
    const map = new Map<number, (typeof gaps)[number]>();
    for (const gap of gaps) map.set(gap.afterIndex, gap);
    return map;
  }, [gaps]);

  const prevDateRef = useRef(selectedDate);
  const swipeBlockRef = useRef(false);

  usePrefetchImage(EMPTY_IMAGE_SRC);

  useEffect(() => {
    const prev = new Date(prevDateRef.current);
    prev.setHours(0, 0, 0, 0);
    const next = new Date(selectedDate);
    next.setHours(0, 0, 0, 0);

    if (next.getTime() !== prev.getTime()) {
      setDirection(next > prev ? 1 : -1);
      setRenderedDate(selectedDate);
      prevDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  useEffect(() => {
    setEmptySubtitleIndex((prev) => {
      if (EMPTY_SUBTITLES.length <= 1) return prev;
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * EMPTY_SUBTITLES.length);
      }
      return next;
    });
  }, [renderedDate]);

  const animationKey = formatDM(renderedDate);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!onDateChange) return;
      swipeBlockRef.current = true;
      setTimeout(() => {
        swipeBlockRef.current = false;
      }, 400);
      onDateChange(shiftDate(renderedDate, 1));
    },
    onSwipedRight: () => {
      if (!onDateChange) return;
      swipeBlockRef.current = true;
      setTimeout(() => {
        swipeBlockRef.current = false;
      }, 400);
      onDateChange(shiftDate(renderedDate, -1));
    },
    delta: 50,
    swipeDuration: 700,
    trackMouse: true,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  const handleClickCapture = (e: React.MouseEvent) => {
    if (swipeBlockRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const content = useMemo(() => {
    if (scheduleLoading && lessons.length === 0 && !scheduleError) {
      return (
        <div className="schedule schedule--centered">
          <Loader color={'#a8bcdd'} stroke={3} />
        </div>
      );
    }

    if (scheduleError && lessons.length === 0) {
      return (
        <ScheduleEmpty
          title="Не удалось загрузить расписание"
          subtitle="Проверьте соединение и попробуйте позже"
          onRetry={retryBootstrap}
        />
      );
    }

    if (lessons.length === 0) {
      return (
        <ScheduleEmpty
          title="Сегодня нет пар"
          subtitle={EMPTY_SUBTITLES[emptySubtitleIndex]}
        />
      );
    }

    return (
      <div className="schedule">
        {lessons.map((lesson, i) => {
          const gap = gapByAfterIndex.get(i);
          return (
            <ScheduleLesson
              key={`${lesson.subject}-${lesson.time}-${i}`}
              date={renderedDate}
              lesson={lesson}
              gap={gap}
            />
          );
        })}
      </div>
    );
  }, [
    scheduleLoading,
    scheduleError,
    lessons,
    renderedDate,
    emptySubtitleIndex,
    retryBootstrap,
    gapByAfterIndex,
  ]);

  const adDate = useMemo(() => {
    const d = new Date(renderedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [renderedDate]);

  return (
    <div className="schedule-viewport-wrapper">
      <AdBanner adsRaw={adsRaw} group={selectedGroup} today={adDate} />

      <div
        className="schedule-viewport"
        {...swipeHandlers}
        onClickCapture={handleClickCapture}
      >
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={animationKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="schedule-page"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};