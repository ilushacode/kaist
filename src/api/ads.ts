import { ADS_URL } from '../config';
import { fetchJson } from './client';
import type { AdRaw, AdsData } from '../types';

const hashList = (list: AdRaw[]): string => {
  const json = JSON.stringify(list);
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(16)}`;
};

export const fetchAdsData = async (
  options: { signal?: AbortSignal; timeout?: number } = {}
): Promise<AdsData> => {
  try {
    const data = await fetchJson<AdRaw[]>(ADS_URL, options);
    const list = Array.isArray(data) ? data : [];
    return {
      list,
      contentHash: hashList(list),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('404')) {
      return { list: [], contentHash: null, updatedAt: null };
    }
    throw err;
  }
};