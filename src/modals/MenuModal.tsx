import { useNavigate } from 'react-router-dom';
import { UserGroup, GraduationCap, BookOpenText, Send } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import GroupsModal from './GroupsModal';
import { TELEGRAM_CHANNEL } from '../config';
import { GroupSelector } from './menu/GroupSelector';
import { ThemeSelector } from './menu/ThemeSelector';
import { MenuItem } from './menu/MenuItem';
import type { LucideIcon } from 'lucide-react';
import type { Theme } from '../types';
import '../styles/MenuModal.css';

interface MainItem {
  icon: LucideIcon;
  color: string;
  title: string;
  path: string;
}

const MAIN_ITEMS: MainItem[] = [
  { icon: UserGroup, color: '#db960c', title: 'Одногруппники', path: '/students' },
  { icon: GraduationCap, color: '#ac2eeb', title: 'Преподаватели', path: '/teachers' },
  { icon: BookOpenText, color: '#0cdb39', title: 'Экзамены', path: '/exams' },
];

export default function MenuModal() {
  const { openModal, closeModal } = useModal();
  const navigate = useNavigate();

  const groups = useStore((s) => s.groups);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const selectGroup = useStore((s) => s.selectGroup);
  const removeGroup = useStore((s) => s.removeGroup);
  const theme = useStore((s) => s.theme ?? 'auto');
  const setTheme = useStore((s) => s.setTheme);

  const canRemove = groups.length > 1;

  const handleSelectGroup = (group: string) => {
    selectGroup(group);
    closeModal();
  };

  const handleAddGroup = () => {
    openModal(GroupsModal, {
      onSelect: (group: string) => {
        selectGroup(group);
      },
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    closeModal();
  };

  const handleTelegram = () => {
    window.open(`https://t.me/${TELEGRAM_CHANNEL}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="menu-modal">
      <GroupSelector
        groups={groups}
        selectedGroup={selectedGroup}
        onSelect={handleSelectGroup}
        onRemove={removeGroup}
        onAdd={handleAddGroup}
        canRemove={canRemove}
      />

      <div className="menu-modal__section">
        {MAIN_ITEMS.map((item, i) => (
          <MenuItem
            key={item.title}
            icon={item.icon}
            color={item.color}
            title={item.title}
            index={i + 1}
            onClick={() => handleNavigate(item.path)}
          />
        ))}
      </div>

      <div className="menu-modal__section">
        <ThemeSelector
          theme={theme as Theme}
          onSelect={setTheme}
          index={MAIN_ITEMS.length + 1}
        />
        <MenuItem
          icon={Send}
          color="#0088CC"
          title="Telegram"
          index={MAIN_ITEMS.length + 2}
          onClick={handleTelegram}
        />
      </div>
    </div>
  );
}