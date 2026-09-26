import { useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { getExamsForGroup } from '../utils/exams';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import Loader from './LoaderComponent';
import { ExamCard } from './exams/ExamCard';
import { ExamEmpty } from './exams/ExamEmpty';
import '../styles/Exams.css';

const EMPTY_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.png`;
const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;

export const ExamsComponent = () => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const examsGroups = useStore((s) => s.examsGroups);
  const scheduleError = useStore((s) => s.scheduleError);
  const scheduleLoading = useStore((s) => s.scheduleLoading);
  const retryBootstrap = useStore((s) => s.retryBootstrap);

  usePrefetchImage(EMPTY_IMAGE_SRC);
  usePrefetchImage(ERROR_IMAGE_SRC);

  const exams = useMemo(
    () => getExamsForGroup(examsGroups, selectedGroup),
    [examsGroups, selectedGroup]
  );

  if (scheduleLoading && exams.length === 0 && !scheduleError) {
    return (
      <div className="exams__centred">
        <Loader color={'#a8bcdd'} stroke={3} />
      </div>
    );
  }

  if (scheduleError && exams.length === 0) {
    return (
      <ExamEmpty
        title="Произошла ошибка"
        subtitle="Проверьте соединение или попробуйте позже"
        imageSrc={ERROR_IMAGE_SRC}
        onRetry={retryBootstrap}
      />
    );
  }

  if (exams.length === 0) {
    return (
      <ExamEmpty
        title="Экзаменов пока нет"
        subtitle="Отдыхай, пока можешь"
        imageSrc={EMPTY_IMAGE_SRC}
      />
    );
  }

  return (
    <div className="exams">
      {exams.map((exam, i) => (
        <ExamCard key={`${exam.subject}-${exam.time}-${i}`} exam={exam} index={i} />
      ))}
    </div>
  );
};