import type { GroupExamRaw, GroupScheduleLesson, Lesson } from '../types';
import { isLessonOnDate, mapLesson } from './schedule';

export interface TeacherLessonRef {
  group: string;
  lesson: GroupScheduleLesson;
  isExam: boolean;
}

export interface CollapsedTeacherLesson {
  time: string;
  subject: string;
  type: string;
  building: string;
  room: string;
  groups: string[];
  dates: string[];
  isExam: boolean;
}

export const buildTeacherLessons = (
  teacherName: string,
  scheduleGroups: Record<string, GroupScheduleLesson[]> | null | undefined,
  examsGroups: Record<string, GroupExamRaw[]> | null | undefined
): TeacherLessonRef[] => {
  const target = normalizeTeacherName(teacherName);
  if (!target) return [];

  const refs: TeacherLessonRef[] = [];

  if (scheduleGroups) {
    for (const [group, lessons] of Object.entries(scheduleGroups)) {
      if (!Array.isArray(lessons)) continue;
      for (const lesson of lessons) {
        if (normalizeTeacherName(lesson.p) !== target) continue;
        refs.push({ group, lesson, isExam: false });
      }
    }
  }

  if (examsGroups) {
    for (const [group, exams] of Object.entries(examsGroups)) {
      if (!Array.isArray(exams)) continue;
      for (const exam of exams) {
        if (normalizeTeacherName(exam.p) !== target) continue;
        refs.push({
          group,
          lesson: examToLesson(exam),
          isExam: true,
        });
      }
    }
  }

  return refs;
};

/**
 * Возвращает true, если у преподавателя есть хотя бы одна пара в указанный день.
 */
export const hasLessonsOnDate = (
  refs: TeacherLessonRef[],
  date: Date
): boolean => {
  for (const ref of refs) {
    if (ref.isExam) continue;
    if (isLessonOnDate(ref.lesson, date)) return true;
  }
  return false;
};

export const getTeacherLessonsForDate = (
  refs: TeacherLessonRef[],
  date: Date
): CollapsedTeacherLesson[] => {
  const filtered = refs.filter(
    (ref) => !ref.isExam && isLessonOnDate(ref.lesson, date)
  );
  return collapseLessons(filtered);
};

export const getTeacherExams = (
  refs: TeacherLessonRef[]
): CollapsedTeacherLesson[] => {
  const exams = refs.filter((ref) => ref.isExam);
  return collapseLessons(exams);
};

export const getTeacherSubjects = (refs: TeacherLessonRef[]): string[] => {
  const set = new Set<string>();
  for (const ref of refs) {
    const s = (ref.lesson.s ?? '').trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
};

const normalizeTeacherName = (raw: string | null | undefined): string =>
  String(raw ?? '').trim().toUpperCase().replace(/\s+/g, ' ');

const examToLesson = (exam: GroupExamRaw): GroupScheduleLesson => {
  const rawDates = exam.ds ?? exam.dt ?? exam.dates;
  const dates = Array.isArray(rawDates)
    ? rawDates
    : typeof rawDates === 'string' && rawDates
      ? [rawDates]
      : [];
  return {
    d: '',
    t: exam.tm ?? exam.time ?? '',
    s: exam.s ?? exam.subject ?? '',
    k: 'exam',
    p: exam.p ?? exam.teacher ?? '',
    a: exam.a ?? exam.room ?? '',
    b: exam.b ?? exam.building ?? '',
    ds: dates,
  };
};

const collapseLessons = (refs: TeacherLessonRef[]): CollapsedTeacherLesson[] => {
  const map = new Map<string, CollapsedTeacherLesson>();

  for (const { group, lesson, isExam } of refs) {
    const mapped: Lesson = mapLesson(lesson);
    const key = [
      mapped.time,
      mapped.subject,
      mapped.building,
      mapped.room,
      mapped.dates.join(','),
      isExam ? 'exam' : 'lesson',
    ].join('|');

    const existing = map.get(key);
    if (existing) {
      if (!existing.groups.includes(group)) existing.groups.push(group);
    } else {
      map.set(key, {
        time: mapped.time,
        subject: mapped.subject,
        type: mapped.type,
        building: mapped.building,
        room: mapped.room,
        groups: [group],
        dates: mapped.dates,
        isExam,
      });
    }
  }

  const result = [...map.values()];
  for (const item of result) item.groups.sort();
  return result.sort((a, b) => a.time.localeCompare(b.time));
};