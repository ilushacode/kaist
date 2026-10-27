import { formatDM, getMondayOfWeek } from './date';
import { getLessonType } from './lesson';
import type { GroupScheduleLesson, Lesson } from '../types';

const WEEK_MS = 1000 * 60 * 60 * 24 * 7;
const EVEN_WEEK = 'чет';
const ODD_WEEK = 'нечет';

export const getSemesterStart = (date: Date): Date => {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month >= 8 && month <= 11) {
    return new Date(year, 8, 1);
  }

  if (month >= 0 && month <= 5) {
    return new Date(year, 1, 1);
  }

  return new Date(year, 8, 1);
};

export const isEvenWeek = (date: Date): boolean => {
  const startMonday = getMondayOfWeek(getSemesterStart(date));
  const monday = getMondayOfWeek(date);
  const diff = Math.round((monday.getTime() - startMonday.getTime()) / WEEK_MS);
  return Math.abs(diff) % 2 === 0;
};

const toFullDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
};

const isSameWeekday = (lesson: GroupScheduleLesson, date: Date): boolean =>
  !lesson?.d || lesson.d === String(date.getDay());

export const isLessonOnDate = (lesson: GroupScheduleLesson, date: Date): boolean => {
  const ds = lesson?.ds ?? [];
  if (ds.length === 0) return isSameWeekday(lesson, date);
  if (ds.includes(formatDM(date)) || ds.includes(toFullDate(date))) return true;
  const parity = isEvenWeek(date) ? EVEN_WEEK : ODD_WEEK;
  return ds.includes(parity) && isSameWeekday(lesson, date);
};

export const mapLesson = (lesson: GroupScheduleLesson): Lesson => ({
  time: lesson?.t ?? '',
  subject: lesson?.s ?? '',
  type: getLessonType(lesson?.k),
  building: lesson?.b ?? '',
  room: lesson?.a ?? '',
  teacher: lesson?.p ?? '',
  department: lesson?.u ?? '',
  dates: (lesson?.ds ?? []).filter((value) => /\d/.test(value)),
});

export const getLessonsForDate = (
  lessons: GroupScheduleLesson[] | undefined,
  date: Date
): Lesson[] => {
  if (!Array.isArray(lessons) || !(date instanceof Date)) return [];
  return lessons
    .filter((lesson) => isLessonOnDate(lesson, date))
    .map(mapLesson)
    .sort((a, b) => a.time.localeCompare(b.time));
};

/**
 * Находит все группы, у которых есть такая же пара (поток).
 * Если у пары есть конкретные даты (ds), сравниваем их массивы.
 * Если дат нет, сравниваем по дню недели (d).
 */
export const getLessonGroups = (
  scheduleGroups: Record<string, GroupScheduleLesson[]> | null | undefined,
  targetLesson: Lesson
): string[] => {
  if (!scheduleGroups) return [];

  const groups: string[] = [];
  
  // Нормализуем даты целевой пары для сравнения (сортируем и склеиваем)
  const targetDatesStr = targetLesson.dates
    .filter((v) => /\d/.test(v)) // оставляем только даты, отбрасываем "чет"/"нечет"
    .sort()
    .join(',');

  for (const [group, lessons] of Object.entries(scheduleGroups)) {
    const hasMatch = lessons.some((l) => {
      const mapped = mapLesson(l);
      
      // Базовое совпадение: время, предмет, аудитория, корпус, преподаватель
      const baseMatch =
        mapped.time === targetLesson.time &&
        mapped.subject === targetLesson.subject &&
        mapped.room === targetLesson.room &&
        mapped.building === targetLesson.building &&
        mapped.teacher === targetLesson.teacher;

      if (!baseMatch) return false;

      // Нормализуем даты текущей пары
      const currentDatesStr = mapped.dates
        .filter((v) => /\d/.test(v))
        .sort()
        .join(',');

      // Если есть конкретные даты, они должны совпадать
      if (targetDatesStr || currentDatesStr) {
        if (targetDatesStr !== currentDatesStr) return false;
      }

      return true;
    });

    if (hasMatch) {
      groups.push(group);
    }
  }

  return groups.sort((a, b) => a.localeCompare(b, 'ru'));
};