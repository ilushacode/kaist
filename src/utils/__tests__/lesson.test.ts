import { describe, it, expect } from 'vitest';
import { getLessonType, getLessonTypeLabel, LESSON_TYPE_LABELS } from '../lesson';

describe('getLessonType', () => {
  it('маппит "лек" в "lec"', () => {
    expect(getLessonType('лек')).toBe('lec');
  });
  it('маппит "пр" в "prac"', () => {
    expect(getLessonType('пр')).toBe('prac');
  });
  it('маппит "л.р." в "lab"', () => {
    expect(getLessonType('л.р.')).toBe('lab');
  });
  it('возвращает входное значение для неизвестных', () => {
    expect(getLessonType('unknown')).toBe('unknown');
  });
  it('возвращает пустую строку для null', () => {
    expect(getLessonType(null)).toBe('');
    expect(getLessonType(undefined)).toBe('');
  });
});

describe('getLessonTypeLabel', () => {
  it('возвращает лейбл для lec', () => {
    expect(getLessonTypeLabel('lec')).toBe(LESSON_TYPE_LABELS.lec);
  });
  it('возвращает "Неизвестно" для неизвестного типа', () => {
    expect(getLessonTypeLabel('unknown')).toBe('Неизвестно');
  });
});