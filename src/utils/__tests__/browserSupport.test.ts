import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkBrowserSupport } from '../browserSupport';

describe('checkBrowserSupport', () => {
  const originalIndexedDB = globalThis.indexedDB;
  const originalCaches = (globalThis as any).caches;
  const originalFetch = globalThis.fetch;
  const originalSW = (navigator as any).serviceWorker;

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.indexedDB = originalIndexedDB;
    (globalThis as any).caches = originalCaches;
    globalThis.fetch = originalFetch;
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalSW,
    });
  });

  it('всё ок в happy path', async () => {
    const report = await checkBrowserSupport();
    // В jsdom обычно: localStorage работает, fetch есть,
    // indexedDB = undefined → значит будет issue indexeddb.
    expect(report).toHaveProperty('ok');
    expect(Array.isArray(report.issues)).toBe(true);
  });

  it('ловит отсутствие fetch', async () => {
    // @ts-expect-error — намеренно ломаем
    globalThis.fetch = undefined;
    const report = await checkBrowserSupport();
    expect(report.issues).toContain('fetch');
  });

  it('ловит отсутствие localStorage', async () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const report = await checkBrowserSupport();
    expect(report.issues).toContain('localstorage');
    spy.mockRestore();
  });

  it('ловит отсутствие caches', async () => {
    (globalThis as any).caches = undefined;
    const report = await checkBrowserSupport();
    expect(report.issues).toContain('cachestorage');
  });

  it('ловит отсутствие serviceWorker', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
    });
    const report = await checkBrowserSupport();
    expect(report.issues).toContain('serviceworker');
  });
});