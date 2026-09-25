import { SCHEDULE_URL } from '../config';
import { fetchJson } from './client';
import type { GroupScheduleLesson, ScheduleData } from '../types';

interface RawScheduleResponse {
  groups?: Record<string, GroupScheduleLesson[]>;
  meta?: { contentHash?: string; updatedAt?: string };
}

export const fetchScheduleData = async (
  options: { signal?: AbortSignal; timeout?: number } = {}
): Promise<ScheduleData> => {
  const data = await fetchJson<RawScheduleResponse>(SCHEDULE_URL, options);
  return {
    groups: data?.groups ?? {},
    contentHash: data?.meta?.contentHash ?? null,
    updatedAt: data?.meta?.updatedAt ?? null,
  };
};