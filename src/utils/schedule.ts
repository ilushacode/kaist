import { compareDay, formatDM, getMondayOfWeek } from './date';
import { getLessonType } from './lesson';
import type { GroupScheduleLesson, Lesson } from '../types';

const WEEK_MS = 1000 * 60 * 60 * 24 * 7;
const EVEN_WEEK = 'чет';
const ODD_WEEK = 'нечет';

export const getSemesterStart = (date: Date): Date => {
  const year = date.getFullYear();
  const autumnEnd = new Date(year, 11, 31);
  if (compareDay(date, autumnEnd) <= 0) {
    return new Date(year, 8, 1);
  }
  return new Date(year + 1, 1, 1);
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