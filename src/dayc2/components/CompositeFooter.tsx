import type { DomainResult } from '../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import { getDomainDisplay, DOMAIN_LABELS, type SemanticTone } from '../lib/scoresDisplay';

interface CompositeFooterProps {
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const TONE_TEXT: Record<SemanticTone, string> = {
  neutral: 'text-[#cbd5e1]',
  low: 'text-rose-600',
  average: 'text-primary-700',
  high: 'text-emerald-600',
};

const COMPOSITE_SCORE_LABELS: Record<string, string> = {
  standardScore: 'Standard',
  percentile: 'Percentile',
};

const CompositeFooter = ({ result, onProvenanceClick }: CompositeFooterProps) => {
  const display = getDomainDisplay(result);

  return (
    <div className="border-t-2 border-[#e0e7ff] bg-[#fafaff] py-2 px-4 flex items-center justify-between">
      {/* Left: label */}
      <div className="text-[13px] font-bold text-slate-700 flex items-center gap-[6px]">
        {DOMAIN_LABELS.communication}
        <span className="text-[8px] font-bold uppercase tracking-[0.05em] text-primary-500 bg-primary-50 px-[6px] py-[2px] rounded-full">
          Composite
        </span>
      </div>

      {/* Right: scores */}
      <div className="flex gap-[18px]">
        {/* Sum */}
        <div className="text-center">
          <div className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Sum</div>
          <div className="text-[15px] font-extrabold text-primary-700">{display.sum}</div>
        </div>

        {/* Standard + Percentile */}
        {display.scores.map((score) => {
          const hasProvenance = score.steps.length > 0 && onProvenanceClick;
          const toneClass = hasProvenance ? TONE_TEXT[score.tone] : 'text-[#cbd5e1]';

          return (
            <div key={score.key} className="text-center">
              <div className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                {COMPOSITE_SCORE_LABELS[score.key] ?? score.label}
              </div>
              <div
                className={`text-[15px] font-extrabold ${toneClass} ${hasProvenance ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={
                  hasProvenance
                    ? (e: React.MouseEvent<HTMLDivElement>) => {
                        onProvenanceClick(score.steps, e.currentTarget, DOMAIN_LABELS.communication);
                      }
                    : undefined
                }
                title={hasProvenance ? 'Tap to view calculation' : undefined}
              >
                {score.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompositeFooter;
