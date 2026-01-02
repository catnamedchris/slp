// calculateAllScores - orchestrates all score lookups for a child

import type { ValueWithProvenance } from '@/shared/lib/types';
import type {
  ParsedScore,
  ParsedPercentile,
  ParsedAgeMonths,
  SubtestKey,
} from '../types';
import type { LookupContext } from '../data/context';
import {
  lookupStandardScore,
  lookupPercentile,
  lookupAgeEquivalent,
  lookupDomainComposite,
} from './scoring';
import { isExact, isBounded } from './tables';

/** All 7 DAYC-2 subtests */
const SUBTESTS: SubtestKey[] = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
];

/** Input for score calculation - now supports partial scores */
export interface CalculationInput {
  ageMonths: number;
  rawScores: Record<SubtestKey, number | null>;
}

/** Result for a single subtest */
export interface SubtestResult {
  rawScore: number | null;
  standardScore: ValueWithProvenance<ParsedScore>;
  percentile: ValueWithProvenance<ParsedPercentile>;
  ageEquivalent: ValueWithProvenance<ParsedAgeMonths>;
}

/** Sum can be exact or bounded (< or >) */
export type SumValue =
  | { type: 'exact'; value: number }
  | { type: 'lt'; value: number }  // sum < value
  | { type: 'gt'; value: number };  // sum > value

/** Result for a domain composite */
export interface DomainResult {
  sum: SumValue | null;
  standardScore: ValueWithProvenance<ParsedScore>;
  percentile: ValueWithProvenance<ParsedPercentile>;
}

/** Complete calculation result */
export interface CalculationResult {
  ageMonths: number;
  subtests: Record<SubtestKey, SubtestResult>;
  domains: {
    communication: DomainResult; // RL + EL
    physical: DomainResult; // GM + FM
  };
}

const emptyResult = <T>(): ValueWithProvenance<T> => ({
  value: null,
  steps: [],
});

/**
 * Calculates scores for a single subtest.
 * Returns empty results if rawScore is null.
 */
const calculateSubtestResult = (
  rawScore: number | null,
  subtest: SubtestKey,
  ageMonths: number,
  ctx: LookupContext
): SubtestResult => {
  if (rawScore === null) {
    return {
      rawScore: null,
      standardScore: emptyResult(),
      percentile: emptyResult(),
      ageEquivalent: emptyResult(),
    };
  }

  const standardScore = lookupStandardScore(rawScore, subtest, ageMonths, ctx);

  let percentile: ValueWithProvenance<ParsedPercentile>;
  if (standardScore.value) {
    percentile = lookupPercentile(standardScore.value, ctx);
    percentile = {
      ...percentile,
      steps: [...standardScore.steps, ...percentile.steps],
    };
  } else {
    percentile = {
      value: null,
      steps: [...standardScore.steps],
      note: standardScore.note ?? 'No standard score available',
    };
  }

  const ageEquivalent = lookupAgeEquivalent(rawScore, subtest, ctx);

  return {
    rawScore,
    standardScore,
    percentile,
    ageEquivalent,
  };
};

/**
 * Calculates all scores for a child given their age and raw scores.
 * Supports partial results - subtests with null raw scores return empty results.
 */
export const calculateAllScores = (
  input: CalculationInput,
  ctx: LookupContext
): CalculationResult => {
  const { ageMonths, rawScores } = input;

  const subtests = {} as Record<SubtestKey, SubtestResult>;

  for (const subtest of SUBTESTS) {
    subtests[subtest] = calculateSubtestResult(
      rawScores[subtest],
      subtest,
      ageMonths,
      ctx
    );
  }

  const communication = calculateDomainComposite(
    subtests.receptiveLanguage,
    subtests.expressiveLanguage,
    ctx
  );

  const physical = calculateDomainComposite(
    subtests.grossMotor,
    subtests.fineMotor,
    ctx
  );

  return {
    ageMonths,
    subtests,
    domains: {
      communication,
      physical,
    },
  };
};

/**
 * Computes the sum (or sum bounds) from two standard scores.
 * Returns null if either score is missing.
 *
 * Logic for bounded scores:
 * - <X means score is at most X-1 (upper bound known, lower unknown)
 * - >Y means score is at least Y+1 (lower bound known, upper unknown)
 *
 * When combining:
 * - Both exact: exact sum
 * - Both <: sum < (v1 + v2) — both have known upper bounds
 * - Both >: sum > (v1 + v2) — both have known lower bounds
 * - One < and one >: sum > (gt value) — only lower bound is knowable
 * - Exact + bounded: inherit the bound direction
 */
const computeSumValue = (
  ss1: ParsedScore | null,
  ss2: ParsedScore | null
): SumValue | null => {
  if (!ss1 || !ss2) return null;

  // Both exact
  if (isExact(ss1) && isExact(ss2)) {
    return { type: 'exact', value: ss1.value + ss2.value };
  }

  const ss1IsBoundedLt = isBounded(ss1) && ss1.bound === 'lt';
  const ss1IsBoundedGt = isBounded(ss1) && ss1.bound === 'gt';
  const ss2IsBoundedLt = isBounded(ss2) && ss2.bound === 'lt';
  const ss2IsBoundedGt = isBounded(ss2) && ss2.bound === 'gt';

  // Both <: sum < (v1 + v2)
  if (ss1IsBoundedLt && ss2IsBoundedLt) {
    return { type: 'lt', value: ss1.value + ss2.value };
  }

  // Both >: sum > (v1 + v2)
  if (ss1IsBoundedGt && ss2IsBoundedGt) {
    return { type: 'gt', value: ss1.value + ss2.value };
  }

  // One < and one >: upper bound is unknown, so we can only express sum > (gt value)
  if (ss1IsBoundedLt && ss2IsBoundedGt) {
    return { type: 'gt', value: ss2.value };
  }
  if (ss1IsBoundedGt && ss2IsBoundedLt) {
    return { type: 'gt', value: ss1.value };
  }

  // One exact, one bounded: inherit bound direction
  if (isExact(ss1) && isBounded(ss2)) {
    return ss2.bound === 'lt'
      ? { type: 'lt', value: ss1.value + ss2.value }
      : { type: 'gt', value: ss1.value + ss2.value };
  }
  if (isBounded(ss1) && isExact(ss2)) {
    return ss1.bound === 'lt'
      ? { type: 'lt', value: ss1.value + ss2.value }
      : { type: 'gt', value: ss1.value + ss2.value };
  }

  // Fallback for range types (shouldn't happen with standard scores)
  return null;
};

/**
 * Calculates a domain composite from two subtest results.
 */
const calculateDomainComposite = (
  subtest1: SubtestResult,
  subtest2: SubtestResult,
  ctx: LookupContext
): DomainResult => {
  const ss1 = subtest1.standardScore.value;
  const ss2 = subtest2.standardScore.value;

  const subtestSteps = [...subtest1.standardScore.steps, ...subtest2.standardScore.steps];

  const sumValue = computeSumValue(ss1, ss2);

  // No valid sum (missing scores)
  if (!sumValue) {
    return {
      sum: null,
      standardScore: {
        value: null,
        steps: subtestSteps,
      },
      percentile: {
        value: null,
        steps: subtestSteps,
      },
    };
  }

  // Exact sum - look up exact composite
  if (sumValue.type === 'exact') {
    const standardScore = lookupDomainComposite(sumValue.value, ctx);
    const combinedSteps = [...subtestSteps, ...standardScore.steps];

    let percentile: ValueWithProvenance<ParsedPercentile>;
    if (standardScore.value) {
      percentile = lookupPercentile(standardScore.value, ctx);
      percentile = {
        ...percentile,
        steps: [...combinedSteps, ...percentile.steps],
      };
    } else {
      percentile = {
        value: null,
        steps: combinedSteps,
        note: 'No domain standard score available for percentile lookup',
      };
    }

    return {
      sum: sumValue,
      standardScore: { ...standardScore, steps: combinedSteps },
      percentile,
    };
  }

  // Bounded sum - look up the boundary value
  const lookupBoundedComposite = (sum: SumValue): ValueWithProvenance<ParsedScore> => {
    if (sum.type === 'lt') {
      // Sum < value means max sum is value-1
      const result = lookupDomainComposite(sum.value - 1, ctx);
      if (result.value && isExact(result.value)) {
        return {
          value: { bound: 'lt', value: result.value.value + 1 },
          steps: result.steps,
        };
      }
      return result;
    }
    if (sum.type === 'gt') {
      // Sum > value means min sum is value+1
      const result = lookupDomainComposite(sum.value + 1, ctx);
      if (result.value && isExact(result.value)) {
        return {
          value: { bound: 'gt', value: result.value.value - 1 },
          steps: result.steps,
        };
      }
      return result;
    }
    return { value: null, steps: [] };
  };

  const standardScore = lookupBoundedComposite(sumValue);
  const combinedSteps = [...subtestSteps, ...standardScore.steps];

  // For bounded scores, also compute bounded percentile
  let percentile: ValueWithProvenance<ParsedPercentile>;
  if (standardScore.value) {
    percentile = lookupPercentile(standardScore.value, ctx);
    percentile = {
      ...percentile,
      steps: [...combinedSteps, ...percentile.steps],
    };
  } else {
    percentile = {
      value: null,
      steps: combinedSteps,
    };
  }

  return {
    sum: sumValue,
    standardScore: { ...standardScore, steps: combinedSteps },
    percentile,
  };
};
