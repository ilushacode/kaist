import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Star, Users } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import Loader from './LoaderComponent';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { SearchToolbar } from './SearchToolbar';
import {
  collectAllStudents,
  formatStudentsForClipboard,
  searchStudents,
} from '../utils/students';
import type { StudentEntry } from '../types';
import '../styles/Students.css';
import '../styles/SearchToolbar.css';

const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;
const MAX_SEARCH_RESULTS = 100;

/** Пружинка для смены иконки Copy ⇄ Check. */
const ICON_SPRING = {
  type: 'spring',
  stiffness: 600,
  damping: 30,
  mass: 0.5,
} as const;

interface CopyIconProps {
  copied: boolean;
}

/**
 * Круглая подложка с иконкой копирования.
 * В обычном состоянии — Copy на accent-подложке.
 * При копировании — Check на primary-подложке, с пружинной анимацией.
 */
const CopyIcon = ({ copied }: CopyIconProps) => (
  <span
    className={
      'students__copy-btn' + (copied ? ' students__copy-btn--copied' : '')
    }
    aria-hidden="true"
  >
    <AnimatePresence initial={false} mode="wait">
      {copied ? (
        <motion.span
          key="check"
          className="students__copy-btn__glyph"
          initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0, rotate: 45 }}
          transition={ICON_SPRING}
        >
          <Check size={16} strokeWidth={3} />
        </motion.span>
      ) : (
        <motion.span
          key="copy"
          className="students__copy-btn__glyph"
          initial={{ scale: 0.4, opacity: 0, rotate: 45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0, rotate: -45 }}
          transition={ICON_SPRING}
        >
          <Copy size={15} strokeWidth={2.2} />
        </motion.span>
      )}
    </AnimatePresence>
  </span>
);

export const StudentsComponent = () => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const studentsGroups = useStore((s) => s.studentsGroups);
  const studentsError = useStore((s) => s.studentsError);
  const studentsLoading = useStore((s) => s.studentsLoading);
  const retryBootstrap = useStore((s) => s.retryBootstrap);

  const { copy } = useCopyToClipboard();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedStudentKey, setCopiedStudentKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  usePrefetchImage(ERROR_IMAGE_SRC);

  const currentGroupStudents = useMemo<StudentEntry[]>(() => {
    if (!selectedGroup) return [];
    const list = studentsGroups[selectedGroup] ?? [];
    return list
      .map((s) => ({
        student: String(s.student ?? '').trim(),
        group: selectedGroup,
        leader: Boolean(s.leader),
      }))
      .filter((s) => s.student.length > 0);
  }, [studentsGroups, selectedGroup]);

  const allStudents = useMemo(
    () => collectAllStudents(studentsGroups),
    [studentsGroups]
  );

  useEffect(() => {
    if (!searchOpen) setQuery('');
  }, [searchOpen]);

  useEffect(() => {
    if (!copiedStudentKey) return;
    const t = setTimeout(() => setCopiedStudentKey(null), 1400);
    return () => clearTimeout(t);
  }, [copiedStudentKey]);

  useEffect(() => {
    if (!copiedAll) return;
    const t = setTimeout(() => setCopiedAll(false), 1600);
    return () => clearTimeout(t);
  }, [copiedAll]);

  const trimmedQuery = query.trim();
  const isSearching = searchOpen && trimmedQuery.length > 0;
  const searchResults = useMemo(
    () =>
      isSearching
        ? searchStudents(allStudents, query, MAX_SEARCH_RESULTS)
        : [],
    [allStudents, query, isSearching]
  );

  const handleCopyStudent = async (
    e: React.SyntheticEvent,
    entry: StudentEntry
  ) => {
    e.stopPropagation();
    const ok = await copy(entry.student);
    if (ok) setCopiedStudentKey(`${entry.group}::${entry.student}`);
  };

  const handleCopyAll = async () => {
    if (currentGroupStudents.length === 0) return;
    const text = formatStudentsForClipboard(currentGroupStudents);
    const ok = await copy(text);
    if (ok) setCopiedAll(true);
  };

  if (studentsLoading && currentGroupStudents.length === 0 && !studentsError) {
    return (
      <div className="students__centred">
        <Loader color={'#a8bcdd'} stroke={3} />
      </div>
    );
  }

  if (studentsError && currentGroupStudents.length === 0) {
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

  const toolbarLabel =
    currentGroupStudents.length > 0
      ? `Группа ${selectedGroup ?? '—'}`
      : 'Одногруппники';

  const canCopyAll = currentGroupStudents.length > 0 && !isSearching;

  return (
    <div className="students">
      <SearchToolbar
        label={toolbarLabel}
        placeholder="Имя студента или группа"
        query={query}
        onQueryChange={setQuery}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        action={
          canCopyAll ? (
            <button
              type="button"
              className={
                'students__copy-all' +
                (copiedAll ? ' students__copy-all--copied' : '')
              }
              onClick={() => void handleCopyAll()}
              aria-label="Скопировать всех студентов группы"
              title="Скопировать всех студентов"
            >
              {copiedAll ? (
                <Check size={15} strokeWidth={2.6} />
              ) : (
                <Copy size={15} strokeWidth={2.2} />
              )}
            </button>
          ) : undefined
        }
      />

      <div className="students__list">
        <AnimatePresence initial={false} mode="popLayout">
          {!isSearching && currentGroupStudents.length === 0 && (
            <motion.div
              key="students-empty"
              className="students__centred students__centred--inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <p className="students__empty">Нет результатов</p>
              <p className="students__hint">
                Возможно, для этой группы данные ещё не загружены
              </p>
            </motion.div>
          )}

          {!isSearching &&
            currentGroupStudents.map((student, i) => {
              const key = `${student.group}::${student.student}`;
              const isCopied = copiedStudentKey === key;
              return (
                <motion.div
                  className={
                    'students__item' +
                    (student.leader ? ' students__item--leader' : '') +
                    (isCopied ? ' students__item--copied' : '')
                  }
                  key={key}
                  onClick={(e) => void handleCopyStudent(e, student)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Скопировать ${student.student}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleCopyStudent(e, student);
                    }
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 38,
                    mass: 0.6,
                    delay: i * 0.03,
                  }}
                  whileTap={{ scale: 0.985 }}
                >
                  <div className="students__item__left">
                    <p className="students__item__left__num">{i + 1}.</p>
                  </div>
                  <div className="students__item__content">
                    <p className="students__item__content__name">
                      {student.student}
                    </p>
                  </div>
                  <div className="students__item__right">
                    {student.leader && (
                      <Star strokeWidth={3} className="students__star" />
                    )}
                    <CopyIcon copied={isCopied} />
                  </div>
                </motion.div>
              );
            })}

          {isSearching && searchResults.length === 0 && (
            <motion.div
              key="search-empty"
              className="students__centred students__centred--inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <p className="students__empty">Ничего не найдено</p>
              <p className="students__hint">
                Попробуйте другое написание имени или номер группы
              </p>
            </motion.div>
          )}

          {isSearching &&
            searchResults.map((result, i) => {
              const s = result.student;
              const key = `${s.group}::${s.student}`;
              const isCopied = copiedStudentKey === key;
              return (
                <motion.div
                  className={
                    'students__item students__item--search' +
                    (s.leader ? ' students__item--leader' : '') +
                    (isCopied ? ' students__item--copied' : '')
                  }
                  key={key}
                  onClick={(e) => void handleCopyStudent(e, s)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Скопировать ${s.student}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleCopyStudent(e, s);
                    }
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 38,
                    mass: 0.6,
                    delay: i * 0.02,
                  }}
                  whileTap={{ scale: 0.985 }}
                >
                  <div className="students__item__left">
                    <span className="students__group-chip">
                      <Users size={11} strokeWidth={2.4} />
                      {s.group}
                    </span>
                  </div>
                  <div className="students__item__content">
                    <p className="students__item__content__name">{s.student}</p>
                    {result.matchReason === 'group' && (
                      <p className="students__item__match">по группе</p>
                    )}
                  </div>
                  <div className="students__item__right">
                    {s.leader && (
                      <Star strokeWidth={3} className="students__star" />
                    )}
                    <CopyIcon copied={isCopied} />
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
};