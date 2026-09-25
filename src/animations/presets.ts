export const SPRING_FAST = {
  type: 'spring',
  stiffness: 700,
  damping: 42,
  mass: 0.6,
} as const;

export const SPRING_DEFAULT = {
  type: 'spring',
  stiffness: 500,
  damping: 38,
  mass: 0.6,
} as const;

export const SPRING_SOFT = {
  type: 'spring',
  stiffness: 400,
  damping: 34,
  mass: 0.6,
} as const;

export const SPRING_MODAL = {
  type: 'spring',
  damping: 30,
  stiffness: 300,
  mass: 0.8,
} as const;

export const EASE_PAGE = [0.4, 0, 0.2, 1] as const;

export const PAGE_TRANSITION = {
  duration: 0.2,
  ease: EASE_PAGE,
} as const;

export const TITLE_TRANSITION = {
  duration: 0.16,
  ease: EASE_PAGE,
} as const;

interface CascadeOptions {
  start?: number;
  step?: number;
  spring?: Record<string, unknown>;
}

export const cascade = (
  i: number,
  { start = 0.05, step = 0.07, spring = SPRING_DEFAULT }: CascadeOptions = {}
) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...spring, delay: start + step * i },
});

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};