import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentsComponent } from '../StudentsComponent';
import { useStore } from '../../hooks/useStore';

vi.mock('../../hooks/useStore', () => ({
  useStore: vi.fn(),
}));

import type { MockedFunction } from 'vitest';
const mockedUseStore = useStore as unknown as MockedFunction<typeof useStore>;

interface MockState {
  selectedGroup: string | null;
  studentsGroups: Record<string, unknown[]>;
  studentsLoading: boolean;
  studentsError: boolean;
  retryBootstrap: ReturnType<typeof vi.fn>;
}

function mockStore(overrides: Partial<MockState> = {}) {
  const state: MockState = {
    selectedGroup: '3439',
    studentsGroups: {},
    studentsLoading: false,
    studentsError: false,
    retryBootstrap: vi.fn(),
    ...overrides,
  };
  mockedUseStore.mockImplementation(((selector: (s: MockState) => unknown) =>
    selector(state)) as never);
  return state;
}

describe('StudentsComponent', () => {
  afterEach(() => vi.clearAllMocks());

  it('показывает загрузчик при studentsLoading', () => {
    mockStore({ studentsLoading: true });
    const { container } = render(<StudentsComponent />);
    expect(container.querySelector('.students__centred')).toBeInTheDocument();
  });

  it('показывает ошибку при studentsError', () => {
    mockStore({ studentsError: true });
    render(<StudentsComponent />);
    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
  });

  it('показывает "Нет результатов", если данных нет и ошибки нет', () => {
    mockStore();
    render(<StudentsComponent />);
    expect(screen.getByText('Нет результатов')).toBeInTheDocument();
  });

  it('рендерит список студентов', () => {
    mockStore({
      studentsGroups: {
        '3439': [
          { student_id: 1, student: 'Иванов Иван', leader: false },
          { student_id: 2, student: 'Петров Пётр', leader: true },
        ],
      },
    });
    render(<StudentsComponent />);
    expect(screen.getByText('Иванов Иван')).toBeInTheDocument();
    expect(screen.getByText('Петров Пётр')).toBeInTheDocument();
  });

  it('показывает пустое состояние, если у группы нет студентов', () => {
    mockStore({ studentsGroups: { '3439': [] } });
    render(<StudentsComponent />);
    expect(screen.getByText('Нет результатов')).toBeInTheDocument();
  });

  it('открывает поиск и находит студента по имени в другой группе', () => {
    mockStore({
      selectedGroup: '3439',
      studentsGroups: {
        '3439': [{ student_id: 1, student: 'Иванов Иван', leader: false }],
        '3440': [{ student_id: 2, student: 'Сидоров Сидор', leader: false }],
      },
    });
    render(<StudentsComponent />);
    fireEvent.click(screen.getByLabelText('Открыть поиск'));
    const input = screen.getByPlaceholderText('Имя студента или группа');
    fireEvent.change(input, { target: { value: 'Сидоров' } });
    expect(screen.getByText('Сидоров Сидор')).toBeInTheDocument();
  });

  it('находит студентов по номеру группы', () => {
    mockStore({
      selectedGroup: '3439',
      studentsGroups: {
        '3439': [{ student_id: 1, student: 'Иванов Иван', leader: false }],
        '3440': [{ student_id: 2, student: 'Сидоров Сидор', leader: false }],
      },
    });
    render(<StudentsComponent />);
    fireEvent.click(screen.getByLabelText('Открыть поиск'));
    const input = screen.getByPlaceholderText('Имя студента или группа');
    fireEvent.change(input, { target: { value: '3440' } });
    expect(screen.getByText('Сидоров Сидор')).toBeInTheDocument();
  });
});