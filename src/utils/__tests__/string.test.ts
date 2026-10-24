import { describe, it, expect } from 'vitest';
import { capitalizeName, formatBuilding } from '../string';

describe('capitalizeName', () => {
  it('делает первую букву заглавной', () => {
    expect(capitalizeName('иванов иван')).toBe('Иванов Иван');
  });
  it('сохраняет инициалы', () => {
    expect(capitalizeName('иванов и.и.')).toBe('Иванов И.И.');
  });
  it('возвращает пустую строку для null', () => {
    expect(capitalizeName(null)).toBe('');
    expect(capitalizeName(undefined)).toBe('');
    expect(capitalizeName('')).toBe('');
  });
});

describe('formatBuilding', () => {
  it('добавляет "Здание" к числу', () => {
    expect(formatBuilding('301')).toBe('Здание 301');
  });
  it('не трогает нечисловые значения', () => {
    expect(formatBuilding('Корпус А')).toBe('Корпус А');
  });
  it('возвращает пустую строку для null', () => {
    expect(formatBuilding(null)).toBe('');
    expect(formatBuilding(undefined)).toBe('');
  });
});