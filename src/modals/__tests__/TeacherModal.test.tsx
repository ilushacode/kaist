import { render, screen } from '@testing-library/react';
import TeacherModal from '../TeacherModal';
import { useStore } from '../../hooks/useStore';

jest.mock('../../hooks/useStore', () => ({
  useStore: jest.fn(),
}));

const mockedUseStore = useStore as jest.MockedFunction<typeof useStore>;

interface MockState {
  scheduleGroups: Record<string, unknown[]>;
  examsGroups: Record<string, unknown[]>;
  scheduleLoading: boolean;
  scheduleError: boolean;
}

function mockStore(overrides: Partial<MockState> = {}) {
  const state: MockState = {
    scheduleGroups: {},
    examsGroups: {},
    scheduleLoading: false,
    scheduleError: false,
    ...overrides,
  };
  mockedUseStore.mockImplementation(((selector: (s: MockState) => unknown) =>
    selector(state)) as never);
}

describe('TeacherModal', () => {
  beforeEach(() => {
    // Понедельник 8 сентября 2025, 12:00 - до начала недели.
    jest.useFakeTimers({ now: new Date(2025, 8, 8, 12, 0, 0) });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('показывает загрузчик при loading', () => {
    mockStore({ scheduleLoading: true });
    const { container } = render(<TeacherModal teacher="ИВАНОВ И.И." />);
    expect(container.querySelector('.teacher_modal__centred')).toBeInTheDocument();
  });

  it('показывает имя преподавателя', () => {
    mockStore({
      scheduleGroups: {
        '3439': [{ d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.' }],
      },
    });
    render(<TeacherModal teacher="ИВАНОВ И.И." />);
    expect(screen.getByText('Иванов И.И.')).toBeInTheDocument();
  });

  it('показывает пустой день, если пар нет', () => {
    mockStore({ scheduleGroups: {} });
    render(<TeacherModal teacher="ИВАНОВ И.И." />);
    expect(screen.getByText('Свободный день')).toBeInTheDocument();
  });

  it('рендерит карточки пар в выбранный день', () => {
    mockStore({
      scheduleGroups: {
        '3439': [
          { d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.', a: '423', b: '3' },
        ],
      },
    });
    render(<TeacherModal teacher="ИВАНОВ И.И." />);
    expect(screen.getByText('Матан')).toBeInTheDocument();
    expect(screen.getByText('9:00')).toBeInTheDocument();
  });

  it('схлопывает одинаковые занятия у разных групп', () => {
    mockStore({
      scheduleGroups: {
        '3439': [{ d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.' }],
        '3440': [{ d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.' }],
      },
    });
    render(<TeacherModal teacher="ИВАНОВ И.И." />);
    expect(screen.getByText('3439, 3440')).toBeInTheDocument();
  });

  it('показывает экзамены, если есть', () => {
    mockStore({
      examsGroups: {
        '3439': [{ s: 'Матан', tm: '10:00', p: 'ИВАНОВ И.И.', dt: '15.06' }],
      },
    });
    render(<TeacherModal teacher="ИВАНОВ И.И." />);
    expect(screen.getByText('Экзамены')).toBeInTheDocument();
  });
});