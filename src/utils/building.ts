import type { Lesson } from '../types';

/** Номер здания (1–8) из строки пары. Всё остальное — null. */
export const parseBuilding = (raw: string | null | undefined): number | null => {
  const match = String(raw ?? '').match(/\d+/);
  if (!match) return null;
  const building = Number(match[0]);
  return building >= 1 && building <= 8 ? building : null;
};

/**
 * Здание дня — корпус, в котором больше всего пар в этот день.
 * При равенстве выбираем здание с меньшим номером, чтобы результат
 * не зависел от порядка пар в расписании.
 */
export const getDayBuilding = (lessons: Lesson[] | null | undefined): number | null => {
  if (!Array.isArray(lessons) || lessons.length === 0) return null;

  const counts = new Map<number, number>();
  for (const lesson of lessons) {
    const building = parseBuilding(lesson.building);
    if (building === null) continue;
    counts.set(building, (counts.get(building) ?? 0) + 1);
  }

  let best: number | null = null;
  let bestCount = -1;
  for (const [building, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && best !== null && building < best)
    ) {
      best = building;
      bestCount = count;
    }
  }

  return best;
};
