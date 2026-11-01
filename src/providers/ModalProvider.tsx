/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentType, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING_MODAL } from '../animations/presets';
import {
  modalBackdropVariants,
  modalSheetVariants,
} from '../animations/variants';

interface ModalContextValue {
  openModal: <P extends object>(
    component: ComponentType<P & { closeModal?: () => void }>,
    props?: P
  ) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalState {
  ModalComponent: ComponentType<any>;
  props: Record<string, unknown>;
  key: number;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);

  /** Прокручиваемое содержимое шторки (см. `.modal-sheet__body`). */
  const bodyRef = useRef<HTMLDivElement>(null);
  /**
   * Список вверху? Тянуть шторку вниз (закрытие жестом) можно только тогда,
   * иначе жест «отдать» внутреннему скроллу — иначе свайп закрывал бы модалку
   * вместо прокрутки.
   */
  const [bodyAtTop, setBodyAtTop] = useState(true);

  const handleBodyScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    const atTop = el.scrollTop <= 0;
    setBodyAtTop((prev) => (prev === atTop ? prev : atTop));
  }, []);

  const openModal = useCallback(
    <P extends object>(
      ModalComponent: ComponentType<P & { closeModal?: () => void }>,
      props: P = {} as P
    ) => {
      setBodyAtTop(true);
      setModal({
        ModalComponent: ModalComponent as ComponentType<any>,
        props: props as Record<string, unknown>,
        key: Date.now(),
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({ openModal, closeModal }),
    [openModal, closeModal]
  );

  const handleBackdropClick = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (info.offset.y > 120 || info.velocity.y > 500) closeModal();
    },
    [closeModal]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {modal && (
          <motion.div
            key={modal.key}
            className="modal-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={handleBackdropClick}
          >
            <motion.div
              className="modal-sheet"
              variants={modalSheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={SPRING_MODAL}
              drag={bodyAtTop ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
              onClick={stopPropagation}
            >
              <div className="modal-sheet__drag-handle" />
              <div
                className="modal-sheet__body"
                ref={bodyRef}
                onScroll={handleBodyScroll}
              >
                <modal.ModalComponent {...modal.props} closeModal={closeModal} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}