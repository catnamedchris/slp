import type { SubtestKey } from '../../types';
import type { SubtestResult } from '../../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import { getSubtestDisplay } from '../../lib/scoresDisplay';
import { createRawScoreHandler } from '../../lib/inputs';
import { ScoreChips } from './ScoreHelpers';

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

  return (
    <article className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-card card-interactive animate-slide-up">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-800">{display.label}</h3>
      </header>

      <div className="mb-4">
        <label
          htmlFor={`raw-mobile-${subtest}`}
          className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
        >
          Raw Score
        </label>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          id={`raw-mobile-${subtest}`}
          min="0"
          value={rawScore ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter score"
          className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal disabled:bg-slate-100 disabled:border-dashed disabled:border-slate-300 disabled:text-slate-300 disabled:cursor-not-allowed focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </div>

      {display.note && (
        <p className="text-xs text-amber-600 mb-3 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {display.note}
        </p>
      )}

      <div className="flex gap-2">
        <ScoreChips scores={display.scores} title={display.label} onProvenanceClick={onProvenanceClick} />
      </div>
    </article>
  );
};

export default SubtestCard;
