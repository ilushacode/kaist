import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LessonModal from '../LessonModal';
import { getLessonTaskKey, useStore } from '../../hooks/useStore';
import type { Lesson } from '../../types';
vi.mock('../../components/AdBanner', () => ({ AdBanner: () => null }));
vi.mock('../../components/TeacherLink', () => ({ TeacherLink: () => null }));
const lesson: Lesson = {
  subject: 'Математика', time: '08:00', type: 'lec', teacher: '', department: '', building: '1', room: '101', dates: ['12.11', '19.11'],
};
const date = new Date(2026, 10, 19);
beforeEach(async () => { await useStore.getState().resetAll(); });
afterEach(cleanup);
describe('Задачи пары', () => {
  it('сохраняет после потери фокуса и разделяет даты, пары и группы', async () => {
    const view = render(<LessonModal lesson={lesson} group="3439" date={date} />);
    expect(screen.getByLabelText('Количество задач')).toHaveTextContent('0');
    fireEvent.click(screen.getByText('Добавить'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Решить задачи' } });
    fireEvent.blur(screen.getByRole('textbox'));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Решить задачи')).toBeInTheDocument();
    expect(screen.getByLabelText('Количество задач')).toHaveTextContent('1');
    view.unmount();
    useStore.getState().lessonTasks = {};
    await useStore.persist.rehydrate();
    const next = render(<LessonModal lesson={lesson} group="3439" date={date} />);
    expect(screen.getByText('Решить задачи')).toBeInTheDocument();
    next.rerender(<LessonModal lesson={lesson} group="3439" date={new Date(2026, 10, 12)} />);
    expect(screen.queryByText('Решить задачи')).toBeNull();
    next.rerender(<LessonModal lesson={{ ...lesson, time: '10:00' }} group="3439" date={date} />);
    expect(screen.queryByText('Решить задачи')).toBeNull();
    next.rerender(<LessonModal lesson={lesson} group="4191" date={date} />);
    expect(screen.queryByText('Решить задачи')).toBeNull();
  });
  it('копирует текст и удаляет задачу клавишей Delete из хранилища', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    useStore.getState().setLessonTasks('3439', getLessonTaskKey(lesson, date), [{ id: '1', text: 'ДЗ' }]);
    render(<LessonModal lesson={lesson} group="3439" date={date} />);
    fireEvent.click(screen.getByLabelText('Копировать задачу'));
    expect(await screen.findByLabelText('Скопировано')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('ДЗ');
    fireEvent.keyDown(screen.getByText('ДЗ'), { key: 'Delete' });
    expect(useStore.getState().lessonTasks).toEqual({});
    await useStore.persist.rehydrate();
    expect(useStore.getState().lessonTasks).toEqual({});
  });
  it('не принимает четвёртую строку', () => {
    render(<LessonModal lesson={lesson} group="3439" date={date} />);
    fireEvent.click(screen.getByText('Добавить'));
    const field = screen.getByRole('textbox');
    fireEvent.change(field, { target: { value: '1\n2\n3' } });
    fireEvent.change(field, { target: { value: '1\n2\n3\n4' } });
    expect(field).toHaveValue('1\n2\n3');
  });
});
