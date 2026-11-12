import { useEffect, useMemo, useReducer } from 'react';
import { useStore } from '../hooks/useStore';
import { collectTaskDays } from '../utils/tasks';
import { getLessonTypeLabel } from '../utils/lesson';
import '../styles/Tasks.css';

const EMPTY_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.webp`;

const dayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });

export function TasksComponent() {
  const group = useStore((s) => s.selectedGroup);
  const entries = useStore((s) => group ? s.lessonTasks[group] : undefined);
  const schedule = useStore((s) => group ? s.scheduleGroups[group] : undefined);
  const [minute, tick] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    const timer = setInterval(tick, 60_000);
    const refresh = () => tick();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  const days = useMemo(() => {
    // Пересчитываем прошедшие пары, пока страница открыта.
    void minute;
    return collectTaskDays(entries, schedule);
  }, [entries, schedule, minute]);

  if (!days.length) {
    return (
      <div className="tasks__empty" role="status">
        <img src={EMPTY_IMAGE_SRC} alt="Гусь спит" loading="eager" decoding="async"
          fetchPriority="high" className="tasks__empty-image" />
        <p className="tasks__empty-title">Нет предстоящих задач</p>
        <p className="tasks__empty-subtitle">Добавьте задачу в расписании, открыв нужную пару.</p>
      </div>
    );
  }

  return (
    <div className="tasks">
      {days.map((day) => {
        const weekday = weekdayFormat.format(day.date);
        return (
          <section key={day.key} className="tasks__day" aria-labelledby={`tasks-day-${day.key}`}>
            <h2 id={`tasks-day-${day.key}`} className="tasks__date">
              {dayFormat.format(day.date)} — {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
            </h2>
            <ul className="tasks__list">
              {day.tasks.map((task) => (
                <li key={task.key} className="tasks__card">
                  <div className="tasks__lesson">
                    <span className="tasks__type">{getLessonTypeLabel(task.type)}</span>
                    <span className="tasks__subject">{task.subject}</span>
                  </div>
                  <p className="tasks__text">{task.text}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
