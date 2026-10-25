import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';

const SLIDE_SPRING = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.6,
} as const;

interface SearchToolbarProps {
  /** Подпись слева в обычном состоянии, например «В группе 3439». */
  label: string;
  /** Плейсхолдер поля поиска. */
  placeholder: string;
  /** Управляемый запрос. */
  query: string;
  onQueryChange: (value: string) => void;
  /** Открыто ли поле поиска. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Действие справа в обычном состоянии (рядом с иконкой поиска).
   * Например, кнопка «Скопировать всех студентов».
   */
  action?: React.ReactNode;
  /** Необязательное действие справа от поля ввода в режиме поиска. */
  trailing?: React.ReactNode;
}

export const SearchToolbar = ({
  label,
  placeholder,
  query,
  onQueryChange,
  open,
  onOpenChange,
  action,
  trailing,
}: SearchToolbarProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    return;
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    onQueryChange('');
    inputRef.current?.blur();
  };

  return (
    <div className="search_toolbar">
      <AnimatePresence initial={false} mode="sync">
        {!open && (
          <motion.div
            key="label-row"
            className="search_toolbar__layer"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={SLIDE_SPRING}
          >
            <span className="search_toolbar__label">{label}</span>

            <div className="search_toolbar__actions">
              {action}
              <button
                type="button"
                className="search_toolbar__toggle"
                onClick={() => onOpenChange(true)}
                aria-label="Открыть поиск"
                title="Поиск по имени или группе"
              >
                <Search size={16} strokeWidth={2.2} />
              </button>
            </div>
          </motion.div>
        )}

        {open && (
          <motion.div
            key="search-row"
            className="search_toolbar__layer"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={SLIDE_SPRING}
          >
            <div
              className={
                'search_toolbar__input-wrap' +
                (focused ? ' search_toolbar__input-wrap--focused' : '')
              }
            >
              <Search
                size={16}
                strokeWidth={2}
                className="search_toolbar__input-icon"
              />
              <input
                ref={inputRef}
                type="text"
                className="search_toolbar__input"
                placeholder={placeholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="search"
              />
              <button
                type="button"
                className="search_toolbar__close"
                onClick={handleClose}
                aria-label="Закрыть поиск"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {trailing}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};