import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TasksComponent } from '../TasksComponent';
import { getLessonTaskKey, useStore } from '../../hooks/useStore';
import { mapLesson } from '../../utils/schedule';
const raw = { s: 'Высшая математика', k: 'лек', t: '08:00', d: '4' };
const lesson = mapLesson(raw);
beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 12, 7));
  await useStore.getState().resetAll();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('показывает даты по порядку и все задачи только выбранной группы', () => {
  useStore.getState().selectGroup('3439');
  useStore.setState({ scheduleGroups: { '3439': [raw] } });
  useStore.getState().setLessonTasks('3439', getLessonTaskKey(lesson, new Date(2026, 10, 14)), [{ id: '1', text: 'Поздняя задача' }]);
  useStore.getState().setLessonTasks('3439', getLessonTaskKey(lesson, new Date(2026, 10, 12)), [{ id: '2', text: 'Ранняя задача' }, { id: '3', text: 'Ещё задача' }]);
  useStore.getState().setLessonTasks('4191', getLessonTaskKey(lesson, new Date(2026, 10, 12)), [{ id: '4', text: 'Другая группа' }]);
  render(<TasksComponent />);
  expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual(['12 ноября — Четверг', '14 ноября — Суббота']);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getAllByText('Высшая математика')).toHaveLength(3);
  expect(screen.getAllByText('Лекция')).toHaveLength(3);
  expect(screen.queryByText('Другая группа')).toBeNull();
  act(() => useStore.getState().selectGroup('4191'));
  expect(screen.getByText('Другая группа')).toBeInTheDocument();
  expect(screen.queryByText('Ранняя задача')).toBeNull();
});
it('показывает пустое состояние и обновляется после удаления задачи', () => {
  useStore.getState().selectGroup('3439');
  const key = getLessonTaskKey(lesson, new Date(2026, 10, 12));
  useStore.getState().setLessonTasks('3439', key, [{ id: '1', text: 'Без расписания' }]);
  render(<TasksComponent />);
  expect(screen.getByText('Без расписания')).toBeInTheDocument();
  act(() => useStore.getState().setLessonTasks('3439', key, []));
  expect(screen.getByText('Нет предстоящих задач')).toBeInTheDocument();
});

it('скрывает прошедшие пары по окончании, сохраняя задачи в памяти', () => {
  useStore.getState().selectGroup('3439');
  const todayKey = getLessonTaskKey(lesson, new Date(2026, 10, 12));
  const yesterdayKey = getLessonTaskKey(lesson, new Date(2026, 10, 11));
  useStore.getState().setLessonTasks('3439', todayKey, [{ id: '1', text: 'Сегодня' }]);
  useStore.getState().setLessonTasks('3439', yesterdayKey, [{ id: '2', text: 'Вчера' }]);
  vi.setSystemTime(new Date(2026, 10, 12, 9, 30));
  render(<TasksComponent />);
  expect(screen.queryByText('Вчера')).toBeNull();
  expect(screen.getByText('Сегодня')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(60_000));
  expect(screen.queryByText('Сегодня')).toBeNull();
  expect(screen.getByText('Нет предстоящих задач')).toBeInTheDocument();
  expect(useStore.getState().lessonTasks['3439'][todayKey]).toHaveLength(1);
});
