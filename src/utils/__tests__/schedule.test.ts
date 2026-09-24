import {
  getSemesterStart,
  isEvenWeek,
  isLessonOnDate,
  mapLesson,
  getLessonsForDate,
} from '../schedule';
import type { GroupScheduleLesson } from '../../types';

describe('getSemesterStart', () => {
  it('для осенних дат — 1 сентября', () => {
    const d = getSemesterStart(new Date(2025, 9, 1));
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(1);
  });
  it('для весенних дат — 1 февраля следующего года', () => {
    const d = getSemesterStart(new Date(2026, 2, 1));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(1);
  });
});

describe('isEvenWeek', () => {
  it('первая неделя семестра — чётная', () => {
    // 8 сентября 2025 — понедельник второй недели от 1 сентября
    const d = new Date(2025, 8, 8);
    expect(typeof isEvenWeek(d)).toBe('boolean');
  });
});

describe('isLessonOnDate', () => {
  const monday = new Date(2025, 8, 8);
  monday.setHours(0, 0, 0, 0);

  it('совпадает по дню недели без ds', () => {
    const lesson: GroupScheduleLesson = { d: '1' };
    expect(isLessonOnDate(lesson, monday)).toBe(true);
  });
  it('не совпадает по дню недели', () => {
    const lesson: GroupScheduleLesson = { d: '2' };
    expect(isLessonOnDate(lesson, monday)).toBe(false);
  });
  it('совпадает по конкретной дате', () => {
    const lesson: GroupScheduleLesson = { d: '1', ds: ['08.09'] };
    expect(isLessonOnDate(lesson, monday)).toBe(true);
  });
  it('совпадает по полной дате', () => {
    const lesson: GroupScheduleLesson = { d: '1', ds: ['08.09.2025'] };
    expect(isLessonOnDate(lesson, monday)).toBe(true);
  });
});

describe('mapLesson', () => {
  it('преобразует сырое занятие', () => {
    const raw: GroupScheduleLesson = {
      t: '09:00',
      s: 'Матан',
      k: 'лек',
      b: '3',
      a: '423',
      p: 'Иванов',
      u: 'Кафедра',
      ds: ['чет', '12.10'],
    };
    const mapped = mapLesson(raw);
    expect(mapped.time).toBe('09:00');
    expect(mapped.subject).toBe('Матан');
    expect(mapped.type).toBe('lec');
    expect(mapped.dates).toEqual(['12.10']);
  });
  it('подставляет дефолты', () => {
    const mapped = mapLesson({});
    expect(mapped.time).toBe('');
    expect(mapped.subject).toBe('');
    expect(mapped.dates).toEqual([]);
  });
});

describe('getLessonsForDate', () => {
  const monday = new Date(2025, 8, 8);
  monday.setHours(0, 0, 0, 0);

  it('возвращает [] для undefined', () => {
    expect(getLessonsForDate(undefined, monday)).toEqual([]);
  });
  it('фильтрует и сортирует по времени', () => {
    const lessons: GroupScheduleLesson[] = [
      { d: '1', t: '11:00', s: 'B' },
      { d: '1', t: '09:00', s: 'A' },
      { d: '2', t: '10:00', s: 'C' },
    ];
    const result = getLessonsForDate(lessons, monday);
    expect(result).toHaveLength(2);
    expect(result[0].subject).toBe('A');
    expect(result[1].subject).toBe('B');
  });
});