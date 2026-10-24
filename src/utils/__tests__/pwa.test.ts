import { describe, it, expect } from 'vitest';
import { isStandaloneMode, isMobileDevice } from '../pwa';

describe('isStandaloneMode', () => {
  it('возвращает boolean', () => {
    expect(typeof isStandaloneMode()).toBe('boolean');
  });

  it('в jsdom без standalone-режима возвращает false', () => {
    expect(isStandaloneMode()).toBe(false);
  });
});

describe('isMobileDevice', () => {
  it('возвращает boolean', () => {
    expect(typeof isMobileDevice()).toBe('boolean');
  });
});