import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { collectTeachers } from '../utils/teachers';
import { capitalizeName } from '../utils/string';
import { useModal } from '../providers/ModalProvider';
import TeacherModal from '../modals/TeacherModal';
import Loader from './LoaderComponent';
import '../styles/Teachers.css';

const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 } as const;
const CASCADE_STEP = 0.04;

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const secondPart = parts[1] ?? '';
  const second = secondPart.includes('.')
    ? secondPart.split('.')[0]?.[0] ?? ''
    : secondPart[0] ?? '';
  return (first + second).toUpperCase() || '?';
}

export const TeachersComponent = () => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const scheduleGroups = useStore((s) => s.scheduleGroups);
  const examsGroups = useStore((s) => s.examsGroups);
  const scheduleError = useStore((s) => s.scheduleError);
  const scheduleLoading = useStore((s) => s.scheduleLoading);
  const retryBootstrap = useStore((s) => s.retryBootstrap);
  const { openModal } = useModal();

  const teachers = useMemo(
    () => collectTeachers(selectedGroup, scheduleGroups, examsGroups),
    [selectedGroup, scheduleGroups, examsGroups]
  );

  const handleOpenTeacher = (teacher: string) => {
    openModal(TeacherModal, { teacher });
  };

  if (scheduleLoading && teachers.length === 0) {
    return (
      <div className="teachers__centred">
        <Loader color={'#a8bcdd'} stroke={3} />
      </div>
    );
  }

  if (scheduleError && teachers.length === 0) {
    return (
      <div className="teachers__centred">
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

  if (teachers.length === 0) {
    return (
      <div className="teachers__centred">
        <p className="teachers__empty">Нет результатов</p>
      </div>
    );
  }

  return (
    <div className="teachers">
      {teachers.map((item, i) => (
        <motion.article
          key={item.teacher}
          className="teachers__item teachers__item--clickable"
          role="button"
          tabIndex={0}
          onClick={() => handleOpenTeacher(item.teacher)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenTeacher(item.teacher);
            }
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.985 }}
          transition={{ ...SPRING, delay: i * CASCADE_STEP }}
        >
          <div className="teachers__avatar" aria-hidden="true">
            {getInitials(item.teacher)}
          </div>
          <div className="teachers__body">
            <h3 className="teachers__name">{capitalizeName(item.teacher)}</h3>
            {item.departments.length > 0 && (
              <p className="teachers__department">
                {item.departments.join(' · ')}
              </p>
            )}
            {item.subjects.length > 0 && (
              <p className="teachers__subjects">{item.subjects.join(' · ')}</p>
            )}
          </div>
          <span className="teachers__chevron" aria-hidden="true">
            <ChevronRight size={16} strokeWidth={2.2} />
          </span>
        </motion.article>
      ))}
    </div>
  );
};