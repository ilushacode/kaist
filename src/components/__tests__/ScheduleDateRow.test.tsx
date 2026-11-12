import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ScheduleDateRow } from '../schedule/ScheduleDateRow';

describe('ScheduleDateRow', () => {
  afterEach(() => vi.useRealTimers());

  it('показывает выбранную дату и обновляет чётность при смене недели', () => {
    const { rerender } = render(<ScheduleDateRow selectedDate={new Date(2026, 8, 1)} />);
    expect(screen.getByText('1 сентября')).toHaveAttribute('datetime', '2026-09-01');
    expect(screen.getByText('нечётная')).toHaveAttribute('aria-label', 'Нечётная неделя');
    rerender(<ScheduleDateRow selectedDate={new Date(2026, 8, 7)} />);
    expect(screen.getByText('7 сентября')).toBeInTheDocument();
    expect(screen.getByText('чётная')).toHaveAttribute('aria-label', 'Чётная неделя');
  });

  it('возвращает на актуальное сегодня одним нажатием', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 12, 23, 59));
    const onDateChange = vi.fn();
    render(<ScheduleDateRow selectedDate={new Date(2026, 8, 1)} onDateChange={onDateChange} />);
    // Вкладка остаётся открытой до следующего дня.
    vi.setSystemTime(new Date(2026, 10, 13, 9));
    const button = screen.getByRole('button');
    fireEvent.click(button, { detail: 1 });
    expect(onDateChange).toHaveBeenCalledOnce();
    expect(onDateChange).toHaveBeenCalledWith(new Date(2026, 10, 13));
  });

  it('поддерживает активацию с клавиатуры', () => {
    vi.useFakeTimers();
    const onDateChange = vi.fn();
    render(<ScheduleDateRow selectedDate={new Date(2026, 8, 1)} onDateChange={onDateChange} />);
    const button = screen.getByRole('button');
    fireEvent.click(button, { detail: 0 });
    expect(onDateChange).toHaveBeenCalledOnce();
  });
});
