import type { AdRaw, NormalizedAd } from '../types';

export const normalizeAd = (raw: AdRaw | null | undefined): NormalizedAd | null => {
  if (!raw || typeof raw !== 'object') return null;
  const target = String(raw.target ?? '').trim();
  const caption = String(raw.caption ?? '').trim();
  const image = String(raw.image ?? '').trim();
  const link = String(raw.link ?? '').trim();
  if (!image) return null;
  return {
    id: `${image}::${target || '****'}`,
    target: target || '****',
    caption,
    image,
    link,
    startDate: normalizeDate(raw.startDate),
    endDate: normalizeDate(raw.endDate),
  };
};

const normalizeDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setHours(0, 0, 0, 0);
  return d;
};

export const matchesGroup = (pattern: string, group: string): boolean => {
  const p = String(pattern ?? '');
  const g = String(group ?? '');
  if (p.length !== 4 || g.length !== 4) return false;
  for (let i = 0; i < 4; i++) {
    const pc = p[i];
    if (pc === '*') continue;
    if (pc !== g[i]) return false;
  }
  return true;
};

export const isAdActive = (ad: NormalizedAd | null, today: Date): boolean => {
  if (!ad) return false;
  const t = today instanceof Date ? today : new Date();
  if (ad.startDate && t < ad.startDate) return false;
  if (ad.endDate && t > ad.endDate) return false;
  return true;
};

export const pickAdForGroup = (
  adsRaw: AdRaw[] | null | undefined,
  group: string | null | undefined,
  today: Date,
  hiddenIds?: Set<string>,
  rng: () => number = Math.random
): NormalizedAd | null => {
  if (!Array.isArray(adsRaw) || adsRaw.length === 0) return null;
  if (!group) return null;

  const candidates: NormalizedAd[] = [];
  for (const raw of adsRaw) {
    const ad = normalizeAd(raw);
    if (!ad) continue;
    if (hiddenIds?.has(ad.id)) continue;
    if (!matchesGroup(ad.target, group)) continue;
    if (!isAdActive(ad, today)) continue;
    candidates.push(ad);
  }
  if (candidates.length === 0) return null;
  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx];
};