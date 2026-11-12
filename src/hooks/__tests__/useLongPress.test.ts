import { act, renderHook } from '@testing-library/react';
import type { PointerEvent, MouseEvent } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { useLongPress } from '../useLongPress';

const pointer = (x = 0) => ({ isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: 0 }) as PointerEvent<HTMLElement>;
const click = () => ({ preventDefault: vi.fn(), stopPropagation: vi.fn() }) as unknown as MouseEvent<HTMLElement>;
afterEach(() => vi.useRealTimers());

it('удержание срабатывает один раз и подавляет следующий клик', () => {
  vi.useFakeTimers();
  const hold = vi.fn(); const short = vi.fn();
  const { result } = renderHook(() => useLongPress(hold, short));
  act(() => { result.current.onPointerDown(pointer()); vi.advanceTimersByTime(550); });
  result.current.onPointerUp();
  result.current.onClick(click());
  expect(hold).toHaveBeenCalledTimes(1);
  expect(short).not.toHaveBeenCalled();
  result.current.onPointerDown(pointer());
  result.current.onPointerUp();
  result.current.onClick(click());
  expect(short).toHaveBeenCalledTimes(1);
});
it('движение и отмена жеста не скрывают пару', () => {
  vi.useFakeTimers();
  const hold = vi.fn(); const short = vi.fn();
  const { result, unmount } = renderHook(() => useLongPress(hold, short));
  result.current.onPointerDown(pointer());
  result.current.onPointerMove(pointer(20));
  act(() => vi.advanceTimersByTime(600));
  result.current.onClick(click());
  expect(short).not.toHaveBeenCalled();
  result.current.onPointerDown(pointer());
  result.current.onPointerCancel();
  act(() => vi.advanceTimersByTime(600));
  expect(hold).not.toHaveBeenCalled();
  result.current.onPointerDown(pointer());
  unmount();
  act(() => vi.advanceTimersByTime(600));
  expect(hold).not.toHaveBeenCalled();
});
