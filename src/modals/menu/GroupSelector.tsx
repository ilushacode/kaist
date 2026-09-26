import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, Plus, X } from 'lucide-react';
import { SPRING_FAST, SPRING_SOFT } from '../../animations/presets';
import type { MouseEvent } from 'react';

interface GroupSelectorProps {
  groups: string[];
  selectedGroup: string | null;
  onSelect: (group: string) => void;
  onRemove: (group: string) => void;
  onAdd: () => void;
  canRemove: boolean;
}

export function GroupSelector({
  groups,
  selectedGroup,
  onSelect,
  onRemove,
  onAdd,
  canRemove,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleRemove = (e: MouseEvent, group: string) => {
    e.stopPropagation();
    if (!canRemove) return;
    onRemove(group);
  };

  return (
    <div className="menu-modal__group">
      <motion.button
        type="button"
        className={'menu-modal__group__row' + (open ? ' menu-modal__group__row--open' : '')}
        onClick={() => setOpen((v) => !v)}
        disabled={!selectedGroup}
        whileTap={{ scale: 0.98 }}
        transition={SPRING_FAST}
      >
        <span className="menu-modal__group__label">Группа</span>
        <motion.span
          key={selectedGroup ?? 'none'}
          className="menu-modal__group__value"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_FAST}
        >
          {selectedGroup ?? '—'}
        </motion.span>
        <motion.span
          className="menu-modal__group__chevron"
          animate={{ rotate: open ? 90 : 0 }}
          transition={SPRING_FAST}
        >
          <ChevronRight size={16} strokeWidth={2.4} />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="menu-modal__group__dropdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING_SOFT}
            style={{ overflow: 'hidden' }}
          >
            <div className="menu-modal__group__dropdown-inner">
              <div className="menu-modal__group__scroll">
                {groups.map((group) => {
                  const isActive = group === selectedGroup;
                  return (
                    <div
                      key={group}
                      className={
                        'menu-modal__group__item' +
                        (isActive ? ' menu-modal__group__item--active' : '')
                      }
                      onClick={() => {
                        onSelect(group);
                        setOpen(false);
                      }}
                    >
                      <span className="menu-modal__group__item__check">
                        {isActive && <Check size={14} strokeWidth={2.6} />}
                      </span>
                      <span className="menu-modal__group__item__num">{group}</span>
                      {canRemove && (
                        <button
                          type="button"
                          className="menu-modal__group__item__remove"
                          onClick={(e) => handleRemove(e, group)}
                          aria-label={`Удалить группу ${group}`}
                        >
                          <X size={14} strokeWidth={2.4} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="menu-modal__group__add"
                onClick={() => {
                  setOpen(false);
                  onAdd();
                }}
              >
                <Plus size={15} strokeWidth={2.4} />
                <span>Добавить группу</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}