import { useId, useMemo, useState } from 'react';
import { GraduationCap, ChevronRight, ChevronDown } from 'lucide-react';
import { addMinutes, isPastDay, isTodayDay, stripLeadingZero } from '../utils/date';
import { capitalizeName, formatBuilding } from '../utils/string';
import { getLessonTypeLabel } from '../utils/lesson';
import { getLessonGroups } from '../utils/schedule';
import { parseBuilding } from '../utils/building';
import { AdBanner } from '../components/AdBanner';
import { getSubjectKey, useStore } from '../hooks/useStore';
import { TeacherLink } from '../components/TeacherLink';
import type { Lesson } from '../types';
import '../styles/LessonModal.css';

const LESSON_DURATION_MIN = 90;

interface LessonModalProps {
  lesson: Lesson;
  group: string | null;
}

export default function LessonModal({ lesson, group }: LessonModalProps) {
  const noteId = useId();
  const [saveError, setSaveError] = useState(false);
  const subjectKey = getSubjectKey(lesson.subject);
  const note = useStore((s) => group ? s.subjectNotes[group]?.[subjectKey] ?? '' : '');
  const [noteOpen, setNoteOpen] = useState(() => Boolean(note));
  const setSubjectNote = useStore((s) => s.setSubjectNote);
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

      {group && subjectKey && (
        <section className="lesson_modal__section">
          <button
            type="button"
            className="lesson_modal__note-toggle"
            aria-expanded={noteOpen}
            aria-controls={`${noteId}-panel`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setNoteOpen((open) => !open)}
          >
            <span id={`${noteId}-label`} className="lesson_modal__section__label">Заметка</span>
            <ChevronDown
              size={18}
              strokeWidth={1.6}
              className="lesson_modal__note-chevron"
              aria-hidden="true"
            />
          </button>
          <div
            id={`${noteId}-panel`}
            className={'lesson_modal__note-panel' + (noteOpen ? ' lesson_modal__note-panel--open' : '')}
            aria-hidden={!noteOpen}
            inert={!noteOpen}
          >
            <div className="lesson_modal__note-content">
              <div className="lesson_modal__note-body">
                <textarea
                  id={noteId}
                  aria-labelledby={`${noteId}-label`}
                  className="lesson_modal__note"
                  placeholder="Добавить заметку…"
                  rows={3}
                  value={note}
                  aria-invalid={saveError || undefined}
                  aria-describedby={saveError ? `${noteId}-error` : undefined}
                  onPointerDown={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    setSaveError(!setSubjectNote(group, lesson.subject, event.target.value));
                  }}
                />
                {saveError && (
                  <p id={`${noteId}-error`} className="lesson_modal__note-error" role="alert">
                    Не удалось сохранить заметку на устройстве. Попробуйте ещё раз.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <AdBanner
        placement="lesson-bottom"
        className="ad-banner--modal"
        context={{
          keywords: [lesson.subject],
          building: parseBuilding(lesson.building),
          group: selectedGroup,
        }}
      />
    </div>
  );
}
