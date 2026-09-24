import { REQUEST_TIMEOUT_MS } from '../config';

interface FetchOptions {
  signal?: AbortSignal;
  timeout?: number;
}

export const isCancelError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: string }).name;
  return name === 'AbortError' || name === 'TimeoutError';
};

export const fetchJson = async <T = unknown>(
  url: string,
  { signal, timeout = REQUEST_TIMEOUT_MS }: FetchOptions = {}
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException('timeout', 'TimeoutError')),
    timeout
  );
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
};