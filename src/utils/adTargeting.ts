import type { AdfoxTargeting, AdfoxUnit } from '../config';

/** Контекст, который виджет рекламы передаёт в систему таргетов. */
export interface AdContext {
  /** Ключевые слова контекста: предмет пары, тема и т.п. */
  keywords?: string[];
  /** Здание дня (1–8). */
  building?: number | null;
  /** Текущая группа пользователя. */
  group?: string | null;
}

/**
 * Приводит строку к сравнению: нижний регистр, «ё» → «е»,
 * всё кроме букв и цифр — в пробелы.
 */
const normalize = (value: string): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

/** Основа слова, чтобы «физика» и «физике» считались одним словом. */
const stem = (word: string): string => (word.length > 5 ? word.slice(0, 5) : word);

/**
 * Совпадает ли ключевое слово объявления с контекстом.
 * Сравнение терпит падежи и уточнения: «физика» ↔ «физике», «физика (лек.)».
 */
export const keywordMatches = (keyword: string, candidate: string): boolean => {
  const k = normalize(keyword);
  const c = normalize(candidate);
  if (!k || !c) return false;
  if (c.includes(k) || k.includes(c)) return true;

  const kWords = k.split(' ');
  const cWords = c.split(' ');
  return kWords.some((kw) => cWords.some((cw) => stem(kw) === stem(cw)));
};

const countKeywordHits = (targeting: AdfoxTargeting | undefined, ctx: AdContext): number => {
  const keywords = targeting?.keywords ?? [];
  const candidates = ctx.keywords ?? [];
  let hits = 0;
  for (const keyword of keywords) {
    for (const candidate of candidates) {
      if (keywordMatches(keyword, candidate)) hits += 1;
    }
  }
  return hits;
};

/**
 * Совпадает ли номер группы с поразрядным шаблоном.
 * На каждой позиции — список допустимых цифр; `null`/пусто — любая.
 */
export const groupMatchesDigits = (
  group: string | null | undefined,
  pattern: Array<number[] | null> | null | undefined
): boolean => {
  if (!pattern || pattern.length === 0) return true;
  if (!group || !/^\d{4}$/.test(group)) return false;

  for (let i = 0; i < pattern.length; i++) {
    const allowed = pattern[i];
    if (!allowed || allowed.length === 0) continue;
    if (!allowed.includes(Number(group[i]))) return false;
  }

  return true;
};

/**
 * Подходит ли объявление под контекст.
 * Незаданные условия не ограничивают показ; заданные должны совпасть все.
 */
export const targetingMatches = (
  targeting: AdfoxTargeting | undefined,
  ctx: AdContext = {}
): boolean => {
  if (!targeting) return true;

  if (targeting.buildings?.length) {
    if (typeof ctx.building !== 'number') return false;
    if (!targeting.buildings.includes(ctx.building)) return false;
  }

  if (targeting.groups?.length) {
    if (!ctx.group) return false;
    if (!targeting.groups.includes(ctx.group)) return false;
  }

  if (targeting.groupDigits?.length) {
    if (!groupMatchesDigits(ctx.group, targeting.groupDigits)) return false;
  }

  if (targeting.keywords?.length) {
    const candidates = ctx.keywords ?? [];
    if (candidates.length === 0) return false;
    const hit = targeting.keywords.some((keyword) =>
      candidates.some((candidate) => keywordMatches(keyword, candidate))
    );
    if (!hit) return false;
  }

  return true;
};

const scoreUnit = (unit: AdfoxUnit, ctx: AdContext): number => {
  let score = unit.priority ?? 0;

  // Совпадение по ключевым словам важнее остальных условий.
  score += countKeywordHits(unit.targeting, ctx) * 100;

  // Специфичные условия чуть повышают приоритет над общим объявлением.
  if (unit.targeting?.buildings?.length) score += 50;
  if (unit.targeting?.groups?.length) score += 25;
  if (unit.targeting?.groupDigits?.length) score += 30;

  return score;
};

/**
 * Выбирает объявление для показа: среди подходящих под контекст
 * берёт объявление с максимальным приоритетом/точностью.
 */
export const pickAdUnit = (
  units: AdfoxUnit[] | null | undefined,
  ctx: AdContext = {}
): AdfoxUnit | null => {
  if (!Array.isArray(units) || units.length === 0) return null;

  let best: AdfoxUnit | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const unit of units) {
    if (!targetingMatches(unit.targeting, ctx)) continue;
    const score = scoreUnit(unit, ctx);
    if (score > bestScore) {
      best = unit;
      bestScore = score;
    }
  }

  return best;
};
