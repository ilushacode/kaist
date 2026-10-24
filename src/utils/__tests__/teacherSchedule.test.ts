import { describe, it, expect } from 'vitest';
import {
  buildTeacherLessons,
  getTeacherLessonsForDate,
  getTeacherExams,
  getTeacherSubjects,
  hasLessonsOnDate,
} from '../teacherSchedule';
import type { GroupExamRaw, GroupScheduleLesson } from '../../types';

const TEACHER = 'ИВАНОВ ИВАН ИВАНОВИЧ';
const OTHER = 'ПЕТРОВ ПЁТР ПЕТРОВИЧ';

const scheduleGroups: Record<string, GroupScheduleLesson[]> = {
  '3439': [
    { d: '1', t: '09:00', s: 'Матан', k: 'лек', p: TEACHER, a: '423', b: '3', ds: ['чет'] },
    { d: '1', t: '09:00', s: 'Матан', k: 'лек', p: TEACHER, a: '423', b: '3', ds: ['чет'] },
    { d: '2', t: '11:00', s: 'Физика', k: 'пр', p: TEACHER, a: '201', b: '2' },
    { d: '3', t: '10:00', s: 'Химия', k: 'пр', p: OTHER, a: '305', b: '1' },
  ],
  '3440': [
    { d: '1', t: '09:00', s: 'Матан', k: 'лек', p: TEACHER, a: '423', b: '3', ds: ['чет'] },
    { d: '4', t: '15:00', s: 'Тервер', k: 'лек', p: TEACHER, a: '410', b: '3' },
  ],
};

const examsGroups: Record<string, GroupExamRaw[]> = {
  '3439': [
    { s: 'Матан', tm: '10:00', a: '423', b: '3', p: TEACHER, dt: '15.06' },
  ],
  '3440': [
    { s: 'Физика', tm: '09:00', a: '201', b: '2', p: OTHER, dt: '18.06' },
  ],
};

describe('buildTeacherLessons', () => {
  it('возвращает [] для пустого имени', () => {
    expect(buildTeacherLessons('', scheduleGroups, examsGroups)).toEqual([]);
    expect(
      buildTeacherLessons(null as unknown as string, scheduleGroups, null)
    ).toEqual([]);
  });

  it('находит занятия преподавателя во всех группах', () => {
    const refs = buildTeacherLessons(TEACHER, scheduleGroups, null);
    expect(refs).toHaveLength(5);
    expect(refs.every((r) => r.lesson.p === TEACHER)).toBe(true);
  });

  it('не находит чужие занятия', () => {
    const refs = buildTeacherLessons(OTHER, scheduleGroups, null);
    expect(refs).toHaveLength(1);
    expect(refs[0].group).toBe('3439');
  });

  it('учитывает экзамены', () => {
    const refs = buildTeacherLessons(TEACHER, null, examsGroups);
    expect(refs).toHaveLength(1);
    expect(refs[0].isExam).toBe(true);
    expect(refs[0].group).toBe('3439');
  });

  it('нормализует имя (регистр, пробелы)', () => {
    const refs = buildTeacherLessons('  иванов   иван иванович  ', scheduleGroups, null);
    expect(refs).toHaveLength(5);
  });

  it('работает с null/undefined', () => {
    expect(buildTeacherLessons(TEACHER, null, null)).toEqual([]);
    expect(buildTeacherLessons(TEACHER, undefined, undefined)).toEqual([]);
  });
});

describe('getTeacherLessonsForDate', () => {
  const refs = buildTeacherLessons(TEACHER, scheduleGroups, examsGroups);
  const monday = new Date(2025, 8, 15);
  monday.setHours(0, 0, 0, 0);

  it('фильтрует по дню недели и схлопывает дубли у разных групп', () => {
    const result = getTeacherLessonsForDate(refs, monday);
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('Матан');
    expect([...result[0].groups].sort()).toEqual(['3439', '3440']);
  });

  it('возвращает [] для дня без пар', () => {
    const saturday = new Date(2025, 8, 20);
    saturday.setHours(0, 0, 0, 0);
    expect(getTeacherLessonsForDate(refs, saturday)).toEqual([]);
  });

  it('исключает экзамены', () => {
    const result = getTeacherLessonsForDate(refs, monday);
    expect(result.every((r) => !r.isExam)).toBe(true);
  });

  it('сортирует по времени', () => {
    const tuesday = new Date(2025, 8, 16);
    tuesday.setHours(0, 0, 0, 0);
    const result = getTeacherLessonsForDate(refs, tuesday);
    expect(result).toHaveLength(1);
    expect(result[0].time).toBe('11:00');
  });
});

describe('getTeacherExams', () => {
  const refs = buildTeacherLessons(TEACHER, scheduleGroups, examsGroups);

  it('возвращает только экзамены', () => {
    const exams = getTeacherExams(refs);
    expect(exams).toHaveLength(1);
    expect(exams[0].isExam).toBe(true);
    expect(exams[0].subject).toBe('Матан');
  });

  it('возвращает [] если экзаменов нет', () => {
    const refsNoExam = buildTeacherLessons(TEACHER, scheduleGroups, null);
    expect(getTeacherExams(refsNoExam)).toEqual([]);
  });
});

describe('hasLessonsOnDate', () => {
  const refs = buildTeacherLessons(TEACHER, scheduleGroups, null);
  const monday = new Date(2025, 8, 15);
  monday.setHours(0, 0, 0, 0);
  const saturday = new Date(2025, 8, 20);
  saturday.setHours(0, 0, 0, 0);

  it('true для дня с парами', () => {
    expect(hasLessonsOnDate(refs, monday)).toBe(true);
  });

  it('false для пустого дня', () => {
    expect(hasLessonsOnDate(refs, saturday)).toBe(false);
  });

  it('игнорирует экзамены', () => {
    const examRefs = buildTeacherLessons(TEACHER, null, examsGroups);
    expect(hasLessonsOnDate(examRefs, monday)).toBe(false);
  });
});

describe('getTeacherSubjects', () => {
  it('возвращает уникальные предметы, отсортированные', () => {
    const refs = buildTeacherLessons(TEACHER, scheduleGroups, examsGroups);
    const subjects = getTeacherSubjects(refs);
    expect(subjects).toContain('Матан');
    expect(subjects).toContain('Физика');
    expect(subjects).toContain('Тервер');
    expect(subjects).not.toContain('Химия');
  });

  it('возвращает [] если предметов нет', () => {
    expect(getTeacherSubjects([])).toEqual([]);
  });
});