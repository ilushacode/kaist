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

const toEntries = (map: Map<string, Entry>): TeacherEntry[] =>
  [...map.values()]
    .map((entry) => ({
      teacher: entry.teacher,
      departments: toSortedList(entry.departments),
      subjects: toSortedList(entry.subjects),
    }))
    .sort((a, b) => a.teacher.localeCompare(b.teacher, 'ru'));

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

  return toEntries(map);
};

/**
 * Собирает всех преподавателей вуза из уже загруженных schedule.json и
 * exams.json. Никаких сетевых запросов — данные уже лежат в сторе.
 */
export const collectAllTeachers = (
  scheduleGroups: Record<string, GroupScheduleLesson[]> | null | undefined,
  examsGroups: Record<string, GroupExamRaw[]> | null | undefined
): TeacherEntry[] => {
  const map = new Map<string, Entry>();

  if (scheduleGroups) {
    for (const lessons of Object.values(scheduleGroups)) {
      if (!Array.isArray(lessons)) continue;
      for (const lesson of lessons) {
        add(map, lesson.p, lesson.u, lesson.s);
      }
    }
  }

  if (examsGroups) {
    for (const exams of Object.values(examsGroups)) {
      if (!Array.isArray(exams)) continue;
      for (const exam of exams) {
        add(map, exam.p, null, exam.s);
      }
    }
  }

  return toEntries(map);
};

const normalizeForSearch = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Поиск преподавателя по имени.
 *
 * Ранжирование (чем меньше score, тем выше в списке):
 *   0 — запрос совпадает с началом фамилии,
 *   1 — запрос совпадает с началом любого слова в имени,
 *   2 — запрос — подстрока имени.
 *
 * Сортировка внутри группы — по алфавиту (localeCompare 'ru').
 */
export const searchTeachers = (
  entries: TeacherEntry[],
  query: string,
  limit = 8
): TeacherEntry[] => {
  const raw = String(query ?? '').trim();
  if (raw.length < 1) return [];
  const needle = normalizeForSearch(raw);

  const scored: Array<{ entry: TeacherEntry; score: number }> = [];

  for (const entry of entries) {
    const haystack = normalizeForSearch(entry.teacher);
    const idx = haystack.indexOf(needle);
    if (idx === -1) continue;

    let score: number;
    if (idx === 0) {
      score = 0;
    } else if (haystack[idx - 1] === ' ') {
      score = 1;
    } else {
      score = 2;
    }

    scored.push({ entry, score });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.entry.teacher.localeCompare(b.entry.teacher, 'ru');
  });

  return scored.slice(0, limit).map((item) => item.entry);
};