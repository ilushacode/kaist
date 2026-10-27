import { useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Send } from 'lucide-react';
import type { SupportIssue } from '../utils/browserSupport';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import { TELEGRAM_CHANNEL } from '../config';
import '../styles/UnsupportedBrowser.css';

const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 } as const;
const CASCADE_START = 0.05;
const CASCADE_STEP = 0.08;

const cascade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...SPRING, delay: CASCADE_START + CASCADE_STEP * i },
});

interface UnsupportedBrowserScreenProps {
  issues: SupportIssue[];
}

const ISSUE_LABELS: Record<SupportIssue, string> = {
  indexeddb: 'Не удаётся сохранить данные на устройстве',
  localstorage: 'Браузер запрещает локальное хранилище',
  serviceworker: 'Фоновые функции недоступны',
  cachestorage: 'Кэш браузера недоступен',
  fetch: 'Сетевые запросы заблокированы',
  quota: 'На устройстве нет места для данных',
};

const SUPPORT_URL = `https://t.me/${TELEGRAM_CHANNEL}?direct`;

export const UnsupportedBrowserScreen = ({
  issues,
}: UnsupportedBrowserScreenProps) => {
  usePrefetchImage(ERROR_IMAGE_SRC);

  const isBrave = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } };
    return Boolean(nav.brave);
  }, []);

  const handleSupport = () => {
    window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="unsupported">
      <motion.div className="unsupported__image-wrap" {...cascade(0)}>
        <img
          src={ERROR_IMAGE_SRC}
          alt="Гусь грустит"
          className="unsupported__image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </motion.div>

      <motion.h1 className="unsupported__title" {...cascade(1)}>
        Браузер не поддерживается
      </motion.h1>

      <motion.p className="unsupported__subtitle" {...cascade(2)}>
        Приложение не сможет корректно работать в этом браузере.
        Попробуйте открыть его в Chrome или Safari.
      </motion.p>

      {isBrave && (
        <motion.p className="unsupported__hint" {...cascade(3)}>
          Похоже, вы используете <b>Brave</b>. Отключите «Shields» для этого
          сайта — это обычно решает проблему.
        </motion.p>
      )}

      {issues.length > 0 && (
        <motion.ul
          className="unsupported__issues"
          {...cascade(isBrave ? 4 : 3)}
        >
          {issues.map((issue) => (
            <li key={issue} className="unsupported__issue">
              <AlertTriangle size={14} strokeWidth={2.2} />
              <span>{ISSUE_LABELS[issue]}</span>
            </li>
          ))}
        </motion.ul>
      )}

      <motion.button
        type="button"
        className="unsupported__action"
        onClick={handleSupport}
        whileTap={{ scale: 0.97 }}
        {...cascade(isBrave ? 5 : 4)}
      >
        <Send size={18} strokeWidth={2.2} />
        <span>Написать в поддержку</span>
      </motion.button>

      <motion.p
        className="unsupported__footer"
        {...cascade(isBrave ? 6 : 5)}
      >
        Поддержка работает в Telegram — откроется чат с командой КАИСТ.
      </motion.p>
    </div>
  );
};