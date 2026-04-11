import type { ProvenanceStep } from '@/shared/lib/types';

interface ScoreCellProps {
  value: string;
  steps?: ProvenanceStep[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoreCell = ({ value, steps, title, onProvenanceClick }: ScoreCellProps) => {
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
          ? 'cursor-pointer text-primary-700 font-semibold underline decoration-dotted decoration-primary-300 hover:bg-primary-50' 
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
