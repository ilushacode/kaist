import {
  normalizeAd,
  matchesGroup,
  isAdActive,
  pickAdForGroup,
} from '../ads';
import type { AdRaw, NormalizedAd } from '../../types';

describe('normalizeAd', () => {
  it('возвращает null для null/undefined', () => {
    expect(normalizeAd(null)).toBeNull();
    expect(normalizeAd(undefined)).toBeNull();
  });

  it('возвращает null без image', () => {
    expect(normalizeAd({ caption: 'x' } as AdRaw)).toBeNull();
  });

  it('нормализует полный объект', () => {
    const ad = normalizeAd({
      image: 'https://example.com/img.png',
      target: '3439',
      caption: 'Тест',
      link: 'https://example.com',
    });
    expect(ad).not.toBeNull();
    expect(ad?.target).toBe('3439');
    expect(ad?.image).toBe('https://example.com/img.png');
  });

  it('подставляет **** для пустого target', () => {
    const ad = normalizeAd({ image: 'x.png' });
    expect(ad?.target).toBe('****');
  });
});

describe('matchesGroup', () => {
  it('точное совпадение', () => {
    expect(matchesGroup('3439', '3439')).toBe(true);
  });

  it('звёздочка в шаблоне — wildcard', () => {
    expect(matchesGroup('3**9', '3439')).toBe(true);
    expect(matchesGroup('3**9', '3430')).toBe(false);
  });

  it('не совпадает по длине', () => {
    expect(matchesGroup('343', '3439')).toBe(false);
    expect(matchesGroup('34390', '3439')).toBe(false);
  });
});

describe('isAdActive', () => {
  const today = new Date(2025, 8, 8);

  it('true без дат', () => {
    const ad: NormalizedAd = {
      id: 'x',
      target: '****',
      caption: '',
      image: 'x',
      link: '',
      startDate: null,
      endDate: null,
    };
    expect(isAdActive(ad, today)).toBe(true);
  });

  it('false если startDate в будущем', () => {
    const ad: NormalizedAd = {
      id: 'x',
      target: '****',
      caption: '',
      image: 'x',
      link: '',
      startDate: new Date(2025, 9, 1),
      endDate: null,
    };
    expect(isAdActive(ad, today)).toBe(false);
  });

  it('false если endDate в прошлом', () => {
    const ad: NormalizedAd = {
      id: 'x',
      target: '****',
      caption: '',
      image: 'x',
      link: '',
      startDate: null,
      endDate: new Date(2025, 7, 1),
    };
    expect(isAdActive(ad, today)).toBe(false);
  });
});

describe('pickAdForGroup', () => {
  const today = new Date(2025, 8, 8);

  it('возвращает null для пустого массива', () => {
    expect(pickAdForGroup([], '3439', today)).toBeNull();
  });

  it('возвращает null для null-группы', () => {
    expect(pickAdForGroup([{ image: 'x', target: '3439' }], null, today)).toBeNull();
  });

  it('возвращает null, если ни одна не подходит', () => {
    expect(
      pickAdForGroup([{ image: 'x', target: '9999' }], '3439', today)
    ).toBeNull();
  });

  it('возвращает подходящую рекламу', () => {
    const ads: AdRaw[] = [{ image: 'x', target: '3**9' }];
    const result = pickAdForGroup(ads, '3439', today);
    expect(result).not.toBeNull();
    expect(result?.target).toBe('3**9');
  });

  it('исключает скрытые', () => {
    const ads: AdRaw[] = [{ image: 'x', target: '3439' }];
    const hidden = new Set(['x::3439']);
    expect(pickAdForGroup(ads, '3439', today, hidden)).toBeNull();
  });
});