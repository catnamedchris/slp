import type { DomainResult } from '../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import { getDomainDisplay, DOMAIN_LABELS, type SemanticTone } from '../lib/scoresDisplay';

interface CompositeFooterProps {
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const TONE_CLASSES: Record<SemanticTone, string> = {
  neutral: 'text-text-placeholder',
  low: 'text-score-low',
  average: 'text-text-strong',
  high: 'text-score-high',
};

const COMPOSITE_SCORE_LABELS: Record<string, string> = {
  standardScore: 'SS',
  percentile: '%ile',
};

const CompositeFooter = ({ result, onProvenanceClick }: CompositeFooterProps) => {
  const display = getDomainDisplay(result);

  return (
    <div className="border-t-2 border-primary-100 bg-primary-50/50 grid grid-cols-1 md:grid-cols-[var(--score-grid-width)_1fr]">
      {/* Left: label + scores — mirrors SubtestRow left column */}
      <div className="p-3 px-4 flex flex-col gap-1.5">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-text-default">{DOMAIN_LABELS.communication}</span>
          <span className="text-xs font-bold uppercase tracking-[0.04em] text-primary-500 bg-primary-50 px-2 py-[2px] rounded-full">
            Composite
          </span>
        </div>

        {/* Score grid — aligned with SubtestRow's score cells */}
        <div className="flex gap-3 items-start">
          {/* Sum */}
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.04em] text-text-faint mb-1">Sum</div>
            <div key={display.sum} className={`h-10 flex items-center justify-center text-xl font-bold text-text-strong score-value ${display.sum !== '—' ? 'animate-value-in' : ''}`}>{display.sum}</div>
          </div>

          {/* Standard + Percentile */}
          {display.scores.map((score) => {
            const hasProvenance = score.steps.length > 0 && onProvenanceClick;
            const toneClass = hasProvenance ? TONE_CLASSES[score.tone] : 'text-text-placeholder';

            return (
              <div key={score.key} className="flex-1 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.04em] text-text-faint mb-1">
                  {COMPOSITE_SCORE_LABELS[score.key] ?? score.label}
                </div>
                <div
                  key={score.value}
                  className={`h-10 flex items-center justify-center text-xl font-bold score-value whitespace-nowrap ${score.value !== '—' ? 'animate-value-in' : ''} ${toneClass} ${hasProvenance ? 'cursor-pointer hover:opacity-80' : ''}`}
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

      {/* Right: empty — maintains grid alignment with SubtestRow */}
      <div className="hidden md:block" />
    </div>
  );
};

export default CompositeFooter;
