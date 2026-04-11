import type { ProvenanceStep } from '@/shared/lib/types';
import type { SemanticTone } from '../../lib/scoresDisplay';

const TONE_TEXT: Record<SemanticTone, string> = {
  neutral: 'text-slate-700',
  low: 'text-rose-600',
  average: 'text-primary-700',
  high: 'text-emerald-600',
};

interface ScoreCellProps {
  value: string;
  steps?: ProvenanceStep[];
  title?: string;
  tone?: SemanticTone;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoreCell = ({ value, steps, title, tone = 'neutral', onProvenanceClick }: ScoreCellProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;

  const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (hasProvenance) {
      onProvenanceClick(steps, e.currentTarget, title);
    }
  };

  return (
    <td
      className={`py-4 px-3 text-center text-sm border-b border-slate-100 transition-colors ${
        hasProvenance 
          ? `cursor-pointer ${TONE_TEXT[tone]} font-semibold hover:bg-slate-50` 
          : 'text-slate-400'
      }`}
      onClick={handleClick}
      title={hasProvenance ? 'Click to view calculation details' : undefined}
    >
      {value}
    </td>
  );
};

export default ScoreCell;
