// GoalPlanner: Reverse lookup to find raw scores needed for target percentile

import { useMemo } from 'react';
import type { SubtestKey } from '../types';
import { lookupStandardScoreFromPercentile, lookupRawScoreFromStandardScore } from '../lib/goals';
import { createLookupContext } from '../data/context';
import { isExact } from '../lib/tables';
import type { ProvenanceStep } from '@/shared/lib/types';
import { SUBTEST_LABELS, SUBTESTS } from './scoresDisplay';

interface GoalPlannerProps {
  ageMonths: number | null;
  targetPercentile: number;
  visibleSubtests: Set<SubtestKey>;
  onTargetPercentileChange: (value: number) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

interface GoalResult {
  subtest: SubtestKey;
  rawScore: number | null;
  steps: ProvenanceStep[];
  note?: string;
}

const GoalPlanner = ({
  ageMonths,
  targetPercentile,
  visibleSubtests,
  onTargetPercentileChange,
  onProvenanceClick,
}: GoalPlannerProps) => {

  const goalResults = useMemo(() => {
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
    const results: GoalResult[] = [];

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

  const visibleResults = goalResults?.subtests?.filter((r) => visibleSubtests.has(r.subtest)) ?? [];

  if (ageMonths === null) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h2 className="mt-0 mb-4 text-slate-800 font-semibold text-lg flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        Reverse Lookup
      </h2>
      <p className="text-slate-600 text-sm mb-4">Find the raw scores needed to reach a target percentile.</p>

      <div className="grid grid-cols-[180px_1fr] gap-2.5 mb-3 items-center">
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
            className="px-3 py-2 border border-gray-300 rounded text-base w-24 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <span className="text-gray-500 text-sm">%ile</span>
        </div>
      </div>

      {goalResults && (
        <div className="mt-4">
          {goalResults.note ? (
            <p className="text-red-500 text-sm">{goalResults.note}</p>
          ) : (
            <>
              <p className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 rounded-lg mb-4 border border-indigo-100">
                Target Standard Score: <strong className="text-indigo-600">{goalResults.standardScore}</strong>
              </p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left border-b-2 border-indigo-100 bg-slate-50 font-semibold text-slate-700">Subtest</th>
                    <th className="p-3 text-center border-b-2 border-indigo-100 bg-slate-50 font-semibold text-slate-700">Min. Raw Score</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleResults.map((result) => (
                    <tr key={result.subtest} className="hover:bg-gray-50">
                      <td className="p-2.5 text-left font-medium border-b border-gray-100">{SUBTEST_LABELS[result.subtest]}</td>
                      <td
                        className={`p-2.5 text-center border-b border-gray-100 ${result.steps.length > 0 && onProvenanceClick ? 'cursor-pointer underline decoration-dotted hover:bg-blue-50' : ''}`}
                        onClick={
                          result.steps.length > 0 && onProvenanceClick
                            ? (e: React.MouseEvent<HTMLTableCellElement>) => {
                                onProvenanceClick(result.steps, e.currentTarget);
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
  );
};

export default GoalPlanner;
