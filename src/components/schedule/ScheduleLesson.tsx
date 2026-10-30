import { useEffect, useReducer } from 'react';
import { School } from 'lucide-react';
import {
  addMinutes,
  isLessonNow,
  isLessonPast,
  stripLeadingZero,
  type LessonGap,
} from '../../utils/date';
import { formatBuilding } from '../../utils/string';
import { getLessonTypeLabel } from '../../utils/lesson';
import { useModal } from '../../providers/ModalProvider';
import LessonModal from '../../modals/LessonModal';
import type { Lesson } from '../../types';

const TICK_INTERVAL_MS = 60_000;
const LESSON_DURATION_MIN = 90;

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

const formatDuration = (minutes: number, isWindow: boolean): string => {
  if (!isWindow) {
    return formatMinutes(minutes);
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return formatMinutes(m);
  const hWord =
    h % 10 === 1 && h % 100 !== 11
      ? 'час'
      : h % 10 >= 2 && h % 10 <= 4 && (h % 100 < 10 || h % 100 >= 20)
        ? 'часа'
        : 'часов';
  if (m === 0) return `${h} ${hWord}`;
  return `${h} ${hWord} ${formatMinutes(m)}`;
};

interface ScheduleLessonProps {
  lessons: Lesson[];
  date: Date;
  gap?: LessonGap;
}

export const ScheduleLesson = ({ lessons, date, gap }: ScheduleLessonProps) => {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const { openModal } = useModal();

  useEffect(() => {
    const id = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const start = lessons[0].time;
  const end = addMinutes(start, LESSON_DURATION_MIN);

  const isActive = isLessonNow(date, start, end);
  const isFinished = isLessonPast(date, end);

  const isGroup = lessons.length > 1;

  const contentClass = [
    'schedule_lesson__content',
    isActive && 'schedule_lesson__active',
    isFinished && 'schedule_lesson__past',
  ]
    .filter(Boolean)
    .join(' ');

  const handleLessonClick = (lesson: Lesson) => {
    openModal(LessonModal, { lesson, date });
  };

  return (
    <div className={`schedule_lesson ${isGroup ? 'schedule_lesson--group' : ''}`}>
      <div className="schedule_lesson__times">
        <p className="schedule_lesson__times__start">{stripLeadingZero(start)}</p>
        <p className="schedule_lesson__times__end">{end}</p>
      </div>

      <div className="schedule_lesson__line">
        <div className="schedule_lesson__line__dot">
          <div
            className="schedule_lesson__line__dot__inner"
            style={{ display: isActive ? 'block' : 'none' }}
          />
        </div>
        <div className="schedule_lesson__line__line" />
      </div>

      <div className="schedule_lesson__content__wrapper">
        <div className={`schedule_lesson__grid ${isGroup ? 'schedule_lesson__grid--group' : ''}`}>
          {lessons.map((lesson, i) => (
            <div
              key={`${lesson.subject}-${lesson.room}-${i}`}
              className={contentClass}
              onClick={() => handleLessonClick(lesson)}
            >
              <span className="schedule_lesson__content__type">
                {getLessonTypeLabel(lesson.type)}
              </span>
              <h3 className="schedule_lesson__content__title">{lesson.subject}</h3>
              <div className="schedule_lesson__content__meta">
                <span className="schedule_lesson__content__meta__icon">
                  <School size={14} strokeWidth={1.6} />
                </span>
                <span className="schedule_lesson__content__meta__text">
                  {formatBuilding(lesson.building)} — {lesson.room}
                </span>
              </div>
            </div>
          ))}
        </div>

        {gap && (
          <div className={`schedule_lesson__break ${gap.kind === 'window' ? 'schedule_lesson__break--window' : ''}`}>
            <span className="schedule_lesson__break__label">
              {gap.kind === 'window' ? 'Окно' : 'Перемена'} — {formatDuration(gap.minutes, gap.kind === 'window')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};