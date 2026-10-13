import { Menu, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import MenuModal from '../modals/MenuModal';
import GroupModal from '../modals/GroupModal';
import { useNavigate } from 'react-router-dom';
import { SPRING_FAST, TITLE_TRANSITION } from '../animations/presets';
import '../styles/Header.css';

interface HeaderComponentProps {
  title: string;
  backButton?: boolean;
}

export const HeaderComponent = ({ title, backButton }: HeaderComponentProps) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const { openModal } = useModal();
  const navigate = useNavigate();

  const handleRightClick = () => {
    if (backButton) {
      navigate('/');
      return;
    }
    openModal(MenuModal, {});
  };

  const handleGroupClick = () => {
    openModal(GroupModal, {});
  };

  const Icon = backButton ? X : Menu;

  return (
    <header className="header">
      <div className="header__left">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={title}
            className="header__title"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={TITLE_TRANSITION}
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        {selectedGroup && (
          <motion.button
            type="button"
            className="header__group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={handleGroupClick}
            aria-label={`Открыть список групп. Текущая: ${selectedGroup}`}
            whileTap={{ scale: 0.96 }}
          >
            <Users size={14} strokeWidth={2.2} />
            <span className="header__group__num">{selectedGroup}</span>
          </motion.button>
        )}
      </div>

      <motion.button
        type="button"
        className="header__action"
        onClick={handleRightClick}
        aria-label={backButton ? 'Закрыть' : 'Открыть меню'}
        whileTap={{ scale: 0.9 }}
        transition={SPRING_FAST}
      >
        <Icon size={20} strokeWidth={1.8} />
      </motion.button>
    </header>
  );
};