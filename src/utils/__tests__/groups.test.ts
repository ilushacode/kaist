import { listGroups, searchGroups, normalizeGroupInput } from '../groups';

const mockGroups = {
  '3439': [],
  '3410': [],
  '4191': [],
  '3100': [],
};

describe('listGroups', () => {
  it('возвращает отсортированные ключи', () => {
    expect(listGroups(mockGroups)).toEqual(['3100', '3410', '3439', '4191']);
  });
  it('возвращает [] для null', () => {
    expect(listGroups(null)).toEqual([]);
  });
});

describe('searchGroups', () => {
  it('ищет по началу строки', () => {
    expect(searchGroups(mockGroups, '34')).toEqual(['3410', '3439']);
  });
  it('не находит по середине', () => {
    expect(searchGroups(mockGroups, '43')).toEqual([]);
  });
  it('уважает limit', () => {
    expect(searchGroups(mockGroups, '3', 2)).toEqual(['3100', '3410']);
  });
  it('пустой запрос — пустой результат', () => {
    expect(searchGroups(mockGroups, '')).toEqual([]);
    expect(searchGroups(mockGroups, '   ')).toEqual([]);
  });
});

describe('normalizeGroupInput', () => {
  it('оставляет только цифры', () => {
    expect(normalizeGroupInput('34a39')).toBe('3439');
  });
  it('обрезает до 4 символов', () => {
    expect(normalizeGroupInput('123456')).toBe('1234');
  });
  it('для null возвращает пустую строку', () => {
    expect(normalizeGroupInput(null)).toBe('');
  });
});