import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initLogger,
  flushLogs,
  resetLoggerForTests,
} from '../logger';
import { API_BASE } from '../../config';

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

const LOG_URL = `${API_BASE}/api/logs`;

/**
 * jsdom-овский Blob не всегда умеет `text()`, поэтому читаем через FileReader.
 * Тело без gzip: в beforeEach отключаем CompressionStream.
 */
const readBody = (body: unknown): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!(body instanceof Blob)) {
      reject(new Error('Ожидался Blob в теле запроса'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(body);
  });

describe('logger', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Без сжатия: иначе тело запроса — gzip, и JSON не прочитать.
    vi.stubGlobal('CompressionStream', undefined);
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    initLogger();
  });

  afterEach(() => {
    resetLoggerForTests();
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('перехватывает console.error и отправляет запись', async () => {
    console.error(new Error('test error'));
    await flushLogs();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(LOG_URL);
    expect(options.headers['X-Device-Id']).toBe('a1b2c3d4e5f67890');

    const body = JSON.parse(await readBody(options.body));
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
    const body = JSON.parse(await readBody(options.body));
    expect(body[0].level).toBe('warn');
    expect(body[0].msg).toBe('test warning');
  });

  it('дедуплицирует одинаковые ошибки в окне', async () => {
    console.error(new Error('dup'));
    console.error(new Error('dup'));
    await flushLogs();

    // Обе схлопнулись в одну запись (вторая не попала в очередь).
    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(await readBody(options.body));
    expect(body).toHaveLength(1);
  });

  it('не отправляет пустой батч', async () => {
    await flushLogs();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('перехватывает unhandledrejection', async () => {
    // PromiseRejectionEvent в jsdom нет — собираем событие вручную.
    const event = new Event('unhandledrejection') as Event & { reason?: unknown };
    Object.defineProperty(event, 'reason', { value: new Error('rejected') });

    window.dispatchEvent(event);
    await flushLogs();

    expect(globalThis.fetch).toHaveBeenCalled();
  });
});
