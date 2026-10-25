import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TeachersComponent } from '../TeachersComponent';
import { useStore } from '../../hooks/useStore';
import { ModalProvider } from '../../providers/ModalProvider';

vi.mock('../../hooks/useStore', () => ({
  useStore: vi.fn(),
}));

import type { MockedFunction } from 'vitest';
const mockedUseStore = useStore as unknown as MockedFunction<typeof useStore>;

interface MockState {
  selectedGroup: string | null;
  scheduleGroups: Record<string, unknown[]>;
  examsGroups: Record<string, unknown[]>;
  scheduleLoading: boolean;
  scheduleError: boolean;
  retryBootstrap: ReturnType<typeof vi.fn>;
}

function mockStore(overrides: Partial<MockState> = {}) {
  const state: MockState = {
    selectedGroup: '3439',
    scheduleGroups: {},
    examsGroups: {},
    scheduleLoading: false,
    scheduleError: false,
    retryBootstrap: vi.fn(),
    ...overrides,
  };
  mockedUseStore.mockImplementation(((selector: (s: MockState) => unknown) =>
    selector(state)) as never);
}

function renderWithProviders() {
  return render(
    <ModalProvider>
      <TeachersComponent />
    </ModalProvider>
  );
}

describe('TeachersComponent', () => {
  afterEach(() => vi.clearAllMocks());

  it('рендерит тулбар с подписью «В группе …»', () => {
    mockStore({
      scheduleGroups: {
        '3439': [{ d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.' }],
      },
    });
    renderWithProviders();
    expect(screen.getByText('В группе 3439')).toBeInTheDocument();
  });

  it('находит преподавателя по номеру группы (из другой группы)', () => {
    mockStore({
      selectedGroup: '3439',
      scheduleGroups: {
        '3439': [{ d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.' }],
        '3440': [{ d: '1', t: '09:00', s: 'Тервер', p: 'СИДОРОВ С.С.' }],
      },
    });
    renderWithProviders();
    fireEvent.click(screen.getByLabelText('Открыть поиск'));
    const input = screen.getByPlaceholderText(
      'Имя преподавателя или группа'
    );
    fireEvent.change(input, { target: { value: '3440' } });

    // Ищем строго внутри контейнера результатов поиска,
    // чтобы не пересекаться с карточкой в списке группы
    // (AnimatePresence держит её до конца exit-анимации).
    const resultsContainer = document.querySelector(
      '.teachers__search-results'
    ) as HTMLElement | null;
    expect(resultsContainer).not.toBeNull();
    expect(
      within(resultsContainer as HTMLElement).getByText('Сидоров С.С.')
    ).toBeInTheDocument();
  });

  it('находит преподавателя по имени', () => {
    mockStore({
      scheduleGroups: {
        '3439': [{ d: '1', t: '09:00', s: 'Матан', p: 'ИВАНОВ И.И.' }],
      },
    });
    renderWithProviders();
    fireEvent.click(screen.getByLabelText('Открыть поиск'));
    const input = screen.getByPlaceholderText(
      'Имя преподавателя или группа'
    );
    fireEvent.change(input, { target: { value: 'Иванов' } });

    const resultsContainer = document.querySelector(
      '.teachers__search-results'
    ) as HTMLElement | null;
    expect(resultsContainer).not.toBeNull();
    expect(
      within(resultsContainer as HTMLElement).getByText('Иванов И.И.')
    ).toBeInTheDocument();
  });
});