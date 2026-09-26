import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { searchGroups, normalizeGroupInput } from '../utils/groups';
import type { ChangeEvent, FormEvent } from 'react';
import '../styles/SetGroup.css';

const MAX_RESULTS = 5;

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 } as const;
const SOFT_SPRING = { type: 'spring', stiffness: 400, damping: 34, mass: 0.6 } as const;
const CASCADE_START = 0.05;
const CASCADE_STEP = 0.08;

const cascade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...SPRING, delay: CASCADE_START + CASCADE_STEP * i },
});

export const SetGroupComponent = () => {
  const addGroup = useStore((s) => s.addGroup);
  const selectGroup = useStore((s) => s.selectGroup);
  const scheduleGroups = useStore((s) => s.scheduleGroups);

  const [query, setQuery] = useState('');

  const options = useMemo(
    () => searchGroups(scheduleGroups, query, MAX_RESULTS),
    [scheduleGroups, query]
  );

  const handlePick = (groupNumber: string) => {
    addGroup(groupNumber, { requireKnown: true });
    selectGroup(groupNumber);
    setQuery('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (options.length > 0) {
      handlePick(options[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(normalizeGroupInput(e.target.value));
  };

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0;
  const hasItems = showResults && options.length > 0;
  const showEmpty = showResults && options.length === 0;

  return (
    <div className="set_group theme_light">
      <div className="set_group__inner">
        <motion.h1 className="set_group__title" {...cascade(0)}>
          Выберите группу
        </motion.h1>

        <motion.p className="set_group__subtitle" {...cascade(1)}>
          Начните вводить номер — мы подскажем
        </motion.p>

        <motion.form className="set_group__form" onSubmit={handleSubmit} {...cascade(2)}>
          <div className="set_group__input-wrap">
            <Search size={18} strokeWidth={2} className="set_group__input-icon" />
            <input
              className="set_group__input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="Номер группы"
              value={query}
              onChange={handleChange}
              autoFocus
            />
          </div>
        </motion.form>

        <motion.div className="set_group__results" {...cascade(3)}>
          <AnimatePresence mode="wait" initial={false}>
            {!showResults && (
              <motion.p
                key="hint"
                className="set_group__placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                Например, 3439 или 4191
              </motion.p>
            )}
            {showEmpty && (
              <motion.p
                key="empty"
                className="set_group__placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                Ничего не найдено
              </motion.p>
            )}
          </AnimatePresence>

          {hasItems &&
            options.map((item, i) => (
              <motion.button
                key={item}
                type="button"
                className="set_group__item"
                onClick={() => handlePick(item)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SOFT_SPRING, delay: 0.03 * i }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="set_group__item__num">{item}</span>
                <span className="set_group__item__arrow">
                  <ArrowRight size={16} strokeWidth={2.4} />
                </span>
              </motion.button>
            ))}
        </motion.div>
      </div>
    </div>
  );
};