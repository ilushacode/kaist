import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Users } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import {
  collectAllTeachers,
  collectTeachers,
  searchTeachers,
} from '../utils/teachers';
import { capitalizeName } from '../utils/string';
import { useModal } from '../providers/ModalProvider';
import TeacherModal from '../modals/TeacherModal';
import Loader from './LoaderComponent';
import { SearchToolbar } from './SearchToolbar';
import '../styles/Teachers.css';
import '../styles/SearchToolbar.css';

const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 } as const;
const CASCADE_STEP = 0.04;
const MAX_HINTS = 12;

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

  const allTeachers = useMemo(
    () => collectAllTeachers(scheduleGroups, examsGroups),
    [scheduleGroups, examsGroups]
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!searchOpen) setQuery('');
  }, [searchOpen]);

  const handleOpenTeacher = (teacher: string) => {
    openModal(TeacherModal, { teacher });
  };

  const suggestions = useMemo(
    () => searchTeachers(allTeachers, query, MAX_HINTS),
    [allTeachers, query]
  );

  const trimmedQuery = query.trim();
  const isSearching = searchOpen && trimmedQuery.length > 0;
  const showGroupList = !isSearching;
  const showEmpty = !isSearching && teachers.length === 0;

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

  const toolbarLabel = teachers.length > 0
    ? `В группе ${selectedGroup ?? '—'}`
    : 'Все преподаватели';

  const renderGroupRow = (
    item: { teacher: string; departments: string[]; subjects: string[] },
    index: number
  ) => (
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
      transition={{ ...SPRING, delay: index * CASCADE_STEP }}
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
  );

  return (
    <div className="teachers">
      <SearchToolbar
        label={toolbarLabel}
        placeholder="Имя преподавателя или группа"
        query={query}
        onQueryChange={setQuery}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />

      <div className="teachers__list">
        <AnimatePresence initial={false} mode="popLayout">
          {showGroupList && teachers.length > 0 && (
            <motion.div
              key="group-list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {teachers.map((item, i) => renderGroupRow(item, i))}
            </motion.div>
          )}

          {showEmpty && (
            <motion.div
              key="group-empty"
              className="teachers__centred teachers__centred--inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <p className="teachers__empty">Нет результатов</p>
              <p className="teachers__hint">
                Попробуйте найти преподавателя через поиск выше
              </p>
            </motion.div>
          )}

          {isSearching && (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {suggestions.length === 0 ? (
                <div className="teachers__search-empty-block">
                  <p className="teachers__search-empty">Ничего не найдено</p>
                  <p className="teachers__search-empty-hint">
                    Попробуйте другое написание имени или номер группы
                  </p>
                </div>
              ) : (
                <div className="teachers__search-results">
                  {suggestions.map((item) => (
                    <button
                      key={item.teacher}
                      type="button"
                      className="teachers__search-result"
                      onClick={() => handleOpenTeacher(item.teacher)}
                    >
                      <div
                        className="teachers__search-result__avatar"
                        aria-hidden="true"
                      >
                        {getInitials(item.teacher)}
                      </div>
                      <div className="teachers__search-result__body">
                        <span className="teachers__search-result__name">
                          {capitalizeName(item.teacher)}
                        </span>
                        {(item.groups.length > 0 ||
                          item.departments.length > 0 ||
                          item.subjects.length > 0) && (
                          <span className="teachers__search-result__meta">
                            {item.groups.length > 0 && (
                              <span className="teachers__search-result__groups">
                                <Users size={11} strokeWidth={2.4} />
                                {item.groups.join(', ')}
                              </span>
                            )}
                            {(item.departments.length > 0 ||
                              item.subjects.length > 0) && (
                              <span className="teachers__search-result__extra">
                                {item.departments.join(' · ') ||
                                  item.subjects.join(' · ')}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <span
                        className="teachers__search-result__chevron"
                        aria-hidden="true"
                      >
                        <ChevronRight size={16} strokeWidth={2.2} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};