export const LESSON_TYPE_LABELS: Record<string, string> = {
  lec: 'Лекция',
  lab: 'Лабораторная работа',
  prac: 'Практическая работа',
};

const LESSON_TYPES_BY_K: Record<string, string> = {
  'лек': 'lec',
  'пр': 'prac',
  'л.р.': 'lab',
};

export const getLessonType = (k: string | null | undefined): string =>
  (k && LESSON_TYPES_BY_K[k]) ?? k ?? '';

export const getLessonTypeLabel = (type: string): string =>
  LESSON_TYPE_LABELS[type] ?? 'Неизвестно';