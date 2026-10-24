import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, X } from 'lucide-react';
import '../styles/UpdateBanner.css';

interface UpdateBannerProps {
  onUpdate: () => void;
}

export const UpdateBanner = ({ onUpdate }: UpdateBannerProps) => {
  const [visible, setVisible] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    onUpdate();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="update-banner"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={handleUpdate}
        >
          <div className="update-banner__row">
            <div className="update-banner__icon">
              <RotateCw 
                size={20} 
                strokeWidth={2.4} 
                className={isUpdating ? 'update-banner__icon--spinning' : ''} 
              />
            </div>

            <div className="update-banner__content">
              <p className="update-banner__title">Доступно обновление</p>
              <p className="update-banner__subtitle">
                Нажмите, чтобы обновить приложение
              </p>
            </div>

            <button
              type="button"
              className="update-banner__close"
              onClick={handleClose}
              aria-label="Скрыть уведомление"
              title="Скрыть"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};