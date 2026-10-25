import { describe, it, expect } from 'vitest';
import {
  collectAllStudents,
  formatStudentsForClipboard,
  searchStudents,
} from '../students';
import type { Student, StudentEntry } from '../../types';

const studentsGroups: Record<string, Student[]> = {
  '3439': [
    { student_id: 1, student: 'Иванов Иван', leader: false },
    { student_id: 2, student: 'Петров Пётр', leader: true },
    { student_id: 3, student: 'Сидоров Сидор', leader: false },
  ],
  '3440': [
    { student_id: 4, student: 'Иванова Мария', leader: false },
  ],
};

describe('collectAllStudents', () => {
  it('возвращает [] для null/undefined', () => {
    expect(collectAllStudents(null)).toEqual([]);
    expect(collectAllStudents(undefined)).toEqual([]);
  });

  it('собирает студентов из всех групп', () => {
    const result = collectAllStudents(studentsGroups);
    expect(result).toHaveLength(4);
    expect(result.map((s) => s.group).sort()).toEqual([
      '3439', '3439', '3439', '3440',
    ]);
  });

  it('сохраняет признак старосты', () => {
    const result = collectAllStudents(studentsGroups);
    const petrov = result.find((s) => s.student === 'Петров Пётр');
    expect(petrov?.leader).toBe(true);
  });
});

describe('searchStudents', () => {
  const entries: StudentEntry[] = collectAllStudents(studentsGroups);

  it('пустой запрос — пустой результат', () => {
    expect(searchStudents(entries, '')).toEqual([]);
    expect(searchStudents(entries, '   ')).toEqual([]);
  });

  it('находит по началу фамилии', () => {
    const result = searchStudents(entries, 'иван');
    expect(result.map((r) => r.student.student)).toEqual(
      expect.arrayContaining(['Иванов Иван', 'Иванова Мария'])
    );
  });

  it('регистронезависимый', () => {
    expect(searchStudents(entries, 'ПЕТРОВ')).toHaveLength(1);
    expect(searchStudents(entries, 'петров')).toHaveLength(1);
  });

  it('нормализует ё → е', () => {
    expect(searchStudents(entries, 'петров петр')).toHaveLength(1);
    expect(searchStudents(entries, 'петров пётр')).toHaveLength(1);
  });

  it('находит по группе', () => {
    const result = searchStudents(entries, '3439');
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.student.group === '3439')).toBe(true);
    expect(result.every((r) => r.matchReason === 'group')).toBe(true);
  });

  it('находит по началу номера группы', () => {
    const result = searchStudents(entries, '34');
    expect(result).toHaveLength(4);
  });

  it('имя имеет приоритет над группой', () => {
    const result = searchStudents(entries, 'сидоров');
    expect(result[0].student.student).toBe('Сидоров Сидор');
    expect(result[0].matchReason).toBe('name');
  });

  it('староста выше при равном score', () => {
    const groupEntries: StudentEntry[] = [
      { student: 'Абрамов А.', group: '3439', leader: false },
      { student: 'Абрамов Б.', group: '3439', leader: true },
    ];
    const result = searchStudents(groupEntries, 'абрамов');
    // Оба score 0 (начало фамилии), староста должен быть первым.
    expect(result[0].student.student).toBe('Абрамов Б.');
  });

  it('уважает limit', () => {
    expect(searchStudents(entries, 'иван', 1)).toHaveLength(1);
  });

  it('ничего не находит', () => {
    expect(searchStudents(entries, 'zzz')).toEqual([]);
  });
});

describe('formatStudentsForClipboard', () => {
  it('возвращает пустую строку для пустого массива', () => {
    expect(formatStudentsForClipboard([])).toBe('');
  });

  it('по одному студенту на строку', () => {
    const list: StudentEntry[] = [
      { student: 'Иванов Иван', group: '3439', leader: false },
      { student: 'Петров Пётр', group: '3439', leader: true },
    ];
    expect(formatStudentsForClipboard(list)).toBe(
      'Иванов Иван\nПетров Пётр'
    );
  });
});