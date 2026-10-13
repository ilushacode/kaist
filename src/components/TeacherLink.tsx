import { useCallback } from 'react';
import { useModal } from '../providers/ModalProvider';
import TeacherModal from '../modals/TeacherModal';
import '../styles/TeacherLink.css';
import type { MouseEvent, ReactNode } from 'react';

interface TeacherLinkProps {
  teacher: string | null | undefined;
  children?: ReactNode;
  className?: string;
  display?: string;
}

export const TeacherLink = ({
  teacher,
  children,
  className,
  display,
}: TeacherLinkProps) => {
  const { openModal } = useModal();

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const name = String(teacher ?? '').trim();
      if (!name) return;
      openModal(TeacherModal, { teacher: name });
    },
    [teacher, openModal]
  );

  if (!teacher) return null;

  const content = children ?? display ?? teacher;

  return (
    <button
      type="button"
      className={'teacher-link' + (className ? ` ${className}` : '')}
      onClick={handleClick}
      aria-label={`Открыть расписание: ${teacher}`}
    >
      {content}
    </button>
  );
};