import { Check, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import GroupsModal from './GroupsModal';
import '../styles/GroupModal.css';

export default function GroupModal() {
  const { openModal, closeModal } = useModal();

  const groups = useStore((s) => s.groups);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const selectGroup = useStore((s) => s.selectGroup);
  const removeGroup = useStore((s) => s.removeGroup);

  // Активная группа — всегда первая, остальные в исходном порядке.
  const orderedGroups = useMemo(() => {
    if (!selectedGroup) return groups;
    const active = groups.find((g) => g === selectedGroup);
    if (!active) return groups;
    return [active, ...groups.filter((g) => g !== active)];
  }, [groups, selectedGroup]);

  const canRemove = groups.length > 1;

  const handleSelect = (group: string) => {
    if (group === selectedGroup) {
      closeModal();
      return;
    }
    selectGroup(group);
    closeModal();
  };

  const handleRemove = (e: React.MouseEvent, group: string) => {
    e.stopPropagation();
    if (!canRemove) return;
    removeGroup(group);
  };

  const handleAdd = () => {
    closeModal();
    openModal(GroupsModal, {
      onSelect: (group: string) => {
        selectGroup(group);
      },
    });
  };

  return (
    <div className="group_modal">
      <header className="group_modal__header">
        <h2 className="group_modal__title">
          Группы
          <span className="group_modal__count">{groups.length}</span>
        </h2>
      </header>

      <div className="group_modal__list">
        {orderedGroups.length === 0 ? (
          <p className="group_modal__empty">Список пуст</p>
        ) : (
          orderedGroups.map((group) => {
            const isActive = group === selectedGroup;
            return (
              <motion.div
                key={group}
                className={
                  'group_modal__item' +
                  (isActive ? ' group_modal__item--active' : '')
                }
                onClick={() => handleSelect(group)}
                whileTap={{ scale: 0.985 }}
              >
                <span className="group_modal__item__check">
                  {isActive && <Check size={14} strokeWidth={2.6} />}
                </span>
                <span className="group_modal__item__num">{group}</span>
                {canRemove ? (
                  <button
                    type="button"
                    className="group_modal__item__remove"
                    onClick={(e) => handleRemove(e, group)}
                    aria-label={`Удалить группу ${group}`}
                  >
                    <X size={14} strokeWidth={2.4} />
                  </button>
                ) : (
                  <span className="group_modal__item__spacer" aria-hidden="true" />
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <div className="group_modal__footer">
        <button
          type="button"
          className="group_modal__add"
          onClick={handleAdd}
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>Добавить группу</span>
        </button>
      </div>
    </div>
  );
}