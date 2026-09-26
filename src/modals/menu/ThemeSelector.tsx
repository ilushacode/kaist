import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Sun, Moon, Check, ChevronRight } from 'lucide-react';
import { SPRING_FAST, SPRING_SOFT, cascade } from '../../animations/presets';
import type { Theme } from '../../types';
import type { LucideIcon } from 'lucide-react';

interface ThemeOption {
  value: Theme;
  icon: LucideIcon;
  label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'auto', icon: Monitor, label: 'Авто' },
  { value: 'light', icon: Sun, label: 'Светлая' },
  { value: 'dark', icon: Moon, label: 'Тёмная' },
];

const THEME_ICON: Record<Theme, LucideIcon> = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
};

const THEME_LABEL: Record<Theme, string> = {
  auto: 'Авто',
  light: 'Светлая',
  dark: 'Тёмная',
};

interface ThemeSelectorProps {
  theme: Theme;
  onSelect: (theme: Theme) => void;
  index: number;
}

export function ThemeSelector({ theme, onSelect, index }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ThemeIcon = THEME_ICON[theme];

  return (
    <>
      <motion.div
        className={
          'menu-modal__item menu-modal__item--clickable menu-modal__item--theme' +
          (open ? ' menu-modal__item--open' : '')
        }
        onClick={() => setOpen((v) => !v)}
        {...cascade(index)}
        whileTap={{ scale: 0.98 }}
      >
        <span
          className="menu-modal__icon"
          style={{
            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            boxShadow: '0 4px 12px -4px #6b728080',
          }}
        >
          <ThemeIcon size={16} color="#fff" strokeWidth={2.2} />
        </span>
        <span className="menu-modal__title">Тема</span>
        <span className="menu-modal__right">{THEME_LABEL[theme]}</span>
        <motion.span
          className="menu-modal__chevron"
          animate={{ rotate: open ? 90 : 0 }}
          transition={SPRING_FAST}
        >
          <ChevronRight size={16} strokeWidth={2.4} />
        </motion.span>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="menu-modal__subdropdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING_SOFT}
            style={{ overflow: 'hidden' }}
          >
            <div className="menu-modal__subdropdown-inner">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <motion.div
                    key={opt.value}
                    className={
                      'menu-modal__subdropdown__item' +
                      (isActive ? ' menu-modal__subdropdown__item--active' : '')
                    }
                    onClick={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="menu-modal__subdropdown__check">
                      <AnimatePresence>
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={SPRING_FAST}
                            style={{ display: 'flex' }}
                          >
                            <Check size={14} strokeWidth={2.6} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="menu-modal__subdropdown__icon">
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <span className="menu-modal__subdropdown__label">{opt.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}