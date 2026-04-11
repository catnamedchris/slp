// ReverseLookup: Inline display of minimum raw scores for a target percentile

import { useMemo } from 'react';
import { lookupStandardScoreFromPercentile, lookupRawScoreFromStandardScore } from '../lib/reverseLookup';
import { createLookupContext } from '../data/context';
import { isExact } from '../lib/tables';
import type { ProvenanceStep } from '@/shared/lib/types';
import { SUBTEST_LABELS, SUBTEST_ABBREVS, SUBTESTS, type ActiveSubtestKey } from '../lib/scoresDisplay';
import { handleEnterAdvance } from '@/shared/lib/keyboard';

interface ReverseLookupProps {
  ageMonths: number | null;
  targetPercentile: number;
  onTargetPercentileChange: (value: number) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

export interface LookupResult {
  subtest: ActiveSubtestKey;
  rawScore: number | null;
  steps: ProvenanceStep[];
  note?: string;
}

export interface ReverseLookupResults {
  standardScore: number | null;
  ssSteps: ProvenanceStep[];
  note: string | null;
  subtests: LookupResult[] | null;
}

export const computeReverseLookup = (
  ageMonths: number | null,
  targetPercentile: number
): ReverseLookupResults | null => {
  if (ageMonths === null) return null;

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
};

const ReverseLookup = ({
  ageMonths,
  targetPercentile,
  onTargetPercentileChange,
  onProvenanceClick,
}: ReverseLookupProps) => {

  const lookupResults = useMemo(
    () => computeReverseLookup(ageMonths, targetPercentile),
    [ageMonths, targetPercentile]
  );

  const handlePercentileChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 99) {
      onTargetPercentileChange(parsed);
    }
  };

  const visibleResults = lookupResults?.subtests ?? [];
  const isDisabled = ageMonths === null;

  return (
    <div className="bg-white rounded-[14px] shadow-card overflow-hidden">
      <div className="p-[10px] px-4 flex items-center gap-3">
        {/* Title */}
        <span className="text-[13px] font-bold text-slate-700">Reverse Lookup</span>

        {/* Target input */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Target</span>
          <input
            type="number"
            id="targetPercentile"
            min={1}
            max={99}
            value={targetPercentile}
            onChange={(e) => handlePercentileChange(e.target.value)}
            onKeyDown={handleEnterAdvance}
            disabled={isDisabled}
            className="w-9 h-6 bg-slate-50 border border-slate-200 rounded-[5px] text-center text-xs font-bold font-sans text-slate-800 focus:border-primary-300 focus:bg-white focus:shadow-[0_0_0_3px_#eef2ff] focus:outline-none disabled:text-slate-300"
          />
          <span className="text-[10px] text-slate-500">%ile</span>
        </div>

        {/* Error */}
        {lookupResults?.note && (
          <span className="text-red-600 text-[10px]">{lookupResults.note}</span>
        )}

        {/* Result chips */}
        {!lookupResults?.note && visibleResults.length > 0 && (
          <div className="flex gap-[5px] ml-auto">
            {SUBTESTS.map((subtest) => {
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
                  className={`py-[5px] px-3 rounded-lg text-center min-w-[56px] ${
                    hasProvenance
                      ? 'bg-slate-50 border border-slate-200 hover:bg-primary-50 hover:border-primary-200 cursor-pointer'
                      : 'bg-slate-50 border border-slate-100'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                >
                  <div className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">{SUBTEST_ABBREVS[subtest]}</div>
                  <div className={`text-base font-extrabold ${hasProvenance ? 'text-primary-700' : 'text-slate-400'}`}>
                    {rawValue}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReverseLookup;
