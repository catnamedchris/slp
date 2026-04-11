import type { SubtestKey } from '../../types';
import type { SubtestResult } from '../../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import { getSubtestDisplay } from '../../lib/scoresDisplay';
import { createRawScoreHandler } from '../../lib/inputs';
import { ScoreCells } from './ScoreHelpers';

interface SubtestRowProps {
  subtest: SubtestKey;
  rawScore: number | null;
  subtestResult: SubtestResult | null;
  disabled: boolean;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const SubtestRow = ({
  subtest,
  rawScore,
  subtestResult,
  disabled,
  onRawScoreChange,
  onProvenanceClick,
}: SubtestRowProps) => {
  const handleInputChange = createRawScoreHandler(subtest, onRawScoreChange);
  const display = getSubtestDisplay(subtest, subtestResult);

  return (
    <tr className="table-row-animate odd:bg-slate-50/50 hover:bg-primary-50/50">
      <td className="text-left text-sm text-slate-700 py-4 px-3 border-b border-slate-100 border-r border-slate-200">
        <label htmlFor={`raw-${subtest}`} className="font-medium">
          {display.label}
        </label>
        {display.note && (
          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {display.note}
          </div>
        )}
      </td>
      <td className="py-4 px-3 text-center border-b border-slate-100">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          id={`raw-${subtest}`}
          min="0"
          value={rawScore ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder=""
          className="w-20 py-2 px-3 border-2 border-slate-200 bg-slate-50 rounded-lg text-center text-sm font-medium placeholder:text-slate-300 disabled:bg-slate-100 disabled:border-dashed disabled:border-slate-300 disabled:text-slate-300 disabled:cursor-not-allowed focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </td>
      <ScoreCells scores={display.scores} title={display.label} onProvenanceClick={onProvenanceClick} />
    </tr>
  );
};

export default SubtestRow;
