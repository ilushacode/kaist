import { describe, it, expect } from 'vitest';
import {
  groupMatchesDigits,
  keywordMatches,
  pickAdUnit,
  targetingMatches,
  type AdContext,
} from '../adTargeting';
import { getDayBuilding, parseBuilding } from '../building';
import type { AdfoxUnit } from '../../config';
import type { Lesson } from '../../types';

const unit = (overrides: Partial<AdfoxUnit> = {}): AdfoxUnit => ({
  name: 'unit',
  ownerId: 330181,
  params: { p1: 'test', p2: 'jwhj' },
  ...overrides,
});

const lesson = (building: string): Lesson => ({
  time: '08:00',
  subject: 'Физика',
  type: 'Лекция',
  building,
  room: '101',
  teacher: 'Иванов И.И.',
  department: 'Кафедра',
  dates: [],
});

describe('keywordMatches', () => {
  it('совпадает с точным словом', () => {
    expect(keywordMatches('физика', 'физика')).toBe(true);
  });

  it('терпит падеж и уточнения в контексте', () => {
    expect(keywordMatches('физика', 'Физика (лек.)')).toBe(true);
    expect(keywordMatches('физике', 'физика')).toBe(true);
  });

  it('не совпадает с другим предметом', () => {
    expect(keywordMatches('физика', 'Математика')).toBe(false);
  });

  it('пустые строки не совпадают', () => {
    expect(keywordMatches('', 'физика')).toBe(false);
    expect(keywordMatches('физика', '')).toBe(false);
  });
});

describe('groupMatchesDigits', () => {
  it('без шаблона подходит любая группа', () => {
    expect(groupMatchesDigits('3439', undefined)).toBe(true);
    expect(groupMatchesDigits('3439', null)).toBe(true);
    expect(groupMatchesDigits('3439', [])).toBe(true);
  });

  it('проверяет цифры по позициям', () => {
    const pattern = [[3], [4], [3, 5], [9]];
    expect(groupMatchesDigits('3439', pattern)).toBe(true);
    expect(groupMatchesDigits('3459', pattern)).toBe(true);
    expect(groupMatchesDigits('3449', pattern)).toBe(false);
    expect(groupMatchesDigits('4439', pattern)).toBe(false);
  });

  it('позиции с null или пустым списком не ограничивают', () => {
    expect(groupMatchesDigits('3439', [[3], null, [], [9]])).toBe(true);
    expect(groupMatchesDigits('9999', [[3], null, [], [9]])).toBe(false);
  });

  it('без валидной группы не совпадает', () => {
    expect(groupMatchesDigits(null, [[3]])).toBe(false);
    expect(groupMatchesDigits('343', [[3]])).toBe(false);
  });
});

describe('targetingMatches', () => {  it('объявление без таргета подходит любому контексту', () => {
    expect(targetingMatches(undefined, {})).toBe(true);
  });

  it('проверяет здание', () => {
    const targeting = { buildings: [3, 5] };
    expect(targetingMatches(targeting, { building: 3 })).toBe(true);
    expect(targetingMatches(targeting, { building: 4 })).toBe(false);
    expect(targetingMatches(targeting, { building: null })).toBe(false);
  });

  it('проверяет группу', () => {
    const targeting = { groups: ['3439'] };
    expect(targetingMatches(targeting, { group: '3439' })).toBe(true);
    expect(targetingMatches(targeting, { group: '4191' })).toBe(false);
    expect(targetingMatches(targeting, { group: null })).toBe(false);
  });

  it('проверяет цифры номера группы', () => {
    const targeting = { groupDigits: [[3], [4], [3, 5], [9]] };
    expect(targetingMatches(targeting, { group: '3439' })).toBe(true);
    expect(targetingMatches(targeting, { group: '3459' })).toBe(true);
    expect(targetingMatches(targeting, { group: '3449' })).toBe(false);
    expect(targetingMatches(targeting, { group: null })).toBe(false);
  });

  it('проверяет ключевые слова', () => {
    const targeting = { keywords: ['физика'] };
    expect(targetingMatches(targeting, { keywords: ['Физика (лек.)'] })).toBe(true);
    expect(targetingMatches(targeting, { keywords: ['Математика'] })).toBe(false);
    expect(targetingMatches(targeting, { keywords: [] })).toBe(false);
  });
});

describe('pickAdUnit', () => {
  const physics = unit({
    name: 'physics',
    targeting: { keywords: ['физика'] },
    priority: 10,
  });
  const general = unit({ name: 'general', priority: 1 });

  it('возвращает null для пустого списка', () => {
    expect(pickAdUnit([], {})).toBeNull();
  });

  it('без контекста выбирает общее объявление', () => {
    expect(pickAdUnit([physics, general], {})?.name).toBe('general');
  });

  it('по ключевому слову выбирает тематическое объявление', () => {
    const ctx: AdContext = { keywords: ['Физика (лек.)'] };
    expect(pickAdUnit([physics, general], ctx)?.name).toBe('physics');
  });

  it('не выбирает тематическое объявление для другого предмета', () => {
    expect(
      pickAdUnit([physics, general], { keywords: ['Математика'] })?.name
    ).toBe('general');
  });

  it('объявление с привязкой к зданию важнее общего', () => {
    const buildingUnit = unit({
      name: 'building-3',
      targeting: { buildings: [3] },
      priority: 1,
    });
    expect(pickAdUnit([general, buildingUnit], { building: 3 })?.name).toBe(
      'building-3'
    );
    expect(pickAdUnit([general, buildingUnit], { building: 4 })?.name).toBe(
      'general'
    );
  });

  it('объявление с поразрядным шаблоном группы важнее общего', () => {
    const groupUnit = unit({
      name: 'group-34',
      targeting: { groupDigits: [[3], [4], null, null] },
      priority: 1,
    });
    expect(pickAdUnit([general, groupUnit], { group: '3459' })?.name).toBe(
      'group-34'
    );
    expect(pickAdUnit([general, groupUnit], { group: '4459' })?.name).toBe(
      'general'
    );
  });

  it('возвращает null, если ничего не подошло', () => {
    const onlyBuilding = unit({
      targeting: { buildings: [3] },
    });
    expect(pickAdUnit([onlyBuilding], { building: 7 })).toBeNull();
  });
});

describe('parseBuilding', () => {
  it('берёт номер корпуса из строки', () => {
    expect(parseBuilding('3')).toBe(3);
    expect(parseBuilding('3 корпус')).toBe(3);
  });

  it('отбрасывает пустое и нечисловое', () => {
    expect(parseBuilding('')).toBeNull();
    expect(parseBuilding(null)).toBeNull();
    expect(parseBuilding('корпус')).toBeNull();
  });

  it('отбрасывает номера вне 1–8', () => {
    expect(parseBuilding('0')).toBeNull();
    expect(parseBuilding('9')).toBeNull();
    expect(parseBuilding('10')).toBeNull();
  });
});

describe('getDayBuilding', () => {
  it('возвращает null для пустого дня', () => {
    expect(getDayBuilding([])).toBeNull();
    expect(getDayBuilding(null)).toBeNull();
  });

  it('выбирает здание с наибольшим числом пар', () => {
    const lessons = [
      lesson('1'),
      lesson('3'),
      lesson('3'),
      lesson('3'),
      lesson('8'),
    ];
    expect(getDayBuilding(lessons)).toBe(3);
  });

  it('при равенстве выбирает здание с меньшим номером', () => {
    const lessons = [lesson('8'), lesson('2'), lesson('8'), lesson('2')];
    expect(getDayBuilding(lessons)).toBe(2);
  });

  it('игнорирует пары без номера здания', () => {
    const lessons = [lesson(''), lesson('5'), lesson('корпус')];
    expect(getDayBuilding(lessons)).toBe(5);
  });
});
