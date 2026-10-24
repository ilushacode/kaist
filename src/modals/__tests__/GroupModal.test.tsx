import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupModal from '../GroupModal';
import { useStore } from '../../hooks/useStore';
import { useModal } from '../../providers/ModalProvider';

vi.mock('../../hooks/useStore', () => ({
  useStore: vi.fn(),
}));

vi.mock('../../providers/ModalProvider', () => ({
  useModal: vi.fn(),
}));

import type { MockedFunction } from 'vitest';
const mockedUseStore = useStore as unknown as MockedFunction<typeof useStore>;
const mockedUseModal = useModal as unknown as MockedFunction<typeof useModal>;

interface MockState {
  groups: string[];
  selectedGroup: string | null;
  selectGroup: ReturnType<typeof vi.fn>;
  removeGroup: ReturnType<typeof vi.fn>;
}

function mockStore(overrides: Partial<MockState> = {}): MockState {
  const state: MockState = {
    groups: ['3439'],
    selectedGroup: '3439',
    selectGroup: vi.fn(),
    removeGroup: vi.fn(),
    ...overrides,
  };
  mockedUseStore.mockImplementation(((selector: (s: MockState) => unknown) =>
    selector(state)) as never);
  return state;
}

describe('GroupModal', () => {
  const openModal = vi.fn();
  const closeModal = vi.fn();

  beforeEach(() => {
    openModal.mockClear();
    closeModal.mockClear();
    mockedUseModal.mockReturnValue({ openModal, closeModal });
  });

  it('рендерит список групп', () => {
    mockStore({ groups: ['3439', '4191'], selectedGroup: '3439' });
    render(<GroupModal />);
    expect(screen.getByText('3439')).toBeInTheDocument();
    expect(screen.getByText('4191')).toBeInTheDocument();
  });

  it('показывает заголовок со счётчиком', () => {
    mockStore({ groups: ['3439', '4191', '3100'], selectedGroup: '3439' });
    render(<GroupModal />);
    expect(screen.getByText('Группы')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('активная группа стоит первой в списке', () => {
    mockStore({ groups: ['4191', '3439', '3100'], selectedGroup: '3439' });
    render(<GroupModal />);
    const items = screen.getAllByText(/^\d{4}$/);
    expect(items[0]).toHaveTextContent('3439');
  });

  it('клик по неактивной группе выбирает её и закрывает модалку', () => {
    const state = mockStore({ groups: ['3439', '4191'], selectedGroup: '3439' });
    render(<GroupModal />);
    fireEvent.click(screen.getByText('4191'));
    expect(state.selectGroup).toHaveBeenCalledWith('4191');
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('клик по активной группе только закрывает модалку', () => {
    const state = mockStore({ groups: ['3439'], selectedGroup: '3439' });
    render(<GroupModal />);
    fireEvent.click(screen.getByText('3439'));
    expect(state.selectGroup).not.toHaveBeenCalled();
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('удаление доступно только когда групп больше одной', () => {
    mockStore({ groups: ['3439'], selectedGroup: '3439' });
    render(<GroupModal />);
    expect(screen.queryByLabelText(/Удалить группу/)).toBeNull();
  });

  it('удаляет группу и не переключает', () => {
    const state = mockStore({ groups: ['3439', '4191'], selectedGroup: '3439' });
    render(<GroupModal />);
    fireEvent.click(screen.getByLabelText('Удалить группу 4191'));
    expect(state.removeGroup).toHaveBeenCalledWith('4191');
    expect(state.selectGroup).not.toHaveBeenCalled();
  });

  it('кнопка "Добавить группу" закрывает текущую модалку и открывает GroupsModal', () => {
    mockStore();
    render(<GroupModal />);
    fireEvent.click(screen.getByText('Добавить группу'));
    expect(closeModal).toHaveBeenCalledTimes(1);
    expect(openModal).toHaveBeenCalledTimes(1);
    const [component, props] = openModal.mock.calls[0];
    expect(typeof component).toBe('function');
    expect(props).toHaveProperty('onSelect');
    expect(typeof props.onSelect).toBe('function');
  });
});