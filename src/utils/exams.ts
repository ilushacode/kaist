import type { Exam, GroupExamRaw } from '../types';

const normalizeExam = (raw: GroupExamRaw): Exam | null => {
  if (!raw || typeof raw !== 'object') return null;

  const rawDates = raw.ds ?? raw.dt ?? raw.dates;
  const dates = Array.isArray(rawDates)
    ? rawDates
    : typeof rawDates === 'string' && rawDates
      ? [rawDates]
      : [];

  return {
    subject: raw.s ?? raw.subject ?? 'Без названия',
    time: raw.tm ?? raw.time ?? '00:00',
    room: raw.a ?? raw.room ?? '',
    building: raw.b ?? raw.building ?? '',
    teacher: raw.p ?? raw.teacher ?? '',
    dates,
  };
};

export const getExamsForGroup = (
  examsGroups: Record<string, GroupExamRaw[]> | null | undefined,
  group: string | null | undefined
): Exam[] => {
  if (!group || !examsGroups) return [];
  const raw = examsGroups[group];
  if (!Array.isArray(raw)) return [];

  return raw
    .map(normalizeExam)
    .filter((e): e is Exam => Boolean(e))
    .sort((a, b) => a.time.localeCompare(b.time));
};