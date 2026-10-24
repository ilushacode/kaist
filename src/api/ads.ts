import { API_BASE } from '../config';
import { fetchJson } from './client';
import type { AdRaw, AdsData } from '../types';

const ADS_PATH = '/data/ads';

/**
 * Реклама загружается вручную — сервер отдаёт просто массив объявлений
 * без метаданных. Локальный хэш нужен только для сравнения «изменилось / нет»
 * на клиенте (сервер хэш рекламы не отдаёт).
 */
const localHash = (list: AdRaw[]): string => {
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
    const data = await fetchJson<AdRaw[]>(`${API_BASE}${ADS_PATH}`, options);
    const list = Array.isArray(data) ? data : [];
    return {
      list,
      contentHash: localHash(list),
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