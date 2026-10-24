import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExamsComponent } from '../ExamsComponent';
import { useStore } from '../../hooks/useStore';
import { ModalProvider } from '../../providers/ModalProvider';

vi.mock('../../hooks/useStore', () => ({
  useStore: vi.fn(),
}));

import type { MockedFunction } from 'vitest';
const mockedUseStore = useStore as unknown as MockedFunction<typeof useStore>;

interface MockState {
  selectedGroup: string | null;
  examsGroups: Record<string, unknown[]>;
  examsLoading: boolean;
  examsError: boolean;
  retryBootstrap: ReturnType<typeof vi.fn>;
}

function mockStore(overrides: Partial<MockState> = {}) {
  const state: MockState = {
    selectedGroup: '3439',
    examsGroups: {},
    examsLoading: false,
    examsError: false,
    retryBootstrap: vi.fn(),
    ...overrides,
  };
  mockedUseStore.mockImplementation(((selector: (s: MockState) => unknown) =>
    selector(state)) as never);
  return state;
}

// Оборачиваем в ModalProvider — дочерние ExamCard → TeacherLink
// вызывают useModal(), без провайдера они падают.
function renderWithProviders() {
  return render(
    <ModalProvider>
      <ExamsComponent />
    </ModalProvider>
  );
}

describe('ExamsComponent', () => {
  afterEach(() => vi.clearAllMocks());

  it('показывает загрузчик при examsLoading', () => {
    mockStore({ examsLoading: true });
    const { container } = renderWithProviders();
    expect(container.querySelector('.exams__centred')).toBeInTheDocument();
  });

  it('показывает ошибку при examsError и пустых данных', () => {
    mockStore({ examsError: true });
    renderWithProviders();
    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
  });

  it('показывает "Экзаменов пока нет", если данных нет и ошибки нет', () => {
    mockStore();
    renderWithProviders();
    expect(screen.getByText('Экзаменов пока нет')).toBeInTheDocument();
  });

  it('рендерит карточки экзаменов', () => {
    mockStore({
      examsGroups: {
        '3439': [{ s: 'Матан', tm: '10:00', p: 'Иванов' }],
      },
    });
    renderWithProviders();
    expect(screen.getByText('Матан')).toBeInTheDocument();
  });
});