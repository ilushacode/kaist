import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ScheduleLesson } from '../ScheduleLesson';
import { useStore } from '../../../hooks/useStore';
import { mapLesson } from '../../../utils/schedule';

const { openModal } = vi.hoisted(() => ({ openModal: vi.fn() }));
vi.mock('../../../providers/ModalProvider', () => ({ useModal: () => ({ openModal }) }));
afterEach(() => { cleanup(); openModal.mockClear(); });

it('короткий клик раскрывает скрытую пару без модального окна', () => {
  const lesson = mapLesson({ s: 'Математика', k: 'лек', t: '09:00' });
  useStore.setState({ selectedGroup: '3439', hiddenLessons: { '3439': { [lesson.seriesKey!]: true } } });
  render(<ScheduleLesson lessons={[lesson]} date={new Date(2026, 10, 12)} />);
  const card = screen.getByRole('button');
  expect(card.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(card);
  expect(card.getAttribute('aria-expanded')).toBe('true');
  expect(openModal).not.toHaveBeenCalled();
  fireEvent.click(card);
  expect(openModal).toHaveBeenCalledTimes(1);
});
