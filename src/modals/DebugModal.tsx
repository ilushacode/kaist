import { useMemo, useState } from 'react';
import { Database, Hash, RotateCcw, Copy, Check, Fingerprint } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { resetApp } from '../utils/resetApp';
import '../styles/DebugModal.css';

interface MetricRow {
  label: string;
  value: string;
  rawValue?: string | null; // для копирования полного значения
}

const fmt = (n: number): string => n.toLocaleString('ru-RU');

/** Обрезает длинную строку (хэш), оставляя начало и конец. */
const shortenHash = (hash: string | null | undefined): string => {
  if (!hash) return '—';
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
};

export default function DebugModal() {
  const { closeModal } = useModal();
  const { copy } = useCopyToClipboard();

  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const scheduleGroups = useStore((s) => s.scheduleGroups);
  const examsGroups = useStore((s) => s.examsGroups);
  const studentsGroups = useStore((s) => s.studentsGroups);
  const adsRaw = useStore((s) => s.adsRaw);

  const scheduleHash = useStore((s) => s.scheduleHash);
  const examsHash = useStore((s) => s.examsHash);
  const studentsHash = useStore((s) => s.studentsHash);
  const adsHash = useStore((s) => s.adsHash);

  const scheduleUpdatedAt = useStore((s) => s.scheduleUpdatedAt);
  const examsUpdatedAt = useStore((s) => s.examsUpdatedAt);
  const studentsUpdatedAt = useStore((s) => s.studentsUpdatedAt);
  const adsUpdatedAt = useStore((s) => s.adsUpdatedAt);

  const handleCopyId = async () => {
    const ok = await copy(deviceId);
    if (ok) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyHash = async (raw: string | null | undefined, label: string) => {
    if (!raw) return;
    const ok = await copy(raw);
    if (ok) {
      setCopiedHash(label);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const hashes: MetricRow[] = useMemo(
    () => [
      { label: 'Расписание', value: shortenHash(scheduleHash), rawValue: scheduleHash },
      { label: 'Экзамены', value: shortenHash(examsHash), rawValue: examsHash },
      { label: 'Студенты', value: shortenHash(studentsHash), rawValue: studentsHash },
      { label: 'Реклама', value: shortenHash(adsHash), rawValue: adsHash },
    ],
    [scheduleHash, examsHash, studentsHash, adsHash]
  );

  const metrics: MetricRow[] = useMemo(() => {
    const scheduleGroupCount = Object.keys(scheduleGroups ?? {}).length;
    const lessonsCount = Object.values(scheduleGroups ?? {}).reduce(
      (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
      0
    );

    const examsGroupCount = Object.keys(examsGroups ?? {}).length;
    const examsCount = Object.values(examsGroups ?? {}).reduce(
      (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
      0
    );

    const studentsGroupCount = Object.keys(studentsGroups ?? {}).length;
    const studentsCount = Object.values(studentsGroups ?? {}).reduce(
      (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
      0
    );

    const adsCount = Array.isArray(adsRaw) ? adsRaw.length : 0;

    return [
      { label: 'Группы с расписанием', value: fmt(scheduleGroupCount) },
      { label: 'Пар всего', value: fmt(lessonsCount) },
      { label: 'Группы с экзаменами', value: fmt(examsGroupCount) },
      { label: 'Экзаменов всего', value: fmt(examsCount) },
      { label: 'Группы со студентами', value: fmt(studentsGroupCount) },
      { label: 'Студентов всего', value: fmt(studentsCount) },
      { label: 'Объявлений', value: fmt(adsCount) },
    ];
  }, [scheduleGroups, examsGroups, studentsGroups, adsRaw]);

  const updatedAt: MetricRow[] = useMemo(
    () => [
      { label: 'Расписание', value: scheduleUpdatedAt ?? '—' },
      { label: 'Экзамены', value: examsUpdatedAt ?? '—' },
      { label: 'Студенты', value: studentsUpdatedAt ?? '—' },
      { label: 'Реклама', value: adsUpdatedAt ?? '—' },
    ],
    [scheduleUpdatedAt, examsUpdatedAt, studentsUpdatedAt, adsUpdatedAt]
  );

  const handleReset = async () => {
    closeModal();
    await resetApp();
  };

  return (
    <div className="debug_modal">
      <header className="debug_modal__header">
        <span className="debug_modal__label">Служебное</span>
        <h2 className="debug_modal__title">Отладка и данные</h2>
        <p className="debug_modal__subtitle">
          Хэши, метрики загруженных данных и полный сброс приложения.
        </p>
      </header>

      <div className="debug_modal__scroll">
        {/* ─── ID УСТРОЙСТВА (АКЦЕНТНЫЙ БЛОК) ─── */}
        <section className="debug_modal__device-card">
          <h3 className="debug_modal__device-card__title">
            <Fingerprint size={16} strokeWidth={2.2} />
            ID устройства
          </h3>
          <button
            type="button"
            className="debug_modal__device-card__btn"
            onClick={() => void handleCopyId()}
            aria-label="Скопировать ID устройства"
          >
            <span className="debug_modal__device-card__value">{deviceId}</span>
            <span
              className={
                'debug_modal__device-card__icon' +
                (copiedId ? ' debug_modal__device-card__icon--copied' : '')
              }
            >
              {copiedId ? (
                <Check size={16} strokeWidth={2.5} />
              ) : (
                <Copy size={15} strokeWidth={2.2} />
              )}
            </span>
          </button>
          <p className="debug_modal__device-card__hint">
            Нажмите, чтобы скопировать. Отправьте этот ID в поддержку для
            диагностики.
          </p>
        </section>

        <section className="debug_modal__section">
          <h3 className="debug_modal__section__title">
            <Hash size={14} strokeWidth={2.2} />
            Хэши данных
          </h3>
          <div className="debug_modal__rows">
            {hashes.map((row) => (
              <div
                className="debug_modal__row debug_modal__row--clickable"
                key={`hash-${row.label}`}
                onClick={() => void handleCopyHash(row.rawValue, row.label)}
                role="button"
                tabIndex={0}
                title="Нажмите, чтобы скопировать полный хэш"
              >
                <span className="debug_modal__row__label">{row.label}</span>
                <span className="debug_modal__row__value debug_modal__row__value--mono">
                  {copiedHash === row.label ? 'Скопировано' : row.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="debug_modal__section">
          <h3 className="debug_modal__section__title">
            <Database size={14} strokeWidth={2.2} />
            Метрики данных
          </h3>
          <div className="debug_modal__rows">
            {metrics.map((row) => (
              <div className="debug_modal__row" key={`metric-${row.label}`}>
                <span className="debug_modal__row__label">{row.label}</span>
                <span className="debug_modal__row__value">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="debug_modal__section">
          <h3 className="debug_modal__section__title">
            <RotateCcw size={14} strokeWidth={2.2} />
            Обновлено
          </h3>
          <div className="debug_modal__rows">
            {updatedAt.map((row) => (
              <div className="debug_modal__row" key={`updated-${row.label}`}>
                <span className="debug_modal__row__label">{row.label}</span>
                <span className="debug_modal__row__value debug_modal__row__value--mono">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="debug_modal__danger">
          <p className="debug_modal__danger__text">
            Сброс удалит избранные группы, кэши расписания, экзаменов,
            студентов и рекламы, а также настройки темы и install-баннера.
            После этого страница перезагрузится.
          </p>
          <button
            type="button"
            className="debug_modal__reset"
            onClick={() => void handleReset()}
          >
            Сбросить данные
          </button>
        </div>
      </div>
    </div>
  );
}