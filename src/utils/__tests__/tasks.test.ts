import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { collectTaskDays } from '../tasks';
import { getLessonTaskKey } from '../../hooks/useStore';
import { mapLesson } from '../schedule';
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 12)); });
afterEach(() => vi.useRealTimers());
it('сохраняет порядок дат между годами и время пар, пропуская повреждённые записи', () => {
  const first = mapLesson({ s: 'Математика', k: 'пр', t: '08:00' });
  const second = { ...first, time: '10:00', seriesKey: undefined };
  const days = collectTaskDays({
    [getLessonTaskKey(first, new Date(2027, 0, 1))]: [{ id: '1', text: 'Новый год' }],
    [getLessonTaskKey(second, new Date(2026, 11, 31))]: [{ id: '2', text: 'Позже' }],
    [getLessonTaskKey(first, new Date(2026, 11, 31))]: [{ id: '3', text: 'Раньше' }],
    invalid: [{ id: '4', text: 'Повреждено' }],
  }, undefined);
  expect(days.map((day) => day.key)).toEqual(['2026-12-31', '2027-1-1']);
  expect(days[0].tasks.map((task) => task.text)).toEqual(['Раньше', 'Позже']);
});
