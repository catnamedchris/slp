// ReverseLookup: Inline display of minimum raw scores for a target percentile

import { useMemo, useRef, useState, useEffect } from 'react';
import { lookupStandardScoreFromPercentile, lookupRawScoreFromStandardScore } from '../lib/reverseLookup';
import { createLookupContext } from '../data/context';
import { isExact } from '../lib/tables';
import type { ProvenanceStep } from '@/shared/lib/types';
import { SUBTEST_LABELS, SUBTEST_ABBREVS, SUBTESTS, type ActiveSubtestKey } from '../lib/scoresDisplay';
import { handleEnterAdvance } from '@/shared/lib/keyboard';
import type { EligibilityMap } from '../lib/eligibility';

interface ReverseLookupProps {
  ageMonths: number | null;
  targetPercentile: number;
  onTargetPercentileChange: (value: number) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
  exceedingSubtests?: EligibilityMap;
  allExceedTargets?: boolean;
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
  exceedingSubtests = {},
  allExceedTargets = false,
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

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: '-37px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
    <div ref={sentinelRef} className="h-0" />
    <div className={`sticky top-[36px] z-10 overflow-hidden transition-[border-radius,box-shadow] duration-200 ${
      isStuck
        ? 'rounded-none shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] bg-white/92 backdrop-blur-[12px] -mx-4 px-4'
        : 'rounded-[14px] shadow-card bg-surface'
    }`}>
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
              const exceeds = exceedingSubtests[subtest]?.exceedsTarget ?? false;

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
                    exceeds
                      ? 'bg-amber-50 border border-amber-300'
                      : hasProvenance
                        ? 'bg-input-bg border border-border-default hover:bg-primary-50 hover:border-primary-200 cursor-pointer'
                        : 'bg-input-bg border border-border-subtle'
                  } ${hasProvenance ? 'cursor-pointer' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                >
                  <div className={`text-xs font-bold uppercase tracking-[0.04em] ${exceeds ? 'text-amber-700' : 'text-primary-500'}`}>{SUBTEST_ABBREVS[subtest]}</div>
                  <div className={`text-xl font-bold ${exceeds ? 'text-amber-800' : hasProvenance ? 'text-text-strong' : 'text-text-placeholder'}`}>
                    {rawValue}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {allExceedTargets && (
        <div className="px-5 pb-3">
          <div className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            All administered subtests exceed targets — child may not qualify for coverage
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ReverseLookup;
