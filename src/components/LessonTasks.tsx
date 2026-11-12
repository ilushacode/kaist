import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useStore, type LessonTask } from '../hooks/useStore';
import { useLongPress } from '../hooks/useLongPress';

export function LessonTasks({ group, lessonKey }: { group: string; lessonKey: string }) {
  const tasks = useStore((s) => s.lessonTasks[group]?.[lessonKey]);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const reducedMotion = useReducedMotion();
  const save = (next: LessonTask[]) => {
    setError(useStore.getState().setLessonTasks(group, lessonKey, next)
      ? '' : 'Не удалось сохранить задачи на устройстве. Попробуйте ещё раз.');
  };
  const editing = draft !== null;
  useEffect(() => { if (editing) input.current?.focus(); }, [editing]);

  return (
    <section className="lesson_modal__section">
      <div className="lesson_tasks__heading">
        <h3 className="lesson_modal__section__label">Задачи</h3>
        <span aria-label="Количество задач">{tasks?.length ?? 0}</span>
      </div>
      <button type="button" className="lesson_tasks__add" onPointerDown={(e) => e.stopPropagation()}
        onClick={() => { setDraft(''); input.current?.focus(); }} disabled={draft !== null}>
        <Plus size={16} aria-hidden="true" />Добавить
      </button>
      {draft !== null && (
        <textarea ref={input} className="lesson_tasks__input" aria-label="Новая задача" rows={1}
          placeholder="Текст задачи…" value={draft} onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const field = e.currentTarget;
            const previous = draft;
            const lineHeight = parseFloat(getComputedStyle(field).lineHeight) || 24;
            field.style.height = 'auto';
            // scrollHeight учитывает и переносы длинных строк, и явные переводы строки.
            if (field.value.split('\n').length > 3 || field.scrollHeight > lineHeight * 3 + 24 + 1) {
              field.value = previous;
            }
            setDraft(field.value);
            field.style.height = `${Math.min(field.scrollHeight, lineHeight * 3 + 24)}px`;
          }}
          onBlur={() => {
            if (draft.trim()) save([{ id: crypto.randomUUID(), text: draft.trim() }, ...(tasks ?? [])]);
            setDraft(null);
          }} />
      )}
      <div className="lesson_tasks__list">
        <AnimatePresence initial={false}>
          {tasks?.map((task) => (
            <motion.div key={task.id} layout={!reducedMotion} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, scale: reducedMotion ? 1 : 0.97 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }} className="lesson_tasks__wrapper">
              <TaskCard task={task} onDelete={() => save((useStore.getState().lessonTasks[group]?.[lessonKey] ?? []).filter((item) => item.id !== task.id))}
                onError={setError} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {error && <p className="lesson_tasks__error" role="alert">{error}</p>}
    </section>
  );
}

function TaskCard({ task, onDelete, onError }: { task: LessonTask; onDelete: () => void; onError: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlers = useLongPress(onDelete, () => {});
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <div className="lesson_tasks__card">
      <p {...handlers} className="lesson_tasks__text" tabIndex={0}
        aria-label={`${task.text}. Удерживайте для удаления или нажмите Delete`}
        onPointerDown={(e) => { e.stopPropagation(); handlers.onPointerDown(e); }}
        onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onDelete(); } }}>
        {task.text}
      </p>
      <button type="button" className="lesson_tasks__copy" aria-label={copied ? 'Скопировано' : 'Копировать задачу'}
        onPointerDown={(e) => e.stopPropagation()} onClick={async () => {
          try {
            await navigator.clipboard.writeText(task.text);
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
          } catch { onError('Не удалось скопировать задачу. Попробуйте ещё раз.'); }
        }}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
