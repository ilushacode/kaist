import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { AdBanner } from '../AdBanner';
import { AD_PLACEMENTS, type AdPlacement } from '../../config';

const firstUnit = (placement: AdPlacement) => AD_PLACEMENTS[placement][0];

/** Габариты креатива: jsdom всегда возвращает нули. */
const mockHostHeight = (host: HTMLElement, height: number): void => {
  vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
    height,
  } as unknown as DOMRect);
};

beforeEach(() => {
  // Реклама включается флагом из index.html; в тестах — вручную.
  window.__adsEnabled = true;
});

afterEach(() => {
  delete window.Ya;
  delete window.yaContextCb;
  delete window.__adsEnabled;
  vi.restoreAllMocks();
});

describe('AdBanner', () => {
  it('рендерит слот для указанного места', () => {
    const { container } = render(<AdBanner placement="schedule-top" />);

    expect(container.querySelectorAll('.ad-banner__slot')).toHaveLength(1);
    expect(
      container.querySelector('[data-ad-placement="schedule-top"]')
    ).not.toBeNull();
  });

  it('схлопывает повторяющиеся места', () => {
    const { container } = render(
      <AdBanner placement={['schedule-top', 'schedule-top']} />
    );

    expect(container.querySelectorAll('.ad-banner__slot')).toHaveLength(1);
  });

  it('рисует несколько мест одним компонентом', () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    const { container } = render(
      <AdBanner placement={['schedule-top', 'students-top']} />
    );

    expect(container.querySelectorAll('.ad-banner__slot')).toHaveLength(2);
    expect(create).toHaveBeenCalledTimes(2);

    const hostIds = Array.from(
      container.querySelectorAll<HTMLDivElement>('.ad-banner__host')
    ).map((host) => host.id);
    expect(hostIds).toHaveLength(2);

    expect(
      create.mock.calls.map(
        ([options]) => (options as { containerId: string }).containerId
      )
    ).toEqual(hostIds);

    expect(
      create.mock.calls.map(
        ([options]) => (options as { params: Record<string, string> }).params
      )
    ).toEqual([
      firstUnit('schedule-top').params,
      firstUnit('students-top').params,
    ]);
  });

  it('ждёт загрузки SDK и создаёт блок в своём контейнере', () => {
    const create = vi.fn();
    const { container } = render(<AdBanner placement="schedule-top" />);

    expect(create).not.toHaveBeenCalled();
    expect(window.yaContextCb).toHaveLength(1);

    window.Ya = { adfoxCode: { create } };
    window.yaContextCb?.forEach((fn) => fn());

    const host = container.querySelector<HTMLDivElement>('.ad-banner__host');
    expect(host).not.toBeNull();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: firstUnit('schedule-top').ownerId,
        containerId: host?.id,
        params: firstUnit('schedule-top').params,
      })
    );
  });

  it('подписывается на onRender/onError/onStub и разворачивает слот по onRender', async () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    const { container } = render(<AdBanner placement="schedule-top" />);

    const options = create.mock.calls[0][0] as {
      onRender?: () => void;
      onError?: (error: unknown) => void;
      onStub?: () => void;
    };
    expect(typeof options.onRender).toBe('function');
    expect(typeof options.onError).toBe('function');
    expect(typeof options.onStub).toBe('function');

    const host = container.querySelector<HTMLDivElement>('.ad-banner__host')!;
    const slot = container.querySelector<HTMLDivElement>('.ad-banner__slot')!;
    mockHostHeight(host, 72);

    act(() => options.onRender?.());

    await waitFor(() => expect(slot.style.maxHeight).toBe('72px'));
    expect(slot.dataset.ready).toBe('true');
    expect(slot.style.opacity).toBe('1');
  });

  it('не разворачивает слот, если AdFox отдал заглушку', () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    const { container } = render(<AdBanner placement="schedule-top" />);
    const options = create.mock.calls[0][0] as { onStub?: () => void };
    const slot = container.querySelector<HTMLDivElement>('.ad-banner__slot')!;

    options.onStub?.();

    expect(slot.dataset.ready).toBeUndefined();
    expect(slot.style.maxHeight).toBe('0px');
  });

  it('крестик сворачивает блок', async () => {
    window.Ya = { adfoxCode: { create: vi.fn() } };

    const { container } = render(<AdBanner placement="schedule-top" />);
    const close = container.querySelector<HTMLButtonElement>('.ad-banner__close');
    expect(close).not.toBeNull();

    fireEvent.click(close!);

    const slot = container.querySelector<HTMLDivElement>('.ad-banner__slot')!;
    await waitFor(() => expect(slot.style.maxHeight).toBe('0px'));
    expect(slot.dataset.ready).toBeUndefined();
  });

  it('ничего не делает, если реклама на хосте выключена', () => {
    window.__adsEnabled = false;
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    const { container } = render(<AdBanner placement="schedule-top" />);

    expect(container.querySelectorAll('.ad-banner__slot')).toHaveLength(1);
    expect(container.querySelectorAll('.ad-banner__host')).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
    expect(window.yaContextCb).toBeUndefined();
  });

  it('показывает объявление места независимо от контекста', () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    render(
      <AdBanner
        placement="lesson-bottom"
        context={{ keywords: ['Физика (лек.)'], building: 3, group: '3439' }}
      />
    );

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      params: firstUnit('lesson-bottom').params,
    });
  });

  it('не создаёт блок, если место отсутствует в конфиге', () => {
    const create = vi.fn();
    window.Ya = { adfoxCode: { create } };

    const { container } = render(
      <AdBanner placement={'unknown-place' as AdPlacement} />
    );

    expect(container.querySelectorAll('.ad-banner__host')).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
  });
});
