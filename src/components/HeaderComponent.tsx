import { useCallback, useEffect, useRef } from 'react';
import { Menu, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import MenuModal from '../modals/MenuModal';
import GroupModal from '../modals/GroupModal';
import DebugModal from '../modals/DebugModal';
import { useNavigate } from 'react-router-dom';
import { SPRING_FAST, TITLE_TRANSITION } from '../animations/presets';
import '../styles/Header.css';

interface HeaderComponentProps {
  title: string;
  backButton?: boolean;
}

/** 5 кликов подряд с интервалом не больше этого — открываем отладку. */
const DEBUG_TAP_COUNT = 5;
const DEBUG_TAP_WINDOW_MS = 2000;

export const HeaderComponent = ({ title, backButton }: HeaderComponentProps) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const { openModal } = useModal();
  const navigate = useNavigate();

  const tapCountRef = useRef(0);
  const firstTapAtRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleTitleClick = useCallback(() => {
    const now = Date.now();
    if (now - firstTapAtRef.current > DEBUG_TAP_WINDOW_MS) {
      tapCountRef.current = 0;
      firstTapAtRef.current = now;
    }

    tapCountRef.current += 1;

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      firstTapAtRef.current = 0;
    }, DEBUG_TAP_WINDOW_MS);

    if (tapCountRef.current >= DEBUG_TAP_COUNT) {
      tapCountRef.current = 0;
      firstTapAtRef.current = 0;
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      openModal(DebugModal, {});
    }
  }, [openModal]);

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
            onClick={handleTitleClick}
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