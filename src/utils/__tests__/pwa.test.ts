import { isStandaloneMode, isMobileDevice } from '../pwa';

describe('isStandaloneMode', () => {
  it('в dev-режиме возвращает true', () => {
    expect(isStandaloneMode()).toBe(true);
  });
});

describe('isMobileDevice', () => {
  it('возвращает boolean', () => {
    expect(typeof isMobileDevice()).toBe('boolean');
  });
});