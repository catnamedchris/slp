// ScoresTable: Combined raw score input and results display
import type { CalculationResult } from '../../lib/calculate';
import type { SubtestKey } from '../../types';
import type { ProvenanceStep } from '@/shared/lib/types';
import type { RawScores } from '../../lib/rawScores';
import { SUBTESTS, DOMAINS, DOMAIN_LABELS, type DomainKey } from '../../lib/scoresDisplay';
import { isDayc2AgeInRange } from '../../constants';
import SubtestCard from './SubtestCard';
import SubtestRow from './SubtestRow';
import DomainCard from './DomainCard';
import DomainRow from './DomainRow';

interface ScoresTableProps {
  ageMonths: number | null;
  rawScores: RawScores;
  result: CalculationResult | null;
  visibleSubtests: Set<SubtestKey>;
  visibleDomains: Set<DomainKey>;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

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
      <header className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h2 className="text-slate-800 font-semibold text-lg m-0">Scores</h2>
      </header>
      
      <div className="p-5">
        {isDisabled && (
          <div className="alert-warning mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-amber-800 text-sm font-medium m-0">
              Enter valid child information to enable score entry.
            </p>
          </div>
        )}

        {/* Mobile: Card layout */}
        <div className="md:hidden space-y-4">
          {visibleSubtestList.map((subtest) => (
            <SubtestCard
              key={subtest}
              subtest={subtest}
              rawScore={rawScores[subtest]}
              subtestResult={result?.subtests[subtest] ?? null}
              disabled={isDisabled}
              onRawScoreChange={onRawScoreChange}
              onProvenanceClick={onProvenanceClick}
            />
          ))}
          {DOMAINS.filter((d) => visibleDomains.has(d)).map((domain) => (
            <DomainCard
              key={domain}
              label={DOMAIN_LABELS[domain]}
              result={result?.domains[domain] ?? null}
              onProvenanceClick={onProvenanceClick}
            />
          ))}
        </div>

        {/* Desktop/Tablet: Table layout */}
        <div className="hidden md:block overflow-x-auto -mx-5 px-5">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-primary-400">
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600 w-[28%]">Subtest</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Raw</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Standard</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Percentile</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Age Eq.</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubtestList.map((subtest) => (
                <SubtestRow
                  key={subtest}
                  subtest={subtest}
                  rawScore={rawScores[subtest]}
                  subtestResult={result?.subtests[subtest] ?? null}
                  disabled={isDisabled}
                  onRawScoreChange={onRawScoreChange}
                  onProvenanceClick={onProvenanceClick}
                />
              ))}
              {DOMAINS.filter((d) => visibleDomains.has(d)).map((domain) => (
                <DomainRow
                  key={domain}
                  label={DOMAIN_LABELS[domain]}
                  result={result?.domains[domain] ?? null}
                  onProvenanceClick={onProvenanceClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ScoresTable;
