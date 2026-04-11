import type { ProvenanceStep } from '@/shared/lib/types';

type SemanticTone = 'neutral' | 'low' | 'average' | 'high';

interface ScoreChipProps {
  label: string;
  value: string;
  steps?: ProvenanceStep[];
  title?: string;
  tone?: SemanticTone;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const TONE_STYLES: Record<SemanticTone, { value: string }> = {
  neutral: { value: 'text-slate-700' },
  low: { value: 'text-rose-600' },
  average: { value: 'text-primary-700' },
  high: { value: 'text-emerald-600' },
};

const ScoreChip = ({ label, value, steps, title, tone = 'neutral', onProvenanceClick }: ScoreChipProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;
  const styles = hasProvenance ? TONE_STYLES[tone] : null;

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
      className={`score-chip relative flex-1 px-3 py-3 rounded-xl border-2 text-left transition-all ${
        hasProvenance
          ? 'border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98]'
          : 'border-slate-200 bg-slate-50 opacity-70'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
    >
      <div className="text-[9px] font-medium tracking-wider text-slate-400 uppercase mb-1">
        {label}
      </div>
      <div className={`score-value text-3xl font-extrabold tracking-tight ${hasProvenance ? styles!.value : 'text-slate-400'}`}>
        {value}
      </div>
      {hasProvenance && (
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary-400" />
      )}
    </button>
  );
};

export default ScoreChip;
