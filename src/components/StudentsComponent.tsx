import { Star } from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import Loader from './LoaderComponent';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import '../styles/Students.css';

const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;

export const StudentsComponent = () => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const studentsGroups = useStore((s) => s.studentsGroups);
  const studentsError = useStore((s) => s.studentsError);
  const studentsLoading = useStore((s) => s.studentsLoading);
  const retryBootstrap = useStore((s) => s.retryBootstrap);

  usePrefetchImage(ERROR_IMAGE_SRC);

  const students = useMemo(() => {
    if (!selectedGroup) return [];
    return studentsGroups[selectedGroup] ?? [];
  }, [studentsGroups, selectedGroup]);

  if (studentsLoading && students.length === 0 && !studentsError) {
    return (
      <div className="students__centred">
        <Loader color={'#a8bcdd'} stroke={3} />
      </div>
    );
  }

  if (studentsError && students.length === 0) {
    return (
      <div className="students__centred">
        <img
          src={ERROR_IMAGE_SRC}
          alt="Гусь спит"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="schedule__empty-image"
        />
        <p className="schedule__empty-title">Произошла ошибка</p>
        <p className="schedule__empty-subtitle">
          Проверьте соединение или попробуйте позже
        </p>
        <button type="button" className="teachers__retry" onClick={retryBootstrap}>
          Повторить
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="students__centred">
        <p className="students__empty">Нет результатов</p>
      </div>
    );
  }

  return (
    <div className="students">
      {students.map((student, i) => (
        <div className="students__item" key={student.student_id ?? i}>
          <div className="students__item__left">
            <p className="students__item__left__num">{i + 1}.</p>
          </div>
          <div className="students__item__content">
            <p className="students__item__content__name">{student.student}</p>
          </div>
          <div className="students__item__right">
            {student.leader && <Star strokeWidth={3} />}
          </div>
        </div>
      ))}
    </div>
  );
};