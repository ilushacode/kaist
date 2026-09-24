import { fetchJson, isCancelError } from '../client';

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
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('возвращает JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ a: 1 }),
    });
    const result = await fetchJson<{ a: number }>('http://x');
    expect(result).toEqual({ a: 1 });
  });

  it('бросает при не-ok статусе', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    await expect(fetchJson('http://x')).rejects.toThrow('HTTP 404');
  });
});