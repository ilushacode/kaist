import { memo } from 'react';

interface ExamEmptyProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  onRetry?: () => void;
}

export const ExamEmpty = memo(function ExamEmpty({
  title,
  subtitle,
  imageSrc,
  onRetry,
}: ExamEmptyProps) {
  return (
    <div className="exams__centred">
      <img
        src={imageSrc}
        alt="Гусь спит"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="exams__empty-image"
      />
      <p className="exams__empty-title">{title}</p>
      <p className="exams__empty-subtitle">{subtitle}</p>
      {onRetry && (
        <button type="button" className="teachers__retry" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
});