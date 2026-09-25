import { GROUP_FINDER_URL } from '../config';
import { fetchJson } from './client';
import type { Student } from '../types';

const PAGE_LIMIT = 100;
const MAX_PAGES = 10;

interface StudentsResponse {
  items?: Student[];
}

export const fetchStudents = async (
  group: string,
  options: { signal?: AbortSignal; timeout?: number } = {}
): Promise<Student[]> => {
  const normalized = String(group ?? '').trim();
  if (!normalized) return [];

  const collected: Student[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url =
      `${GROUP_FINDER_URL}?q=${encodeURIComponent(normalized)}` +
      `&limit=${PAGE_LIMIT}&offset=${offset}`;
    const data = await fetchJson<StudentsResponse>(url, options);
    const items = Array.isArray(data?.items) ? data.items : [];

    for (const item of items) {
      if (String(item?.group ?? '').trim() === normalized) {
        collected.push(item);
      }
    }
    if (items.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }

  return collected;
};