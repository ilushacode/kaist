import { render, screen, fireEvent } from '@testing-library/react';
import { TeacherLink } from '../TeacherLink';
import { useModal } from '../../providers/ModalProvider';

jest.mock('../../providers/ModalProvider', () => ({
  useModal: jest.fn(),
}));

const mockedUseModal = useModal as jest.MockedFunction<typeof useModal>;

describe('TeacherLink', () => {
  const openModal = jest.fn();

  beforeEach(() => {
    openModal.mockClear();
    mockedUseModal.mockReturnValue({
      openModal,
      closeModal: jest.fn(),
    });
  });

  it('не рендерится без teacher', () => {
    const { container } = render(<TeacherLink teacher={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('рендерит display вместо имени', () => {
    render(<TeacherLink teacher="ИВАНОВ И.И." display="Иванов И.И." />);
    expect(screen.getByText('Иванов И.И.')).toBeInTheDocument();
  });

  it('рендерит children', () => {
    render(
      <TeacherLink teacher="X">
        <span data-testid="child" />
      </TeacherLink>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('открывает модалку с преподавателем по клику', () => {
    render(<TeacherLink teacher="ИВАНОВ И.И." display="Иванов И.И." />);
    fireEvent.click(screen.getByRole('button'));
    expect(openModal).toHaveBeenCalledTimes(1);
    const [component, props] = openModal.mock.calls[0];
    expect(typeof component).toBe('function');
    expect(props).toEqual({ teacher: 'ИВАНОВ И.И.' });
  });

  it('не открывает модалку при пустом teacher', () => {
    render(<TeacherLink teacher="   " display="—" />);
    const btn = screen.queryByRole('button');
    if (btn) fireEvent.click(btn);
    expect(openModal).not.toHaveBeenCalled();
  });

  it('не всплывает клик наверх (stopPropagation)', () => {
    const parentClick = jest.fn();
    render(
      <div onClick={parentClick}>
        <TeacherLink teacher="X" display="X" />
      </div>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('применяет className', () => {
    render(<TeacherLink teacher="X" display="X" className="custom" />);
    expect(screen.getByRole('button')).toHaveClass('teacher-link', 'custom');
  });
});