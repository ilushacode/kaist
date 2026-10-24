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

const createController = (
  signal: AbortSignal | undefined,
  timeout: number
): { controller: AbortController; cleanup: () => void } => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException('timeout', 'TimeoutError')),
    timeout
  );
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);

  return {
    controller,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    },
  };
};

/** Обычный JSON-запрос. */
export const fetchJson = async <T = unknown>(
  url: string,
  { signal, timeout = REQUEST_TIMEOUT_MS }: FetchOptions = {}
): Promise<T> => {
  const { controller, cleanup } = createController(signal, timeout);
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
    cleanup();
  }
};

/**
 * Приводит Uint8Array к виду, который TS 5.7+ принимает как BlobPart.
 * Причина: тип Uint8Array<ArrayBufferLike> не совместим с BlobPart,
 * потому что buffer может быть SharedArrayBuffer.
 */
const toBlobPart = (bytes: Uint8Array): BlobPart => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy as BlobPart;
};

/** Распаковка «сырых» gzip-байтов через DecompressionStream или pako. */
const gunzipToText = async (bytes: Uint8Array): Promise<string> => {
  if (typeof DecompressionStream !== 'undefined') {
    const stream = new Blob([toBlobPart(bytes)])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }

  try {
    const pako = await import('pako');
    return pako.ungzip(bytes, { to: 'string' });
  } catch {
    throw new Error(
      'gzip: neither DecompressionStream nor pako is available'
    );
  }
};

/**
 * Запрос gzip-сжатого JSON.
 *
 *  1. Сервер отдаёт `Content-Encoding: gzip` → браузер распаковывает
 *     автоматически, читаем `response.json()`.
 *  2. Сервер отдаёт «сырые» байты gzip → распаковываем сами через
 *     `DecompressionStream('gzip')` или `pako` (fallback).
 *  3. Пришёл уже распакованный JSON — читаем как текст.
 */
export const fetchGzipJson = async <T = unknown>(
  url: string,
  { signal, timeout = REQUEST_TIMEOUT_MS }: FetchOptions = {}
): Promise<T> => {
  const { controller, cleanup } = createController(signal, timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const encoding = (response.headers.get('content-encoding') || '').toLowerCase();
    if (encoding.includes('gzip')) {
      return (await response.json()) as T;
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

    if (!isGzip) {
      const text = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(text) as T;
    }

    const text = await gunzipToText(bytes);
    return JSON.parse(text) as T;
  } finally {
    cleanup();
  }
};