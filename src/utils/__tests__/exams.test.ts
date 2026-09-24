import { getExamsForGroup } from '../exams';
import type { GroupExamRaw } from '../../types';

describe('getExamsForGroup', () => {
  const groups: Record<string, GroupExamRaw[]> = {
    '3439': [
      { s: 'Матан', tm: '10:00', a: '423', b: '3', p: 'Иванов', dt: '15.09' },
      { s: 'Физика', tm: '09:00', a: '201', b: '2', p: 'Петров', dt: '20.09' },
    ],
  };

  it('возвращает [] для неизвестной группы', () => {
    expect(getExamsForGroup(groups, '9999')).toEqual([]);
  });
  it('возвращает [] для null-группы', () => {
    expect(getExamsForGroup(groups, null)).toEqual([]);
  });
  it('сортирует по времени', () => {
    const result = getExamsForGroup(groups, '3439');
    expect(result[0].subject).toBe('Физика');
    expect(result[1].subject).toBe('Матан');
  });
  it('нормализует даты', () => {
    const result = getExamsForGroup(groups, '3439');
    expect(result[0].dates).toEqual(['20.09']);
  });
  it('работает с массивом дат', () => {
    const g: Record<string, GroupExamRaw[]> = {
      '1': [{ s: 'X', tm: '10:00', ds: ['01.01', '02.01'] }],
    };
    expect(getExamsForGroup(g, '1')[0].dates).toEqual(['01.01', '02.01']);
  });
});