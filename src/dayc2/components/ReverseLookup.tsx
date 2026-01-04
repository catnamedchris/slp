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

  if (ageMonths === null) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/50">
        <h2 className="text-slate-800 font-semibold text-lg m-0">Reverse Lookup</h2>
        <p className="text-slate-500 text-sm mt-1 m-0">Find the raw scores needed to reach a target percentile.</p>
      </div>
      <div className="p-5">
      <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[180px_1fr] gap-2.5 mb-3 items-center">
        <label htmlFor="targetPercentile" className="font-medium text-gray-600">Target Percentile</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            id="targetPercentile"
            min={1}
            max={99}
            value={targetPercentile}
            onChange={(e) => handlePercentileChange(e.target.value)}
            placeholder="1–99"
            className="px-3 py-2 border border-gray-300 rounded text-sm w-16 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <span className="text-gray-500">%</span>
        </div>
      </div>

      {lookupResults && (
        <div className="mt-4">
          {lookupResults.note ? (
            <p className="text-red-500 text-sm">{lookupResults.note}</p>
          ) : (
            <>
              <p className="bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-3 rounded-lg mb-4 border border-teal-100">
                Target Standard Score: <strong className="text-teal-600">{lookupResults.standardScore}</strong>
              </p>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide border-b-2 border-teal-100 bg-slate-50 text-slate-500 border-r border-r-slate-200">Subtest</th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide border-b-2 border-teal-100 bg-slate-50 text-slate-500">Min. Raw Score</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleResults.map((result) => (
                    <tr key={result.subtest} className="odd:bg-slate-50 hover:bg-teal-50">
                      <td className="text-left text-sm text-slate-700 py-4 px-2.5 border-b border-gray-100 border-r border-r-slate-200">{SUBTEST_LABELS[result.subtest]}</td>
                      <td
                        className={`py-4 px-2.5 text-center text-sm text-slate-700 border-b border-gray-100 ${result.steps.length > 0 && onProvenanceClick ? 'cursor-pointer underline decoration-dotted hover:bg-blue-50' : ''}`}
                        onClick={
                          result.steps.length > 0 && onProvenanceClick
                            ? (e: React.MouseEvent<HTMLTableCellElement>) => {
                                onProvenanceClick(result.steps, e.currentTarget, SUBTEST_LABELS[result.subtest]);
                              }
                            : undefined
                        }
                        title={result.note ?? undefined}
                      >
                        {result.rawScore !== null ? result.rawScore : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ReverseLookup;
