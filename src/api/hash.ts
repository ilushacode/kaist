import { API_BASE } from '../config';
import { fetchJson } from './client';
import type { HashesResponse } from '../types';

const HASH_PATH = '/api/hash';

export interface AppHashes {
  schedule: string | null;
  exams: string | null;
  students: string | null;
  ads: string | null;
}

const pick = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s : null;
};

export const fetchHashes = async (
  options: { signal?: AbortSignal; timeout?: number } = {}
): Promise<AppHashes> => {
  const data = await fetchJson<HashesResponse>(`${API_BASE}${HASH_PATH}`, options);
  const h = data?.hashes ?? {};
  return {
    schedule: pick(h.schedule),
    exams: pick(h.exams),
    students: pick(h.students),
    ads: pick(h.ads),
  };
};