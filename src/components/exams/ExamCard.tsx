import { memo } from 'react';
import { motion } from 'motion/react';
import { Calendar, GraduationCap, School } from 'lucide-react';
import { capitalizeName, formatBuilding } from '../../utils/string';
import { compareDay, formatDayMonth, stripLeadingZero } from '../../utils/date';
import { SPRING_DEFAULT } from '../../animations/presets';
import { TeacherLink } from '../TeacherLink';
import type { Exam } from '../../types';

const CASCADE_STEP = 0.05;

interface ExamCardProps {
  exam: Exam;
  index: number;
}

const EXAM_DATE = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/;
const START_TIME = /^(?:[01]?\d|2[0-3]):[0-5]\d(?!\d)/;

function getExamDate(value: string) {
  const match = value.match(EXAM_DATE);
  if (!match) return { label: value, status: null };

  const [, day, month, year] = match;
  const today = new Date();
  const date = new Date(Number(year ?? today.getFullYear()), Number(month) - 1, Number(day));
  if (date.getDate() !== Number(day) || date.getMonth() + 1 !== Number(month)) {
    return { label: value, status: null };
  }

  const dayMonth = formatDayMonth(date);
  return { label: year ? `${dayMonth} ${year}` : dayMonth, status: compareDay(date, today) };
}

export const ExamCard = memo(function ExamCard({ exam, index }: ExamCardProps) {
  const startTime = exam.time.trim().match(START_TIME)?.[0];

  return (
    <motion.article
      className="exams__item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_DEFAULT, delay: index * CASCADE_STEP }}
    >
      {(exam.dates.length > 0 || startTime) && (
        <header className="exams__header">
          <Calendar size={14} strokeWidth={2} aria-hidden="true" />
          <div className="exams__datetime">
            {exam.dates.map((value, di) => {
              const { label, status } = getExamDate(value);

              return (
                <span
                  key={`d-${di}`}
                  className={[
                    'exams__date',
                    status === -1 && 'exams__date--past',
                    status === 0 && 'exams__date--today',
                  ].filter(Boolean).join(' ')}
                >
                  {label}
                  {di < exam.dates.length - 1 ? ',' : ''}
                </span>
              );
            })}
            {startTime && (
              <span className="exams__time">
                {exam.dates.length > 0 && <span aria-hidden="true">{' · '}</span>}
                {stripLeadingZero(startTime)}
              </span>
            )}
          </div>
        </header>
      )}

      <h3 className="exams__title">{exam.subject}</h3>

      <div className="exams__meta">
        {exam.teacher && (
          <span className="exams__meta__row">
            <GraduationCap size={14} strokeWidth={1.6} />
            <TeacherLink
              teacher={exam.teacher}
              display={capitalizeName(exam.teacher)}
              className="exams__meta__text"
            />
          </span>
        )}

        {(exam.building || exam.room) && (
          <span className="exams__meta__row">
            <School size={14} strokeWidth={1.6} />
            <span className="exams__meta__text">
              {exam.building ? formatBuilding(exam.building) : ''}
              {exam.building && exam.room ? ' — ' : ''}
              {exam.room}
            </span>
          </span>
        )}
      </div>
    </motion.article>
  );
});
