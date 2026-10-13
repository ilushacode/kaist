import { collectTeachers } from '../teachers';
import type { GroupExamRaw, GroupScheduleLesson } from '../../types';

const scheduleGroups: Record<string, GroupScheduleLesson[]> = {
  '3439': [
    { d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.', u: 'Кафедра ПМИ' },
    { d: '2', t: '11:00', s: 'Физика', p: 'ПЕТРОВ П.П.', u: 'Кафедра Физики' },
    { d: '3', t: '10:00', s: 'Матан', p: 'ИВАНОВ И.И.', u: 'Кафедра ПМИ' },
  ],
};

const examsGroups: Record<string, GroupExamRaw[]> = {
  '3439': [
    { s: 'Матан', tm: '10:00', p: 'ИВАНОВ И.И.' },
  ],
};

describe('collectTeachers', () => {
  it('возвращает [] для null-группы', () => {
    expect(collectTeachers(null, scheduleGroups, examsGroups)).toEqual([]);
  });

  it('собирает уникальных преподавателей', () => {
    const result = collectTeachers('3439', scheduleGroups, examsGroups);
    expect(result).toHaveLength(2);
    const names = result.map((t) => t.teacher).sort();
    expect(names).toEqual(['ИВАНОВ И.И.', 'ПЕТРОВ П.П.']);
  });

  it('собирает кафедры и предметы', () => {
    const result = collectTeachers('3439', scheduleGroups, examsGroups);
    const ivanov = result.find((t) => t.teacher === 'ИВАНОВ И.И.');
    expect(ivanov?.departments).toContain('Кафедра ПМИ');
    expect(ivanov?.subjects).toContain('Матан');
  });

  it('сортирует по имени', () => {
    const result = collectTeachers('3439', scheduleGroups, examsGroups);
    expect(result[0].teacher.localeCompare(result[1].teacher, 'ru')).toBeLessThan(0);
  });

  it('работает без экзаменов', () => {
    const result = collectTeachers('3439', scheduleGroups, null);
    expect(result).toHaveLength(2);
  });
});