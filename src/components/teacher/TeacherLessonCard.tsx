import { School } from 'lucide-react';
import { formatBuilding } from '../../utils/string';
import { getLessonTypeLabel } from '../../utils/lesson';
import {
  addMinutes,
  isLessonNow,
  isLessonPast,
  stripLeadingZero,
} from '../../utils/date';
import type { CollapsedTeacherLesson } from '../../utils/teacherSchedule';
import '../../styles/TeacherLesson.css';

const LESSON_DURATION_MIN = 90;

interface TeacherLessonCardProps {
  item: CollapsedTeacherLesson;
  date?: Date;
  compact?: boolean;
}

export const TeacherLessonCard = ({
  item,
  date,
  compact = false,
}: TeacherLessonCardProps) => {
  const end = addMinutes(item.time, LESSON_DURATION_MIN);

  const isActive =
    !compact && date && !item.isExam
      ? isLessonNow(date, item.time, end)
      : false;

  const isPast =
    !compact && date && !item.isExam
      ? isLessonPast(date, end)
      : false;

  const className = [
    'teacher_lesson',
    compact && 'teacher_lesson--compact',
    isActive && 'teacher_lesson--active',
    isPast && 'teacher_lesson--past',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className}>
      <header className="teacher_lesson__header">
        <span className="teacher_lesson__time">
          {stripLeadingZero(item.time)}
        </span>
        {!compact && item.type && (
          <span className="teacher_lesson__type">
            {getLessonTypeLabel(item.type)}
          </span>
        )}
      </header>

      <h4 className="teacher_lesson__subject">{item.subject}</h4>

      <div className="teacher_lesson__meta">
        {(item.building || item.room) && (
          <span className="teacher_lesson__meta__row">
            <School size={13} strokeWidth={1.6} />
            <span className="teacher_lesson__meta__text">
              {item.building ? formatBuilding(item.building) : ''}
              {item.building && item.room ? ' — ' : ''}
              {item.room}
            </span>
          </span>
        )}
        {item.groups.length > 0 && (
          <span className="teacher_lesson__meta__row teacher_lesson__meta__row--groups">
            <span className="teacher_lesson__groups-label">Группы:</span>
            <span className="teacher_lesson__meta__text teacher_lesson__meta__text--groups">
              {item.groups.join(', ')}
            </span>
          </span>
        )}
        {compact && item.dates.length > 0 && (
          <span className="teacher_lesson__dates">
            {item.dates.map((d, i) => (
              <span key={i} className="teacher_lesson__date">
                {d}
              </span>
            ))}
          </span>
        )}
      </div>
    </article>
  );
};