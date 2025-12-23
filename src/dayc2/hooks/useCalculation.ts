// useCalculation: Hook to calculate DAYC-2 scores from inputs

import { useMemo } from 'react';
import type { SubtestKey } from '../types';
import type { CalculationResult, CalculationInput } from '../lib/calculate';
import { calculateAllScores } from '../lib/calculate';
import { createLookupContext } from '../data/context';
import type { RawScores } from '../components/RawScoresForm';

interface UseCalculationParams {
  ageMonths: number | null;
  rawScores: RawScores;
}

interface UseCalculationResult {
  result: CalculationResult | null;
  isComplete: boolean;
}

const SUBTESTS: SubtestKey[] = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
];

export const useCalculation = ({
  ageMonths,
  rawScores,
}: UseCalculationParams): UseCalculationResult => {
  const result = useMemo(() => {
    if (ageMonths === null || ageMonths < 12 || ageMonths > 71) {
      return null;
    }

    const allScoresFilled = SUBTESTS.every((key) => rawScores[key] !== null);
    if (!allScoresFilled) {
      return null;
    }

    const input: CalculationInput = {
      ageMonths,
      rawScores: rawScores as Record<SubtestKey, number>,
    };

    const ctx = createLookupContext();
    return calculateAllScores(input, ctx);
  }, [ageMonths, rawScores]);

  const isComplete = result !== null;

  return { result, isComplete };
};

export default useCalculation;
