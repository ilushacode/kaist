import { useMemo } from 'react';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { addMinutes, isPastDay, isTodayDay, stripLeadingZero } from '../utils/date';
import { capitalizeName, formatBuilding } from '../utils/string';
import { getLessonTypeLabel } from '../utils/lesson';
import { getLessonGroups } from '../utils/schedule';
import { useStore } from '../hooks/useStore';
import { TeacherLink } from '../components/TeacherLink';
import type { Lesson } from '../types';
import '../styles/LessonModal.css';

const LESSON_DURATION_MIN = 90;

interface LessonModalProps {
  lesson: Lesson;
}

export default function LessonModal({ lesson }: LessonModalProps) {
  const dates = Array.isArray(lesson.dates) ? lesson.dates : [];
  const scheduleGroups = useStore((s) => s.scheduleGroups);
  const selectedGroup = useStore((s) => s.selectedGroup);

  const flowGroups = useMemo(() => {
    return getLessonGroups(scheduleGroups, lesson);
  }, [scheduleGroups, lesson]);

  const showGroups = flowGroups.length > 1;

  return (
    <div className="lesson_modal">
      <header className="lesson_modal__header">
        <span className="lesson_modal__type">{getLessonTypeLabel(lesson.type)}</span>
        <h2 className="lesson_modal__title">{lesson.subject}</h2>
        <div className="lesson_modal__meta">
          <span className="lesson_modal__meta__time">
            {stripLeadingZero(lesson.time)} — {addMinutes(lesson.time, LESSON_DURATION_MIN)}
          </span>
          <span className="lesson_modal__meta__sep" aria-hidden="true" />
          <span className="lesson_modal__meta__place">
            {formatBuilding(lesson.building)} · {lesson.room}
          </span>
        </div>

        {/* ─── ДЕЛИКАТНЫЙ БЛОК С ГРУППАМИ ─── */}
        {showGroups && (
          <div className="lesson_modal__groups">
            {flowGroups.map((group) => (
              <span
                key={group}
                className={
                  'lesson_modal__group-chip' +
                  (group === selectedGroup ? ' lesson_modal__group-chip--active' : '')
                }
              >
                {group}
              </span>
            ))}
          </div>
        )}
      </header>

      {dates.length > 0 && (
        <section className="lesson_modal__section">
          <h3 className="lesson_modal__section__label">Даты занятий</h3>
          <div className="lesson_modal__dates">
            {dates.map((date, i) => (
              <span
                key={`dates_${i}`}
                className={[
                  'lesson_modal__date',
                  isPastDay(date) && 'lesson_modal__date--past',
                  isTodayDay(date) && 'lesson_modal__date--today',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="lesson_modal__section">
        <h3 className="lesson_modal__section__label">Преподаватель</h3>
        <div className="lesson_modal__teacher">
          <GraduationCap size={20} strokeWidth={1.6} className="lesson_modal__teacher__icon" />
          <TeacherLink
            teacher={lesson.teacher}
            className="lesson_modal__teacher__name"
          >
            <span className="lesson_modal__teacher__name__text">
              {capitalizeName(lesson.teacher)}
            </span>
            <ChevronRight
              size={16}
              strokeWidth={2.2}
              className="lesson_modal__teacher__chevron"
              aria-hidden="true"
            />
          </TeacherLink>
        </div>
      </section>
    </div>
  );
}