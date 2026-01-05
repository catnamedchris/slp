// ReverseLookup: Find raw scores needed for target percentile

import { useMemo } from 'react';
import type { SubtestKey } from '../types';
import { lookupStandardScoreFromPercentile, lookupRawScoreFromStandardScore } from '../lib/reverseLookup';
import { createLookupContext } from '../data/context';
import { isExact } from '../lib/tables';
import type { ProvenanceStep } from '@/shared/lib/types';
import { SUBTEST_LABELS, SUBTESTS } from '../lib/scoresDisplay';

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
      <header className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <div>
          <h2 className="text-slate-800 font-semibold text-lg m-0">Reverse Lookup</h2>
          <p className="text-slate-500 text-sm m-0 hidden sm:block">Find raw scores needed for a target percentile</p>
        </div>
      </header>
      
      <div className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-4">
          <label htmlFor="targetPercentile" className="font-medium text-slate-600 text-sm sm:w-36">
            Target Percentile
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="targetPercentile"
              min={1}
              max={99}
              value={targetPercentile}
              onChange={(e) => handlePercentileChange(e.target.value)}
              placeholder="1–99"
              disabled={isDisabled}
              className="w-20 px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-base font-semibold text-center text-slate-800 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
            />
            <span className="text-slate-500 font-medium">%</span>
          </div>
        </div>

        {isDisabled && (
          <div className="alert-warning mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-amber-800 text-sm font-medium m-0">
              Enter child age to enable lookup.
            </p>
          </div>
        )}

        <div className="mt-4">
          {lookupResults?.note ? (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">{lookupResults.note}</p>
          ) : lookupResults ? (
            <div className="alert-info mb-4">
              <span className="text-sm text-slate-600">Target Standard Score:</span>
              <span className="text-2xl font-bold text-primary-600 ml-2">{lookupResults.standardScore}</span>
            </div>
          ) : null}
          
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-primary-400">
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600 w-[50%] md:w-[28%]">Subtest</th>
                  <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Min. Raw Score</th>
                </tr>
              </thead>
              <tbody>
                {SUBTESTS.filter((s) => visibleSubtests.has(s)).map((subtest) => {
                  const result = visibleResults.find((r) => r.subtest === subtest);
                  const hasProvenance = result?.steps.length && onProvenanceClick;
                  return (
                    <tr key={subtest} className="table-row-animate odd:bg-slate-50/50 hover:bg-primary-50/50">
                      <td className="text-left text-sm font-medium text-slate-700 py-4 px-3 border-b border-slate-100 border-r border-slate-200">
                        {SUBTEST_LABELS[subtest]}
                      </td>
                      <td
                        className={`py-4 px-3 text-center text-xl font-bold md:text-sm md:font-semibold border-b border-slate-100 transition-colors ${
                          hasProvenance 
                            ? 'cursor-pointer text-primary-700 underline decoration-dotted decoration-primary-300 hover:bg-primary-50' 
                            : 'text-slate-400'
                        }`}
                        onClick={
                          hasProvenance
                            ? (e: React.MouseEvent<HTMLTableCellElement>) => {
                                onProvenanceClick(result.steps, e.currentTarget, SUBTEST_LABELS[subtest]);
                              }
                            : undefined
                        }
                        title={result?.note ?? (hasProvenance ? 'Click to view calculation details' : undefined)}
                      >
                        {result?.rawScore !== null && result?.rawScore !== undefined ? result.rawScore : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReverseLookup;
