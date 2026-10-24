import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchJson, fetchGzipJson, isCancelError } from '../client';

describe('isCancelError', () => {
  it('true для AbortError', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(isCancelError(err)).toBe(true);
  });
  it('true для TimeoutError', () => {
    const err = new Error('timeout');
    err.name = 'TimeoutError';
    expect(isCancelError(err)).toBe(true);
  });
  it('false для обычной ошибки', () => {
    expect(isCancelError(new Error('x'))).toBe(false);
  });
  it('false для null', () => {
    expect(isCancelError(null)).toBe(false);
  });
});

describe('fetchJson', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('возвращает JSON', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ a: 1 }),
    });
    const result = await fetchJson<{ a: number }>('http://x');
    expect(result).toEqual({ a: 1 });
  });

  it('бросает при не-ok статусе', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    await expect(fetchJson('http://x')).rejects.toThrow('HTTP 404');
  });
});

describe('fetchGzipJson', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('читает json() при Content-Encoding: gzip', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-encoding' ? 'gzip' : null,
      },
      json: async () => ({ a: 1 }),
    });
    await expect(fetchGzipJson('http://x')).resolves.toEqual({ a: 1 });
  });

  it('парсит как JSON, если пришёл уже распакованный текст', async () => {
    const json = JSON.stringify({ b: 2 });
    const bytes = new Uint8Array(json.length);
    for (let i = 0; i < json.length; i++) {
      bytes[i] = json.charCodeAt(i) & 0xff;
    }

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => bytes.buffer,
    });
    await expect(fetchGzipJson('http://x')).resolves.toEqual({ b: 2 });
  });

  it('возвращает null, если сервер вернул пустое тело (Content-Encoding: gzip)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-encoding' ? 'gzip' : null,
      },
      json: async () => null,
    });
    await expect(fetchGzipJson('http://x')).resolves.toBeNull();
  });

  it('бросает при битом gzip (нет DecompressionStream и pako)', async () => {
    const gzipMagic = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00]);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => gzipMagic.buffer,
    });
    await expect(fetchGzipJson('http://x')).rejects.toThrow();
  });

  it('бросает при не-ok статусе', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    await expect(fetchGzipJson('http://x')).rejects.toThrow('HTTP 500');
  });

  it('уважает отмену через signal', async () => {
    const controller = new AbortController();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      return new Promise((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });
    const promise = fetchGzipJson('http://x', { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});