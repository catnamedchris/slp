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
import { isExact } from './tables';

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

/** Result for a domain composite */
export interface DomainResult {
  sum: number | null;
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
  if (standardScore.value && isExact(standardScore.value)) {
    percentile = lookupPercentile(standardScore.value, ctx);
    percentile = {
      ...percentile,
      steps: [...standardScore.steps, ...percentile.steps],
    };
  } else if (standardScore.value) {
    percentile = {
      value: null,
      steps: standardScore.steps,
      note: 'Cannot look up percentile for bounded standard score',
    };
  } else {
    percentile = {
      value: null,
      steps: [],
      note: 'No standard score available',
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
 * Calculates a domain composite from two subtest results.
 */
const calculateDomainComposite = (
  subtest1: SubtestResult,
  subtest2: SubtestResult,
  ctx: LookupContext
): DomainResult => {
  const ss1 = subtest1.standardScore.value;
  const ss2 = subtest2.standardScore.value;

  if (!ss1 || !isExact(ss1) || !ss2 || !isExact(ss2)) {
    return {
      sum: null,
      standardScore: {
        value: null,
        steps: [...subtest1.standardScore.steps, ...subtest2.standardScore.steps],
        note: 'Cannot calculate domain composite without exact standard scores from both subtests',
      },
      percentile: {
        value: null,
        steps: [],
        note: 'No domain standard score available',
      },
    };
  }

  const sum = ss1.value + ss2.value;
  const standardScore = lookupDomainComposite(sum, ctx);

  const combinedSteps = [
    ...subtest1.standardScore.steps,
    ...subtest2.standardScore.steps,
    ...standardScore.steps,
  ];

  let percentile: ValueWithProvenance<ParsedPercentile>;
  if (standardScore.value && isExact(standardScore.value)) {
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
    sum,
    standardScore: {
      ...standardScore,
      steps: combinedSteps,
    },
    percentile,
  };
};
