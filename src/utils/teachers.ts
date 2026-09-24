import type { GroupExamRaw, GroupScheduleLesson, TeacherEntry } from '../types';

interface Entry {
  teacher: string;
  departments: Set<string>;
  subjects: Set<string>;
}

const add = (
  map: Map<string, Entry>,
  teacher: string | undefined,
  department: string | undefined | null,
  subject: string | undefined
): void => {
  const name = (teacher ?? '').trim();
  if (!name) return;
  const entry =
    map.get(name) ?? { teacher: name, departments: new Set(), subjects: new Set() };
  if (department) entry.departments.add(department);
  if (subject) entry.subjects.add(subject);
  map.set(name, entry);
};

const toSortedList = (values: Set<string>): string[] =>
  [...values].sort((a, b) => a.localeCompare(b, 'ru'));

export const collectTeachers = (
  group: string | null | undefined,
  scheduleGroups: Record<string, GroupScheduleLesson[]> | null | undefined,
  examsGroups: Record<string, GroupExamRaw[]> | null | undefined
): TeacherEntry[] => {
  const map = new Map<string, Entry>();
  if (!group) return [];

  for (const lesson of scheduleGroups?.[group] ?? []) {
    add(map, lesson.p, lesson.u, lesson.s);
  }
  for (const exam of examsGroups?.[group] ?? []) {
    add(map, exam.p, null, exam.s);
  }

  return [...map.values()]
    .map((entry) => ({
      teacher: entry.teacher,
      departments: toSortedList(entry.departments),
      subjects: toSortedList(entry.subjects),
    }))
    .sort((a, b) => a.teacher.localeCompare(b.teacher, 'ru'));
};