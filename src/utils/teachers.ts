import type { GroupExamRaw, GroupScheduleLesson, TeacherEntry } from '../types';

interface Entry {
  teacher: string;
  departments: Set<string>;
  subjects: Set<string>;
  groups: Set<string>;
}

const add = (
  map: Map<string, Entry>,
  teacher: string | undefined,
  department: string | undefined | null,
  subject: string | undefined,
  group: string | undefined
): void => {
  const name = (teacher ?? '').trim();
  if (!name) return;
  const entry =
    map.get(name) ?? {
      teacher: name,
      departments: new Set<string>(),
      subjects: new Set<string>(),
      groups: new Set<string>(),
    };
  if (department) entry.departments.add(department);
  if (subject) entry.subjects.add(subject);
  if (group) entry.groups.add(group);
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
      groups: toSortedList(entry.groups),
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
    add(map, lesson.p, lesson.u, lesson.s, group);
  }
  for (const exam of examsGroups?.[group] ?? []) {
    add(map, exam.p, null, exam.s, group);
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
    for (const [group, lessons] of Object.entries(scheduleGroups)) {
      if (!Array.isArray(lessons)) continue;
      for (const lesson of lessons) {
        add(map, lesson.p, lesson.u, lesson.s, group);
      }
    }
  }

  if (examsGroups) {
    for (const [group, exams] of Object.entries(examsGroups)) {
      if (!Array.isArray(exams)) continue;
      for (const exam of exams) {
        add(map, exam.p, null, exam.s, group);
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
 * Поиск преподавателя.
 *
 * Запрос может быть:
 *   - именем (или его частью) — ищем по подстроке в ФИО;
 *   - номером группы (или его началом) — ищем преподавателей,
 *     которые ведут в этой группе.
 *
 * Ранжирование (чем меньше score, тем выше в списке):
 *   0 — совпадение с началом фамилии;
 *   1 — совпадение с началом любого слова;
 *   2 — подстрока в ФИО;
 *   3 — совпадение по группе (только если запрос похож на номер группы).
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
  const groupNeedle = raw.replace(/\D/g, '');

  const scored: Array<{ entry: TeacherEntry; score: number }> = [];

  for (const entry of entries) {
    const haystack = normalizeForSearch(entry.teacher);
    const idx = haystack.indexOf(needle);

    let bestScore = Number.POSITIVE_INFINITY;

    if (idx !== -1) {
      if (idx === 0) bestScore = 0;
      else if (haystack[idx - 1] === ' ') bestScore = 1;
      else bestScore = 2;
    }

    // Совпадение по номеру группы — только если в запросе есть цифры
    // и он не длиннее 4 символов (номера групп в вузе 4-значные).
    if (groupNeedle.length > 0 && groupNeedle.length <= 4) {
      for (const g of entry.groups) {
        if (g.startsWith(groupNeedle)) {
          if (bestScore > 3) bestScore = 3;
          break;
        }
      }
    }

    if (bestScore !== Number.POSITIVE_INFINITY) {
      scored.push({ entry, score: bestScore });
    }
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.entry.teacher.localeCompare(b.entry.teacher, 'ru');
  });

  return scored.slice(0, limit).map((item) => item.entry);
};