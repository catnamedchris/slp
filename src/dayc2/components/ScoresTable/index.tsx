// ScoresTable: Compact unified table for raw score input and computed results
import type { CalculationResult } from '../../lib/calculate';
import type { SubtestKey } from '../../types';
import type { ProvenanceStep } from '@/shared/lib/types';
import type { RawScores } from '../../lib/rawScores';
import {
  SUBTESTS,
  SUBTEST_ABBREVS,
  DOMAINS,
  DOMAIN_LABELS,
  type DomainKey,
} from '../../lib/scoresDisplay';
import { getSubtestDisplay, getDomainDisplay, type SemanticTone } from '../../lib/scoresDisplay';
import { isDayc2AgeInRange } from '../../constants';
import { createRawScoreHandler } from '../../lib/inputs';

interface ScoresTableProps {
  ageMonths: number | null;
  rawScores: RawScores;
  result: CalculationResult | null;
  visibleSubtests: Set<SubtestKey>;
  visibleDomains: Set<DomainKey>;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const TONE_TEXT: Record<SemanticTone, string> = {
  neutral: 'text-slate-400',
  low: 'text-rose-600',
  average: 'text-primary-700',
  high: 'text-emerald-600',
};

const ScoresTable = ({
  ageMonths,
  rawScores,
  result,
  visibleSubtests,
  visibleDomains,
  onRawScoreChange,
  onProvenanceClick,
}: ScoresTableProps) => {
  const isDisabled = !isDayc2AgeInRange(ageMonths);
  const visibleSubtestList = SUBTESTS.filter((s) => visibleSubtests.has(s));

  return (
    <section className="bg-white rounded-2xl shadow-card overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-100 bg-white">
        <h2 className="text-slate-800 font-bold text-lg m-0">Scores</h2>
      </header>

      {isDisabled && (
        <div className="px-4 pt-3">
          <div className="alert-warning flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-amber-800 text-sm font-medium m-0">
              Enter valid child information to enable score entry.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-primary-400">
              <th className="py-2 px-3 text-left text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-500 w-[30%]">Subtest</th>
              <th className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-500">Raw</th>
              <th className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-500">SS</th>
              <th className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-500">%ile</th>
              <th className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-500">Age Eq.</th>
            </tr>
          </thead>
          <tbody>
            {visibleSubtestList.map((subtest) => {
              const subtestResult = result?.subtests[subtest] ?? null;
              const display = getSubtestDisplay(subtest, subtestResult);
              const rawScore = rawScores[subtest];
              const handleChange = createRawScoreHandler(subtest, onRawScoreChange);

              return (
                <tr key={subtest} className="table-row-animate odd:bg-slate-50/30 hover:bg-primary-50/30">
                  <td className="py-2.5 px-3 border-b border-slate-100">
                    <label htmlFor={`raw-${subtest}`} className="text-sm font-medium text-slate-700">
                      <span className="hidden sm:inline">{display.label}</span>
                      <span className="sm:hidden">{SUBTEST_ABBREVS[subtest]}</span>
                    </label>
                    {display.note && (
                      <div className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {display.note}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-1.5 text-center border-b border-slate-100">
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id={`raw-${subtest}`}
                      min="0"
                      value={rawScore ?? ''}
                      onChange={(e) => handleChange(e.target.value)}
                      disabled={isDisabled}
                      placeholder="—"
                      className="w-14 h-9 bg-slate-100 rounded-lg text-center text-sm font-semibold text-slate-800 placeholder:text-slate-300 placeholder:font-normal disabled:text-slate-300 disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
                    />
                  </td>
                  {display.scores.map((score) => {
                    const hasProvenance = score.steps.length > 0 && onProvenanceClick;
                    return (
                      <td
                        key={score.key}
                        className={`py-2.5 px-2 text-center text-sm font-semibold border-b border-slate-100 transition-colors ${
                          hasProvenance
                            ? `cursor-pointer ${TONE_TEXT[score.tone]} hover:bg-slate-50`
                            : 'text-slate-300'
                        }`}
                        onClick={
                          hasProvenance
                            ? (e: React.MouseEvent<HTMLTableCellElement>) => {
                                onProvenanceClick(score.steps, e.currentTarget, display.label);
                              }
                            : undefined
                        }
                        title={hasProvenance ? 'Tap to view calculation' : undefined}
                      >
                        {score.value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Domain composite rows */}
            {DOMAINS.filter((d) => visibleDomains.has(d)).map((domain) => {
              const domainResult = result?.domains[domain] ?? null;
              const display = getDomainDisplay(domainResult);

              return (
                <tr key={domain} className="table-row-animate bg-primary-50/30">
                  <td className="py-2.5 px-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">{DOMAIN_LABELS[domain]}</span>
                    <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wider text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded-full">Composite</span>
                    {display.showNote && display.note && (
                      <div className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {display.note}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-1.5 text-center text-sm font-semibold text-slate-500 border-b border-slate-100" title={display.note ?? undefined}>
                    {display.sum}
                    {display.showNote && <span className="ml-0.5 text-amber-600">⚠</span>}
                  </td>
                  {display.scores.map((score) => {
                    const hasProvenance = score.steps.length > 0 && onProvenanceClick;
                    return (
                      <td
                        key={score.key}
                        className={`py-2.5 px-2 text-center text-sm font-semibold border-b border-slate-100 transition-colors ${
                          hasProvenance
                            ? `cursor-pointer ${TONE_TEXT[score.tone]} hover:bg-slate-50`
                            : 'text-slate-300'
                        }`}
                        onClick={
                          hasProvenance
                            ? (e: React.MouseEvent<HTMLTableCellElement>) => {
                                onProvenanceClick(score.steps, e.currentTarget, DOMAIN_LABELS[domain]);
                              }
                            : undefined
                        }
                        title={hasProvenance ? 'Tap to view calculation' : undefined}
                      >
                        {score.value}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-2 text-center text-sm text-slate-300 border-b border-slate-100">—</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ScoresTable;
