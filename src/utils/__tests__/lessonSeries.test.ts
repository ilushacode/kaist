import { expect, it } from 'vitest';
import { mapLesson } from '../schedule';

it('объединяет повторения и новые даты, различает тип, время и день недели', () => {
  const lesson = { s: 'Математика', k: 'лек', t: '09:00', d: '4', ds: ['05.11', '12.11'] };
  const key = mapLesson(lesson).seriesKey;
  expect(mapLesson({ ...lesson, ds: ['19.11'] }).seriesKey).toBe(key);
  for (const change of [{ k: 'пр' }, { t: '11:00' }, { d: '5' }, { ds: ['чет'] }]) {
    expect(mapLesson({ ...lesson, ...change }).seriesKey).not.toBe(key);
  }
});
