// GoalPlanner: Reverse lookup to find raw scores needed for target percentile

import { useState, useMemo } from 'react';
import type { SubtestKey } from '../types';
import { lookupStandardScoreFromPercentile, lookupRawScoreFromStandardScore } from '../lib/goals';
import { createLookupContext } from '../data/context';
import { isExact } from '../lib/tables';
import type { ProvenanceStep } from '@/shared/lib/types';

interface GoalPlannerProps {
  ageMonths: number | null;
  onProvenanceClick?: (steps: ProvenanceStep[]) => void;
}

const SUBTEST_LABELS: Record<SubtestKey, string> = {
  cognitive: 'Cognitive',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  socialEmotional: 'Social-Emotional',
  grossMotor: 'Gross Motor',
  fineMotor: 'Fine Motor',
  adaptiveBehavior: 'Adaptive Behavior',
};

const SUBTESTS: SubtestKey[] = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
];

const COMMON_PERCENTILES = [5, 10, 16, 25, 37, 50, 63, 75, 84, 90, 95];

interface GoalResult {
  subtest: SubtestKey;
  rawScore: number | null;
  steps: ProvenanceStep[];
  note?: string;
}

const GoalPlanner = ({ ageMonths, onProvenanceClick }: GoalPlannerProps) => {
  const [targetPercentile, setTargetPercentile] = useState<number | null>(null);

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
    if (value === '') {
      setTargetPercentile(null);
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 99) {
        setTargetPercentile(parsed);
      }
    }
  };

  if (ageMonths === null) {
    return null;
  }

  return (
    <div className="card goal-planner">
      <h2>Goal Planner</h2>
      <p>Find the raw scores needed to reach a target percentile.</p>

      <div className="form-row">
        <label htmlFor="targetPercentile">Target Percentile</label>
        <select
          id="targetPercentile"
          value={targetPercentile ?? ''}
          onChange={(e) => handlePercentileChange(e.target.value)}
        >
          <option value="">Select...</option>
          {COMMON_PERCENTILES.map((p) => (
            <option key={p} value={p}>
              {p}th percentile
            </option>
          ))}
        </select>
      </div>

      {goalResults && (
        <div className="goal-results">
          {goalResults.note ? (
            <p className="error">{goalResults.note}</p>
          ) : (
            <>
              <p className="target-ss">
                Target Standard Score: <strong>{goalResults.standardScore}</strong>
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Subtest</th>
                    <th>Minimum Raw Score Needed</th>
                  </tr>
                </thead>
                <tbody>
                  {goalResults.subtests?.map((result) => (
                    <tr key={result.subtest}>
                      <td className="subtest-name">{SUBTEST_LABELS[result.subtest]}</td>
                      <td
                        className={result.steps.length > 0 && onProvenanceClick ? 'clickable' : ''}
                        onClick={
                          result.steps.length > 0 && onProvenanceClick
                            ? () => onProvenanceClick(result.steps)
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
