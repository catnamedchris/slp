import type { ProvenanceStep } from '@/shared/lib/types';

interface ScoreChipProps {
  label: string;
  value: string;
  steps?: ProvenanceStep[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoreChip = ({ label, value, steps, title, onProvenanceClick }: ScoreChipProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasProvenance) {
      onProvenanceClick(steps, e.currentTarget, title);
    }
  };

  return (
    <button
      type="button"
      disabled={!hasProvenance}
      onClick={handleClick}
      className={`score-chip flex-1 px-3 py-3 rounded-xl border-2 text-left transition-all ${
        hasProvenance
          ? 'border-primary-200 bg-primary-50/50 hover:bg-primary-100 hover:border-primary-300 active:scale-[0.98]'
          : 'border-slate-200 bg-slate-50 opacity-70'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
    >
      <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">
        {label}
      </div>
      <div className={`text-xl font-bold ${hasProvenance ? 'text-primary-700' : 'text-slate-400'}`}>
        {value}
      </div>
    </button>
  );
};

export default ScoreChip;
