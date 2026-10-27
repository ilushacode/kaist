import { UAParser } from 'ua-parser-js';
import { API_BASE } from '../config';
import { getOrCreateDeviceId } from './deviceId';
import { useStore } from '../hooks/useStore';

// ─── Константы ───────────────────────────────────────────────

const LOG_ENDPOINT = `${API_BASE}/api/logs`;
const MAX_BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 15_000;
const DEDUPE_WINDOW_MS = 30_000;
const MAX_STACK_LINES = 12;
const MAX_MSG_LENGTH = 500;

// ─── Типы ────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  level: 'error' | 'warn';
  msg: string;
  stack: string;
  url: string;
  group: string;
  theme: string;
  device: string;
  browser: string;
  os: string;
  pwa: boolean;
  online: boolean;
  ts: number;
  cnt: number;
}

// ─── Состояние ───────────────────────────────────────────────

let initialized = false;
let queue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

/** Кэш дедупликации: ключ → { lastSent, count } */
const dedupeCache = new Map<string, { lastSent: number; count: number }>();

/** Оригинальные методы console (восстанавливаем при reset). */
const originalConsole = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
};

// ─── Определение окружения ───────────────────────────────────

let cachedEnv: {
  device: string;
  browser: string;
  os: string;
  pwa: boolean;
} | null = null;

function detectEnvironment(): {
  device: string;
  browser: string;
  os: string;
  pwa: boolean;
} {
  if (cachedEnv) return cachedEnv;

  const parser = new UAParser();
  const result = parser.getResult();

  const deviceType = result.device.type ?? 'desktop';
  const vendor = result.device.vendor ?? '';
  const model = result.device.model ?? '';
  const device = [deviceType, vendor, model].filter(Boolean).join(':');

  const browser = [result.browser.name, result.browser.major]
    .filter(Boolean)
    .join(':');

  const os = [result.os.name, result.os.version].filter(Boolean).join(':');

  const isPwa =
    (typeof window !== 'undefined' &&
      window.matchMedia?.('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  cachedEnv = {
    device: device || 'unknown',
    browser: browser || 'unknown',
    os: os || 'unknown',
    pwa: Boolean(isPwa),
  };

  return cachedEnv;
}

// ─── Утилиты ─────────────────────────────────────────────────

function generateId(): string {
  // Компактный ID: base36 от времени + случайность.
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function truncateStack(stack: string): string {
  if (!stack) return '';
  const lines = stack.split('\n');
  if (lines.length <= MAX_STACK_LINES) return stack;
  return lines.slice(0, MAX_STACK_LINES).join('\n') + '\n...';
}

function truncateMsg(msg: string): string {
  if (msg.length <= MAX_MSG_LENGTH) return msg;
  return msg.slice(0, MAX_MSG_LENGTH) + '…';
}

/** Безопасно сериализует аргументы console в строку. */
function stringifyArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      }
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return '[object]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

/** Извлекает стек из Error или из аргументов console. */
function extractStack(args: unknown[]): string {
  for (const arg of args) {
    if (arg instanceof Error && arg.stack) {
      return truncateStack(arg.stack);
    }
  }
  return '';
}

// ─── Формирование записи ─────────────────────────────────────

function buildEntry(level: 'error' | 'warn', args: unknown[]): LogEntry {
  const env = detectEnvironment();
  const state = useStore.getState();

  return {
    id: generateId(),
    level,
    msg: truncateMsg(stringifyArgs(args)),
    stack: extractStack(args),
    url: typeof location !== 'undefined' ? location.pathname : '',
    group: state.selectedGroup ?? '',
    theme: state.theme ?? 'auto',
    device: env.device,
    browser: env.browser,
    os: env.os,
    pwa: env.pwa,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    ts: Date.now(),
    cnt: 1,
  };
}

// ─── Дедупликация ────────────────────────────────────────────

function shouldSend(entry: LogEntry): boolean {
  const key = `${entry.level}|${entry.msg}|${entry.stack.split('\n')[0] ?? ''}`;
  const now = Date.now();
  const cached = dedupeCache.get(key);

  if (cached && now - cached.lastSent < DEDUPE_WINDOW_MS) {
    // Не отправляем, но увеличиваем счётчик — при следующей отправке
    // (после окна) он покажет, сколько раз ошибка повторилась.
    cached.count += 1;
    return false;
  }

  // Если это повтор после окна — обновляем cnt и отправляем.
  if (cached) {
    entry.cnt = cached.count + 1;
  }

  dedupeCache.set(key, { lastSent: now, count: 0 });

  // Чистим старые ключи, чтобы Map не рос бесконечно.
  if (dedupeCache.size > 200) {
    const cutoff = now - DEDUPE_WINDOW_MS * 2;
    for (const [k, v] of dedupeCache) {
      if (v.lastSent < cutoff) dedupeCache.delete(k);
    }
  }

  return true;
}

// ─── Отправка ────────────────────────────────────────────────

async function compressGzip(data: string): Promise<Blob | null> {
  try {
    if (typeof CompressionStream === 'undefined') return null;
    const stream = new Blob([data])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    return await new Response(stream).blob();
  } catch {
    return null;
  }
}

async function sendBatch(entries: LogEntry[], useKeepalive = false): Promise<void> {
  if (entries.length === 0) return;

  const json = JSON.stringify(entries);
  const gzipBlob = await compressGzip(json);

  const body = gzipBlob ?? new Blob([json], { type: 'application/json' });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-Id': getOrCreateDeviceId(),
  };

  if (gzipBlob) {
    headers['Content-Encoding'] = 'gzip';
  }

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers,
      body,
      keepalive: useKeepalive,
      cache: 'no-store',
    });
  } catch {
    // Не логируем ошибку отправки в консоль — иначе бесконечный цикл.
    // Просто теряем батч; следующая ошибка попробует снова.
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush(useKeepalive = false): Promise<void> {
  if (isFlushing || queue.length === 0) return;
  isFlushing = true;

  const batch = queue.splice(0, MAX_BATCH_SIZE);
  await sendBatch(batch, useKeepalive);

  isFlushing = false;

  if (queue.length > 0) {
    scheduleFlush();
  }
}

// ─── Перехват ────────────────────────────────────────────────

function interceptConsole(): void {
  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    const entry = buildEntry('error', args);
    if (shouldSend(entry)) {
      queue.push(entry);
      scheduleFlush();
      if (queue.length >= MAX_BATCH_SIZE) void flush();
    }
  };

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    const entry = buildEntry('warn', args);
    if (shouldSend(entry)) {
      queue.push(entry);
      scheduleFlush();
      if (queue.length >= MAX_BATCH_SIZE) void flush();
    }
  };
}

function interceptGlobalErrors(): void {
  window.addEventListener('error', (event) => {
    const entry = buildEntry('error', [
      event.error ?? `${event.message} at ${event.filename}:${event.lineno}`,
    ]);
    if (shouldSend(entry)) {
      queue.push(entry);
      scheduleFlush();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const entry = buildEntry('error', [
      event.reason instanceof Error
        ? event.reason
        : `Unhandled rejection: ${String(event.reason)}`,
    ]);
    if (shouldSend(entry)) {
      queue.push(entry);
      scheduleFlush();
    }
  });
}

function interceptPageHide(): void {
  // pagehide — последний надёжный момент для отправки.
  // visibilitychange тоже ловим, но только при hidden.
  const handler = () => {
    if (document.visibilityState === 'hidden') {
      void flush(true);
    }
  };

  window.addEventListener('pagehide', () => void flush(true));
  document.addEventListener('visibilitychange', handler);
}

// ─── Публичный API ───────────────────────────────────────────

/**
 * Инициализирует логгер. Вызывать один раз при старте приложения
 * (до рендера React, чтобы перехватить ошибки инициализации).
 */
export function initLogger(): void {
  if (initialized) return;
  initialized = true;

  // Предзагружаем окружение, чтобы первая ошибка не тормозила.
  detectEnvironment();

  interceptConsole();
  interceptGlobalErrors();
  interceptPageHide();
}

/**
 * Принудительно отправляет накопленные логи.
 * Используется в тестах и при отладке.
 */
export function flushLogs(): Promise<void> {
  return flush(false);
}

/**
 * Восстанавливает оригинальные методы console.
 * Только для тестов — в проде не вызывается.
 */
export function resetLoggerForTests(): void {
  if (!initialized) return;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  queue = [];
  dedupeCache.clear();
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  initialized = false;
}