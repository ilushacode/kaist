import { EXAMS_URL } from '../config';
import { fetchJson } from './client';
import type { ExamsData, GroupExamRaw } from '../types';

interface RawExamsResponse {
  groups?: Record<string, GroupExamRaw[]>;
  meta?: { contentHash?: string; updatedAt?: string };
}

export const fetchExamsData = async (
  options: { signal?: AbortSignal; timeout?: number } = {}
): Promise<ExamsData> => {
  const data = await fetchJson<RawExamsResponse>(EXAMS_URL, options);
  return {
    groups: data?.groups ?? {},
    contentHash: data?.meta?.contentHash ?? null,
    updatedAt: data?.meta?.updatedAt ?? null,
  };
};