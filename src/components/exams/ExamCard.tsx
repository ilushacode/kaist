import { memo } from 'react';
import { motion } from 'motion/react';
import { Calendar, GraduationCap, School } from 'lucide-react';
import { capitalizeName, formatBuilding } from '../../utils/string';
import { stripLeadingZero, isPastDay, isTodayDay } from '../../utils/date';
import { SPRING_DEFAULT } from '../../animations/presets';
import { TeacherLink } from '../TeacherLink';
import type { Exam } from '../../types';

const CASCADE_STEP = 0.05;

interface ExamCardProps {
  exam: Exam;
  index: number;
}

export const ExamCard = memo(function ExamCard({ exam, index }: ExamCardProps) {
  return (
    <motion.article
      className="exams__item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_DEFAULT, delay: index * CASCADE_STEP }}
    >
      <header className="exams__header">
        <span className="exams__time">
          <Calendar size={14} strokeWidth={2} />
          {stripLeadingZero(exam.time)}
        </span>

        {exam.dates.length > 0 && (
          <div className="exams__dates">
            {exam.dates.map((date, di) => (
              <span
                key={`d-${di}`}
                className={[
                  'exams__date',
                  isPastDay(date) && 'exams__date--past',
                  isTodayDay(date) && 'exams__date--today',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date}
              </span>
            ))}
          </div>
        )}
      </header>

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