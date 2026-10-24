import { useMemo } from 'react';
import { Database, Hash, RotateCcw } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import { resetApp } from '../utils/resetApp';
import '../styles/DebugModal.css';

interface MetricRow {
  label: string;
  value: string;
}

const fmt = (n: number): string => n.toLocaleString('ru-RU');

export default function DebugModal() {
  const { closeModal } = useModal();

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

  const hashes: MetricRow[] = useMemo(
    () => [
      { label: 'schedule', value: scheduleHash ?? '—' },
      { label: 'exams', value: examsHash ?? '—' },
      { label: 'students', value: studentsHash ?? '—' },
      { label: 'ads', value: adsHash ?? '—' },
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
      { label: 'schedule', value: scheduleUpdatedAt ?? '—' },
      { label: 'exams', value: examsUpdatedAt ?? '—' },
      { label: 'students', value: studentsUpdatedAt ?? '—' },
      { label: 'ads', value: adsUpdatedAt ?? '—' },
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
        <section className="debug_modal__section">
          <h3 className="debug_modal__section__title">
            <Hash size={14} strokeWidth={2.2} />
            Хэши данных
          </h3>
          <div className="debug_modal__rows">
            {hashes.map((row) => (
              <div className="debug_modal__row" key={`hash-${row.label}`}>
                <span className="debug_modal__row__label">{row.label}</span>
                <span className="debug_modal__row__value debug_modal__row__value--mono">
                  {row.value}
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