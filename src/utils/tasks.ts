import type { LessonTask } from '../hooks/useStore';
import type { GroupScheduleLesson } from '../types';
import { mapLesson } from './schedule';
import { addMinutes, isLessonPast, LESSON_DURATION_MIN } from './date';

export interface TaskDay {
  key: string;
  date: Date;
  tasks: { key: string; subject: string; type: string; time: string; text: string }[];
}

/** Метаданные есть и в ключе задачи: список работает без загруженного расписания. */
export function collectTaskDays(
  entries: Record<string, LessonTask[]> | undefined,
  schedule: GroupScheduleLesson[] | undefined,
): TaskDay[] {
  const lessons = new Map((schedule ?? []).map(mapLesson).map((lesson) => [lesson.seriesKey, lesson]));
  const days = new Map<string, TaskDay>();
  for (const [key, tasks] of Object.entries(entries ?? {})) {
    try {
      const [dateKey, identity]: unknown[] = JSON.parse(key);
      if (typeof dateKey !== 'string' || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateKey)) continue;
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) continue;
      const metadata: unknown = typeof identity === 'string' ? JSON.parse(identity) : identity;
      if (!Array.isArray(metadata)) continue;
      const [subject, type, time] = metadata;
      if (typeof subject !== 'string' || typeof type !== 'string' || typeof time !== 'string') continue;
      const lesson = typeof identity === 'string' ? lessons.get(identity) : undefined;
      if (isLessonPast(date, addMinutes(lesson?.time ?? time, LESSON_DURATION_MIN))) continue;
      const bucket = days.get(dateKey) ?? { key: dateKey, date, tasks: [] };
      for (const task of tasks) {
        if (!task.text.trim()) continue;
        bucket.tasks.push({
          key: JSON.stringify([key, task.id]),
          subject: lesson?.subject ?? subject.charAt(0).toUpperCase() + subject.slice(1),
          type: lesson?.type ?? type,
          time: lesson?.time ?? time,
          text: task.text,
        });
      }
      if (bucket.tasks.length) days.set(dateKey, bucket);
    } catch {
      // Повреждённая запись не должна скрывать остальные задачи.
    }
  }
  return [...days.values()].sort((a, b) => a.date.getTime() - b.date.getTime()).map((day) => ({
    ...day, tasks: day.tasks.sort((a, b) => a.time.localeCompare(b.time)),
  }));
}
