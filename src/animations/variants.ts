export const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '50%' : '-50%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-50%' : '50%',
    opacity: 0,
  }),
};

export const slideTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.55,
} as const;

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalSheetVariants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};