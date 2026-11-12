import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LessonModal from '../LessonModal';
import { useStore } from '../../hooks/useStore';
import type { Lesson } from '../../types';

vi.mock('../../components/AdBanner', () => ({ AdBanner: () => null }));
vi.mock('../../components/TeacherLink', () => ({ TeacherLink: () => null }));

const lesson: Lesson = {
  subject: 'Высшая математика', time: '08:00', type: 'lecture',
  teacher: '', department: '', building: '1', room: '101', dates: ['05.11'],
};

beforeEach(async () => { await useStore.getState().resetAll(); });
afterEach(cleanup);

describe('LessonModal: заметки', () => {
  it('показывает общий текст на других датах и сохраняет привязку к открытой группе', () => {
    const { unmount } = render(<LessonModal lesson={lesson} group="3439" />);
    expect(screen.getByRole('button', { name: 'Заметка' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Заметка' }));
    fireEvent.change(screen.getByLabelText('Заметка'), { target: { value: 'Решить задачи' } });
    act(() => useStore.getState().selectGroup('4191'));
    fireEvent.change(screen.getByLabelText('Заметка'), { target: { value: 'Повторить тему' } });
    unmount();
    const next = render(<LessonModal lesson={{ ...lesson, dates: ['12.11'], type: 'practice' }} group="3439" />);
    expect(screen.getByRole('button', { name: 'Заметка' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Заметка')).toHaveValue('Повторить тему');
    next.unmount();
    render(<LessonModal lesson={lesson} group="4191" />);
    expect(screen.getByLabelText('Заметка')).toHaveValue('');
  });

  it('сворачивает и раскрывает поле, сохраняя текст и ручной выбор после очистки', () => {
    useStore.getState().setSubjectNote('3439', lesson.subject, 'Задачи');
    render(<LessonModal lesson={lesson} group="3439" />);
    const toggle = screen.getByRole('button', { name: 'Заметка' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByRole('textbox')).toHaveValue('Задачи');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('не показывает поле без группы', () => {
    render(<LessonModal lesson={lesson} group={null} />);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
