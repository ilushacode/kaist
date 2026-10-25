import type { Student, StudentEntry, StudentSearchResult } from '../types';

/**
 * Собирает всех студентов вуза из уже загруженных данных (studentsGroups).
 * Возвращает плоский список с гарантированно указанной группой.
 */
export const collectAllStudents = (
  studentsGroups: Record<string, Student[]> | null | undefined
): StudentEntry[] => {
  const result: StudentEntry[] = [];
  if (!studentsGroups) return result;

  for (const [group, students] of Object.entries(studentsGroups)) {
    if (!Array.isArray(students)) continue;
    for (const s of students) {
      const name = String(s.student ?? '').trim();
      if (!name) continue;
      result.push({ student: name, group, leader: Boolean(s.leader) });
    }
  }

  return result;
};

const normalizeForSearch = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Поиск студента.
 *
 * Запрос может быть:
 *   - именем (или его частью) — ищем по подстроке в ФИО;
 *   - номером группы — ищем студентов этой группы.
 *
 * Ранжирование (чем меньше score, тем выше в списке):
 *   0 — совпадение с началом фамилии;
 *   1 — совпадение с началом любого слова;
 *   2 — подстрока в ФИО;
 *   3 — совпадение по группе.
 *
 * Сортировка внутри группы — по алфавиту (localeCompare 'ru'),
 * староста всегда выше обычных студентов при равном score.
 */
export const searchStudents = (
  entries: StudentEntry[],
  query: string,
  limit = 40
): StudentSearchResult[] => {
  const raw = String(query ?? '').trim();
  if (raw.length < 1) return [];
  const needle = normalizeForSearch(raw);
  const groupNeedle = raw.replace(/\D/g, '');

  const scored: Array<{
    result: StudentSearchResult;
    score: number;
    leader: boolean;
  }> = [];

  for (const entry of entries) {
    const haystack = normalizeForSearch(entry.student);
    const idx = haystack.indexOf(needle);

    let bestScore = Number.POSITIVE_INFINITY;
    let reason: 'name' | 'group' = 'name';

    if (idx !== -1) {
      if (idx === 0) bestScore = 0;
      else if (haystack[idx - 1] === ' ') bestScore = 1;
      else bestScore = 2;
      reason = 'name';
    }

    if (groupNeedle.length > 0 && groupNeedle.length <= 4) {
      if (entry.group.startsWith(groupNeedle)) {
        if (bestScore > 3) {
          bestScore = 3;
          reason = 'group';
        }
      }
    }

    if (bestScore !== Number.POSITIVE_INFINITY) {
      scored.push({
        result: { student: entry, matchReason: reason },
        score: bestScore,
        leader: entry.leader,
      });
    }
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Староста выше обычного студента при равном score.
    if (a.leader !== b.leader) return a.leader ? -1 : 1;
    return a.result.student.student.localeCompare(
      b.result.student.student,
      'ru'
    );
  });

  return scored.slice(0, limit).map((item) => item.result);
};

/**
 * Формирует текст для буфера обмена — по одному студенту на строку.
 */
export const formatStudentsForClipboard = (
  students: StudentEntry[]
): string => students.map((s) => s.student).join('\n');