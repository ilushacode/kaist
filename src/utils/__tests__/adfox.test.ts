import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  createContainerId,
  getAdfoxQueue,
  isAdfoxReady,
  isAdsEnabled,
  renderAdfoxBlock,
  whenAdfoxReady,
} from '../adfox';
import type { AdfoxUnit } from '../../config';

const UNIT: AdfoxUnit = {
  name: 'schedule-default',
  ownerId: 330181,
  params: { p1: 'dsoze', p2: 'jwhj' },
};

const clearGlobals = () => {
  delete window.Ya;
  delete window.yaContextCb;
  delete window.__adsEnabled;
};

afterEach(() => {
  clearGlobals();
  vi.restoreAllMocks();
});

describe('isAdsEnabled', () => {
  it('false, пока загрузчик не подключён (флаг из index.html не выставлен)', () => {
    expect(isAdsEnabled()).toBe(false);
  });

  it('true после подключения загрузчика', () => {
    window.__adsEnabled = true;
    expect(isAdsEnabled()).toBe(true);
  });
});

describe('isAdfoxReady', () => {
  it('false, пока загрузчик не инициализировал adfoxCode', () => {
    expect(isAdfoxReady()).toBe(false);
  });

  it('true, когда Ya.adfoxCode доступен', () => {
    window.Ya = { adfoxCode: { create: vi.fn() } };
    expect(isAdfoxReady()).toBe(true);
  });
});

describe('getAdfoxQueue', () => {
  it('создаёт очередь, если её нет', () => {
    const queue = getAdfoxQueue();
    expect(Array.isArray(queue)).toBe(true);
    expect(window.yaContextCb).toBe(queue);
  });

  it('не перезаписывает существующую очередь', () => {
    const existing: Array<() => void> = [vi.fn()];
    window.yaContextCb = existing;
    expect(getAdfoxQueue()).toBe(existing);
  });
});

describe('whenAdfoxReady', () => {
  it('выполняет колбэк сразу, если SDK уже загружен', () => {
    window.Ya = { adfoxCode: { create: vi.fn() } };
    const callback = vi.fn();

    whenAdfoxReady(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    // Очередь не создаётся: рендер выполнился сразу.
    expect(window.yaContextCb).toBeUndefined();
  });

  it('ставит колбэк в очередь и выполняет его после загрузки SDK', () => {
    const callback = vi.fn();

    whenAdfoxReady(callback);

    expect(callback).not.toHaveBeenCalled();
    expect(window.yaContextCb).toHaveLength(1);

    window.yaContextCb?.forEach((fn) => fn());

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('renderAdfoxBlock', () => {
  it('передаёт ownerId, containerId и параметры в adfoxCode.create', () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    renderAdfoxBlock(UNIT, 'adfox_schedule-top_1');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 330181,
        containerId: 'adfox_schedule-top_1',
        params: { p1: 'dsoze', p2: 'jwhj' },
      })
    );
  });

  it('передаёт копию параметров, а не тот же объект', () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    renderAdfoxBlock(UNIT, 'adfox_host');

    const passed = create.mock.calls[0][0] as { params: Record<string, string> };
    expect(passed.params).not.toBe(UNIT.params);
    expect(passed.params).toEqual(UNIT.params);
  });

  it('прокидывает onRender/onError/onStub в AdFox', () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };
    const handlers = {
      onRender: vi.fn(),
      onError: vi.fn(),
      onStub: vi.fn(),
    };

    renderAdfoxBlock(UNIT, 'adfox_host', handlers);

    const options = create.mock.calls[0][0] as {
      onRender: () => void;
      onError: (error: unknown) => void;
      onStub: () => void;
    };
    options.onRender();
    options.onStub();
    expect(handlers.onRender).toHaveBeenCalledTimes(1);
    expect(handlers.onStub).toHaveBeenCalledTimes(1);
    expect(handlers.onError).not.toHaveBeenCalled();
  });

  it('не пропускает исключение SDK наружу, а отдаёт его в onError', () => {
    const error = new Error('CONTAINER_NOT_FOUND');
    window.Ya = {
      adfoxCode: {
        create: () => {
          throw error;
        },
      },
    };
    const onError = vi.fn();

    expect(() => renderAdfoxBlock(UNIT, 'adfox_host', { onError })).not.toThrow();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('возвращает false, если SDK ещё нет', () => {
    expect(renderAdfoxBlock(UNIT, 'adfox_host')).toBe(false);
  });
});

describe('createContainerId', () => {
  it('возвращает уникальные безопасные id с префиксом adfox_', () => {
    const first = createContainerId('schedule-top');
    const second = createContainerId('schedule-top');

    expect(first).not.toBe(second);
    expect(first).toMatch(/^adfox_[a-zA-Z0-9_-]+$/);
  });

  it('заменяет символы, недопустимые в CSS-селекторе', () => {
    expect(createContainerId('a/b.c:d')).toMatch(/^adfox_[a-zA-Z0-9_-]+$/);
  });
});
