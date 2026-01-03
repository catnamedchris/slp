// useCalculation: Hook to calculate DAYC-2 scores from inputs

import { useMemo } from 'react';
import type { CalculationResult } from '../lib/calculate';
import { calculateAllScores } from '../lib/calculate';
import { createLookupContext } from '../data/context';
import type { RawScores } from '../components/RawScoresForm';
import { isDayc2AgeInRange } from '../constants';

interface UseCalculationParams {
  ageMonths: number | null;
  rawScores: RawScores;
}

interface UseCalculationResult {
  result: CalculationResult | null;
}

export const useCalculation = ({
  ageMonths,
  rawScores,
}: UseCalculationParams): UseCalculationResult => {
  const result = useMemo(() => {
    if (!isDayc2AgeInRange(ageMonths)) {
      return null;
    }

    const ctx = createLookupContext();
    return calculateAllScores({ ageMonths: ageMonths as number, rawScores }, ctx);
  }, [ageMonths, rawScores]);

  return { result };
};

export default useCalculation;
