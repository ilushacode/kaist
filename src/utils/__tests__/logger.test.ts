import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initLogger,
  flushLogs,
  resetLoggerForTests,
} from '../logger';

// Мокаем store — логгер читает selectedGroup и theme.
vi.mock('../../hooks/useStore', () => ({
  useStore: {
    getState: () => ({
      selectedGroup: '3439',
      theme: 'dark',
    }),
  },
}));

// Мокаем deviceId, чтобы не зависеть от localStorage.
vi.mock('../deviceId', () => ({
  getOrCreateDeviceId: () => 'a1b2c3d4e5f67890',
}));

describe('logger', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    initLogger();
  });

  afterEach(() => {
    resetLoggerForTests();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('перехватывает console.error и отправляет запись', async () => {
    console.error(new Error('test error'));
    await flushLogs();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/logs');
    expect(options.headers['X-Device-Id']).toBe('a1b2c3d4e5f67890');

    const body = JSON.parse(await (options.body as Blob).text());
    expect(body).toHaveLength(1);
    expect(body[0].level).toBe('error');
    expect(body[0].msg).toContain('test error');
    expect(body[0].group).toBe('3439');
    expect(body[0].theme).toBe('dark');
  });

  it('перехватывает console.warn', async () => {
    console.warn('test warning');
    await flushLogs();

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(await (options.body as Blob).text());
    expect(body[0].level).toBe('warn');
    expect(body[0].msg).toBe('test warning');
  });

  it('дедуплицирует одинаковые ошибки в окне', async () => {
    console.error(new Error('dup'));
    console.error(new Error('dup'));
    await flushLogs();

    // Обе схлопнулись в одну запись (вторая не попала в очередь).
    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(await (options.body as Blob).text());
    expect(body).toHaveLength(1);
  });

  it('не отправляет пустой батч', async () => {
    await flushLogs();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('перехватывает unhandledrejection', async () => {
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(new Error('rejected')),
      reason: new Error('rejected'),
    });
    window.dispatchEvent(event);
    await flushLogs();

    expect(globalThis.fetch).toHaveBeenCalled();
  });
});