import { memo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cascade } from '../../animations/presets';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

function shade(hex: string, delta: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + delta;
  let g = ((num >> 8) & 0x00ff) + delta;
  let b = (num & 0x0000ff) + delta;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface MenuItemProps {
  icon?: LucideIcon;
  color: string;
  title: string;
  right?: ReactNode;
  onClick?: () => void;
  index: number;
  clickable?: boolean;
}

export const MenuItem = memo(function MenuItem({
  icon: Icon,
  color,
  title,
  right,
  onClick,
  index,
  clickable = true,
}: MenuItemProps) {
  return (
    <motion.div
      className={'menu-modal__item' + (clickable ? ' menu-modal__item--clickable' : '')}
      onClick={onClick}
      {...cascade(index)}
      whileTap={clickable ? { scale: 0.98 } : undefined}
    >
      <motion.span
        className="menu-modal__icon"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -18)} 100%)`,
          boxShadow: `0 4px 12px -4px ${color}80`,
        }}
        whileTap={{ scale: 0.9 }}
      >
        {Icon && <Icon size={16} color="#fff" strokeWidth={2.2} />}
      </motion.span>

      <span className="menu-modal__title">{title}</span>
      {right && <span className="menu-modal__right">{right}</span>}
      {clickable && (
        <span className="menu-modal__chevron">
          <ChevronRight size={16} strokeWidth={2.4} />
        </span>
      )}
    </motion.div>
  );
});