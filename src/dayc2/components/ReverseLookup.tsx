// ReverseLookup: Inline display of minimum raw scores for a target percentile
// When stuck (scrolled), merges age + eligibility + clear into a unified sticky bar

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
  onClear?: () => void;
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

const formatAge = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return `${years}yr ${remainder}mo`;
};

const ReverseLookup = ({
  ageMonths,
  targetPercentile,
  onTargetPercentileChange,
  onProvenanceClick,
  exceedingSubtests = {},
  onClear,
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
      {isStuck ? (
        /* Stuck: single compact row */
        <div className="py-2 px-5 flex items-center gap-4">
          {ageMonths !== null && (
            <>
              <span className="text-base font-bold text-text-strong">{ageMonths} mo</span>
              <span className="text-sm text-text-muted">({formatAge(ageMonths)})</span>
              <div className="w-px h-5 bg-border-default" />
            </>
          )}
          <span className="text-base font-bold text-text-default">Targets</span>
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
              className="w-14 h-10 text-xl bg-input-bg border border-border-default rounded-lg text-center font-bold font-sans text-text-strong focus:border-primary-300 focus:bg-white focus:shadow-[0_0_0_3px_var(--theme-focus-ring)] focus:outline-none disabled:text-text-placeholder"
            />
            <span className="text-sm text-text-muted">%ile</span>
          </div>
          {lookupResults?.note && (
            <span className="text-red-700 text-xs">{lookupResults.note}</span>
          )}
          {!lookupResults?.note && visibleResults.length > 0 && (
            <div className="flex gap-3 items-center">
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
                    className={`rounded-lg flex items-baseline gap-1.5 px-1.5 py-0.5 ${
                      exceeds ? 'bg-red-50' : hasProvenance ? 'hover:bg-primary-50 cursor-pointer' : ''
                    } ${hasProvenance ? 'cursor-pointer' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                  >
                    <div className={`text-xs font-bold uppercase tracking-[0.04em] ${exceeds ? 'text-red-600' : 'text-primary-500'}`}>{SUBTEST_ABBREVS[subtest]}</div>
                    <div className={`text-xl font-bold ${exceeds ? 'text-red-700' : hasProvenance ? 'text-text-strong' : 'text-text-placeholder'}`}>
                      {rawValue}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="ml-auto px-3 py-1.5 text-sm font-semibold text-text-faint border border-border-default rounded-lg bg-surface cursor-pointer hover:text-text-muted hover:bg-input-bg shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        /* Non-stuck: same grid skeleton as SubtestRow */
        <div className="grid grid-cols-1 md:grid-cols-[var(--score-grid-width)_1fr]">
          <div className="p-3 px-4 flex flex-col gap-1.5">
            <div className="text-base font-bold text-text-default">Targets</div>
            <div className="flex gap-3 items-start">
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-[0.04em] text-text-faint mb-1">%ile</div>
                <input
                  type="number"
                  id="targetPercentile"
                  min={1}
                  max={99}
                  value={targetPercentile}
                  onChange={(e) => handlePercentileChange(e.target.value)}
                  onKeyDown={handleEnterAdvance}
                  disabled={isDisabled}
                  className="w-14 h-10 text-xl bg-input-bg border border-border-default rounded-lg text-center font-bold font-sans text-text-strong focus:border-primary-300 focus:bg-white focus:shadow-[0_0_0_3px_var(--theme-focus-ring)] focus:outline-none disabled:text-text-placeholder"
                />
              </div>
              {lookupResults?.note && (
                <span className="text-red-700 text-xs">{lookupResults.note}</span>
              )}
              {!lookupResults?.note && visibleResults.map((r) => {
                const hasProvenance = r.steps.length > 0 && onProvenanceClick;
                const rawValue = r.rawScore !== null && r.rawScore !== undefined ? r.rawScore : '—';
                const exceeds = exceedingSubtests[r.subtest]?.exceedsTarget ?? false;
                return (
                  <div key={r.subtest} className="flex-1 text-center">
                    <div className="text-xs font-bold uppercase tracking-[0.04em] text-text-faint mb-1">
                      {SUBTEST_ABBREVS[r.subtest]}
                    </div>
                    <div
                      className={`h-10 flex items-center justify-center text-xl font-bold rounded-lg ${
                        exceeds ? 'text-red-700 bg-red-50' : hasProvenance ? 'text-text-strong' : 'text-text-placeholder'
                      } ${hasProvenance ? 'cursor-pointer hover:opacity-80' : ''}`}
                      onClick={
                        hasProvenance
                          ? (e: React.MouseEvent<HTMLDivElement>) => {
                              onProvenanceClick(r.steps, e.currentTarget, SUBTEST_LABELS[r.subtest]);
                            }
                          : undefined
                      }
                      title={r.note ?? (hasProvenance ? 'Click to view calculation details' : undefined)}
                    >
                      {rawValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hidden md:block" />
        </div>
      )}
    </div>
    </>
  );
};

export default ReverseLookup;
