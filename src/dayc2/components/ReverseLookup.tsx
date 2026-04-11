// ReverseLookup: Compact display of minimum raw scores for a target percentile

import { useMemo } from 'react';
import type { SubtestKey } from '../types';
import { lookupStandardScoreFromPercentile, lookupRawScoreFromStandardScore } from '../lib/reverseLookup';
import { createLookupContext } from '../data/context';
import { isExact } from '../lib/tables';
import type { ProvenanceStep } from '@/shared/lib/types';
import { SUBTEST_LABELS, SUBTEST_ABBREVS, SUBTESTS } from '../lib/scoresDisplay';

interface ReverseLookupProps {
  ageMonths: number | null;
  targetPercentile: number;
  visibleSubtests: Set<SubtestKey>;
  onTargetPercentileChange: (value: number) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

interface LookupResult {
  subtest: SubtestKey;
  rawScore: number | null;
  steps: ProvenanceStep[];
  note?: string;
}

const ReverseLookup = ({
  ageMonths,
  targetPercentile,
  visibleSubtests,
  onTargetPercentileChange,
  onProvenanceClick,
}: ReverseLookupProps) => {

  const lookupResults = useMemo(() => {
    if (ageMonths === null || targetPercentile === null) return null;

    const ctx = createLookupContext();
    const ssResult = lookupStandardScoreFromPercentile(targetPercentile, ctx);

    if (!ssResult.value || !isExact(ssResult.value)) {
      return {
        standardScore: null,
        ssSteps: ssResult.steps,
        note: ssResult.note ?? 'Could not find standard score for this percentile',
        subtests: null,
      };
    }

    const targetSS = ssResult.value.value;
    const results: LookupResult[] = [];

    for (const subtest of SUBTESTS) {
      const rawResult = lookupRawScoreFromStandardScore(targetSS, subtest, ageMonths, ctx);
      results.push({
        subtest,
        rawScore: rawResult.value,
        steps: [...ssResult.steps, ...rawResult.steps],
        note: rawResult.note,
      });
    }

    return {
      standardScore: targetSS,
      ssSteps: ssResult.steps,
      note: null,
      subtests: results,
    };
  }, [ageMonths, targetPercentile]);

  const handlePercentileChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 99) {
      onTargetPercentileChange(parsed);
    }
  };

  const visibleResults = lookupResults?.subtests?.filter((r) => visibleSubtests.has(r.subtest)) ?? [];
  const isDisabled = ageMonths === null;

  return (
    <section className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Header row: title + inline target percentile input */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-slate-800 m-0 whitespace-nowrap">Reverse Lookup</h2>
          <p className="text-xs text-slate-400 m-0 hidden sm:block">Find raw scores needed for a target percentile</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <label htmlFor="targetPercentile" className="text-xs text-slate-500 whitespace-nowrap">
            Target Percentile
          </label>
          <input
            type="number"
            id="targetPercentile"
            min={1}
            max={99}
            value={targetPercentile}
            onChange={(e) => handlePercentileChange(e.target.value)}
            placeholder="1–99"
            disabled={isDisabled}
            className="w-12 h-7 bg-slate-100 rounded-md text-center text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:text-slate-300 transition-all"
          />
          <span className="text-xs text-slate-400">%</span>
        </div>
      </div>

      {/* Error state */}
      {lookupResults?.note && (
        <div className="px-4 pb-3">
          <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-200 m-0">{lookupResults.note}</p>
        </div>
      )}

      {/* Compact results: horizontal row of min raw scores */}
      {!lookupResults?.note && visibleResults.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Min. Raw Score</p>
          <div className="flex gap-2">
            {SUBTESTS.filter((s) => visibleSubtests.has(s)).map((subtest) => {
              const result = visibleResults.find((r) => r.subtest === subtest);
              const hasProvenance = result?.steps.length && onProvenanceClick;
              const rawValue = result?.rawScore !== null && result?.rawScore !== undefined ? result.rawScore : '—';

              return (
                <button
                  key={subtest}
                  type="button"
                  disabled={!hasProvenance}
                  onClick={
                    hasProvenance
                      ? (e: React.MouseEvent<HTMLButtonElement>) => {
                          onProvenanceClick(result.steps, e.currentTarget, SUBTEST_LABELS[subtest]);
                        }
                      : undefined
                  }
                  title={result?.note ?? (hasProvenance ? 'Click to view calculation details' : undefined)}
                  className={`flex-1 py-2 px-2 rounded-xl text-center transition-all ${
                    hasProvenance
                      ? 'bg-slate-50 border border-slate-200 hover:bg-primary-50 hover:border-primary-200 active:scale-[0.97] cursor-pointer'
                      : 'bg-slate-50 border border-slate-100'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                >
                  <div className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">{SUBTEST_ABBREVS[subtest]}</div>
                  <div className={`text-lg font-bold mt-0.5 ${hasProvenance ? 'text-primary-700' : 'text-slate-400'}`}>
                    {rawValue}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default ReverseLookup;
