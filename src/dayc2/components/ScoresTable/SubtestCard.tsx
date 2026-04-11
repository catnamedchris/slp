import type { SubtestKey } from '../../types';
import type { SubtestResult } from '../../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import { getSubtestDisplay } from '../../lib/scoresDisplay';
import { createRawScoreHandler } from '../../lib/inputs';

interface SubtestCardProps {
  subtest: SubtestKey;
  rawScore: number | null;
  subtestResult: SubtestResult | null;
  disabled: boolean;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const SubtestCard = ({
  subtest,
  rawScore,
  subtestResult,
  disabled,
  onRawScoreChange,
  onProvenanceClick,
}: SubtestCardProps) => {
  const handleInputChange = createRawScoreHandler(subtest, onRawScoreChange);
  const display = getSubtestDisplay(subtest, subtestResult);

  const hasResults = rawScore !== null;

  return (
    <article className={`rounded-2xl border bg-white shadow-card card-interactive animate-slide-up transition-all ${
      hasResults ? 'border-primary-200 p-4' : 'border-slate-200 px-4 py-3'
    }`}>
      {/* Row 1: Name + capsule input */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{display.label}</h3>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          id={`raw-mobile-${subtest}`}
          min="0"
          value={rawScore ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder="—"
          className="w-16 h-9 bg-slate-100 rounded-lg text-center text-base font-semibold text-slate-800 placeholder:text-slate-300 placeholder:font-normal disabled:text-slate-300 disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
        />
      </div>

      {display.note && (
        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {display.note}
        </p>
      )}

      {/* Row 2: Result rail — only shown when score is entered */}
      {hasResults && (
        <div className="mt-3 flex rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-200 overflow-hidden animate-value-in">
          {display.scores.map((score) => {
            const hasProvenance = score.steps.length > 0 && onProvenanceClick;
            return (
              <button
                key={score.key}
                type="button"
                disabled={!hasProvenance}
                onClick={hasProvenance ? (e: React.MouseEvent<HTMLButtonElement>) => onProvenanceClick(score.steps, e.currentTarget, display.label) : undefined}
                className={`flex-1 py-2.5 px-2 text-center transition-colors ${
                  hasProvenance ? 'hover:bg-slate-100 active:bg-slate-200' : ''
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500`}
              >
                <div className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">{score.label}</div>
                <div className={`score-value text-xl font-bold tracking-tight mt-0.5 whitespace-nowrap ${
                  hasProvenance
                    ? (score.tone === 'low' ? 'text-rose-600' : score.tone === 'high' ? 'text-emerald-600' : 'text-primary-700')
                    : 'text-slate-400'
                }`}>
                  {score.value}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
};

export default SubtestCard;
