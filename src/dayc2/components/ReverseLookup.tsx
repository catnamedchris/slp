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
    <div className="bg-surface rounded-[14px] shadow-card overflow-hidden">
      <div className="p-3 px-5 flex items-center gap-4">
        {/* Title */}
        <span className="text-base font-bold text-text-default">Targets</span>

        {/* Target input */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            id="targetPercentile"
            min={1}
            max={99}
            value={targetPercentile}
            onChange={(e) => handlePercentileChange(e.target.value)}
            onKeyDown={handleEnterAdvance}
            disabled={isDisabled}
            className="w-14 h-10 bg-input-bg border border-border-default rounded-lg text-center text-lg font-bold font-sans text-text-strong focus:border-primary-300 focus:bg-white focus:shadow-[0_0_0_3px_var(--theme-focus-ring)] focus:outline-none disabled:text-text-placeholder"
          />
          <span className="text-sm text-text-muted">%ile</span>
        </div>

        {/* Error */}
        {lookupResults?.note && (
          <span className="text-red-700 text-xs">{lookupResults.note}</span>
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
                  className={`py-2 px-4 rounded-lg text-center min-w-[64px] ${
                    hasProvenance
                      ? 'bg-input-bg border border-border-default hover:bg-primary-50 hover:border-primary-200 cursor-pointer'
                      : 'bg-input-bg border border-border-subtle'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                >
                  <div className="text-xs font-bold uppercase tracking-[0.04em] text-primary-500">{SUBTEST_ABBREVS[subtest]}</div>
                  <div className={`text-xl font-bold ${hasProvenance ? 'text-text-strong' : 'text-text-placeholder'}`}>
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
