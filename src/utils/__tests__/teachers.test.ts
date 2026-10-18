import { collectAllTeachers, collectTeachers, searchTeachers } from '../teachers';
import type { GroupExamRaw, GroupScheduleLesson, TeacherEntry } from '../../types';

const scheduleGroups: Record<string, GroupScheduleLesson[]> = {
  '3439': [
    { d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.', u: 'Кафедра ПМИ' },
    { d: '2', t: '11:00', s: 'Физика', p: 'ПЕТРОВ П.П.', u: 'Кафедра Физики' },
    { d: '3', t: '10:00', s: 'Матан', p: 'ИВАНОВ И.И.', u: 'Кафедра ПМИ' },
  ],
  '3440': [
    { d: '1', t: '09:00', s: 'Тервер', p: 'СИДОРОВ С.С.', u: 'Кафедра ПМИ' },
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

describe('collectAllTeachers', () => {
  it('собирает преподавателей из всех групп', () => {
    const result = collectAllTeachers(scheduleGroups, examsGroups);
    const names = result.map((t) => t.teacher);
    expect(names).toContain('ИВАНОВ И.И.');
    expect(names).toContain('ПЕТРОВ П.П.');
    expect(names).toContain('СИДОРОВ С.С.');
  });

  it('не дублирует преподавателей из разных групп', () => {
    const result = collectAllTeachers(scheduleGroups, examsGroups);
    const ivanov = result.filter((t) => t.teacher === 'ИВАНОВ И.И.');
    expect(ivanov).toHaveLength(1);
  });

  it('возвращает [] для пустых данных', () => {
    expect(collectAllTeachers(null, null)).toEqual([]);
    expect(collectAllTeachers({}, {})).toEqual([]);
  });

  it('сортирует по имени', () => {
    const result = collectAllTeachers(scheduleGroups, examsGroups);
    const sorted = [...result].sort((a, b) =>
      a.teacher.localeCompare(b.teacher, 'ru')
    );
    expect(result.map((t) => t.teacher)).toEqual(sorted.map((t) => t.teacher));
  });
});

describe('searchTeachers', () => {
  const entries: TeacherEntry[] = [
    { teacher: 'ИВАНОВ И.И.', departments: [], subjects: [] },
    { teacher: 'ИВАНОВА М.А.', departments: [], subjects: [] },
    { teacher: 'ПЕТРОВ П.П.', departments: [], subjects: [] },
    { teacher: 'СИДОРОВ С.С.', departments: [], subjects: [] },
    { teacher: 'ЁЖИКОВ А.А.', departments: [], subjects: [] },
  ];

  it('пустой запрос — пустой результат', () => {
    expect(searchTeachers(entries, '')).toEqual([]);
    expect(searchTeachers(entries, '   ')).toEqual([]);
  });

  it('находит по началу фамилии', () => {
    const result = searchTeachers(entries, 'иванов');
    expect(result).toHaveLength(2);
    expect(result[0].teacher).toBe('ИВАНОВ И.И.');
  });

  it('регистронезависимый', () => {
    expect(searchTeachers(entries, 'ПЕТРОВ')).toHaveLength(1);
    expect(searchTeachers(entries, 'петров')).toHaveLength(1);
  });

  it('ищет по подстроке', () => {
    const result = searchTeachers(entries, 'ров');
    expect(result.map((t) => t.teacher)).toEqual(
      expect.arrayContaining(['ПЕТРОВ П.П.', 'СИДОРОВ С.С.'])
    );
  });

  it('нормализует ё → е', () => {
    expect(searchTeachers(entries, 'ежиков')).toHaveLength(1);
    expect(searchTeachers(entries, 'ёжиков')).toHaveLength(1);
  });

  it('уважает limit', () => {
    expect(searchTeachers(entries, 'ов', 2)).toHaveLength(2);
  });

  it('ничего не находит', () => {
    expect(searchTeachers(entries, 'zzz')).toEqual([]);
  });
});