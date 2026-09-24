import type { GroupScheduleLesson } from '../types';

export const listGroups = (
  scheduleGroups: Record<string, GroupScheduleLesson[]> | null | undefined
): string[] => Object.keys(scheduleGroups ?? {}).sort();

export const searchGroups = (
  scheduleGroups: Record<string, GroupScheduleLesson[]> | null | undefined,
  query: string,
  limit = 0
): string[] => {
  const value = String(query ?? '').trim().toLowerCase();
  if (!value) return [];
  const found = listGroups(scheduleGroups).filter((group) =>
    group.toLowerCase().startsWith(value)
  );
  return limit > 0 ? found.slice(0, limit) : found;
};

export const normalizeGroupInput = (raw: string | null | undefined): string =>
  String(raw ?? '').replace(/\D/g, '').slice(0, 4);