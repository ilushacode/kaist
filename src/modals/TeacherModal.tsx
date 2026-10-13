import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpenText } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { capitalizeName } from '../utils/string';
import { formatDM } from '../utils/date';
import {
  buildTeacherLessons,
  getTeacherExams,
  getTeacherLessonsForDate,
  hasLessonsOnDate,
} from '../utils/teacherSchedule';
import { TeacherDayList } from '../components/teacher/TeacherDayList';
import { TeacherLessonCard } from '../components/teacher/TeacherLessonCard';
import Loader from '../components/LoaderComponent';
import { useSlideDirection } from '../hooks/useSlideDirection';
import { slideVariants, slideTransition } from '../animations/variants';
import '../styles/TeacherModal.css';

interface TeacherModalProps {
  teacher: string;
}

export default function TeacherModal({ teacher }: TeacherModalProps) {
  const scheduleGroups = useStore((s) => s.scheduleGroups);
  const examsGroups = useStore((s) => s.examsGroups);
  const scheduleLoading = useStore((s) => s.scheduleLoading);
  const scheduleError = useStore((s) => s.scheduleError);

  const refs = useMemo(
    () => buildTeacherLessons(teacher, scheduleGroups, examsGroups),
    [teacher, scheduleGroups, examsGroups]
  );

  const exams = useMemo(() => getTeacherExams(refs), [refs]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { renderedDate, direction } = useSlideDirection(selectedDate);

  const lessons = useMemo(
    () => getTeacherLessonsForDate(refs, renderedDate),
    [refs, renderedDate]
  );

  const isBusyDay = (date: Date) => hasLessonsOnDate(refs, date);

  const animationKey = formatDM(renderedDate);

  if (scheduleLoading && refs.length === 0 && !scheduleError) {
    return (
      <div className="teacher_modal">
        <div className="teacher_modal__centred">
          <Loader color={'#a8bcdd'} stroke={3} />
        </div>
      </div>
    );
  }

  const hasContent = lessons.length > 0 || exams.length > 0;

  return (
    <div className="teacher_modal">
      <header className="teacher_modal__header">
        <span className="teacher_modal__label">Преподаватель</span>
        <h2 className="teacher_modal__title">{capitalizeName(teacher)}</h2>
      </header>

      <TeacherDayList
        today={today}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isBusyDay={isBusyDay}
      />

      <div className="teacher_modal__viewport">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={animationKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="teacher_modal__slide"
          >
            {!hasContent ? (
              <div className="teacher_modal__empty">
                <p className="teacher_modal__empty__title">Свободный день</p>
                <p className="teacher_modal__empty__subtitle">
                  В этот день пар нет
                </p>
              </div>
            ) : (
              <div className="teacher_modal__list">
                {lessons.map((item, i) => (
                  <TeacherLessonCard key={i} item={item} date={renderedDate} />
                ))}

                {exams.length > 0 && (
                  <section className="teacher_modal__exams">
                    <h3 className="teacher_modal__exams__title">
                      <BookOpenText size={14} strokeWidth={2.2} />
                      Экзамены
                    </h3>
                    <div className="teacher_modal__exams__list">
                      {exams.map((item, i) => (
                        <TeacherLessonCard
                          key={`exam-${i}`}
                          item={item}
                          compact
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}