// Scoring lookup functions with provenance tracking

import type { ValueWithProvenance, ProvenanceStep } from '@/shared/lib/types';
import type {
  ParsedScore,
  ParsedPercentile,
  ParsedAgeMonths,
  SubtestKey,
  AgeEquivalentKey,
  RawToStandardRow,
  AgeEquivalentRow,
} from '../types';
import type { LookupContext } from '../data/context';
import { isExact, isRange } from './tables';

/**
 * Looks up standard score from raw score using the appropriate B table for the child's age.
 */
export const lookupStandardScore = (
  rawScore: number,
  subtest: SubtestKey,
  ageMonths: number,
  ctx: LookupContext
): ValueWithProvenance<ParsedScore> => {
  const bTable = ctx.getBTableForAge(ageMonths);

  if (!bTable) {
    return {
      value: null,
      steps: [],
      note: `No table for age ${ageMonths} months`,
    };
  }

  const row = bTable.rows.find((r: RawToStandardRow) => r.rawScore === rawScore);

  if (!row) {
    return {
      value: null,
      steps: [],
      note: `Raw score ${rawScore} not found in ${bTable.tableId}`,
    };
  }

  const score = row[subtest];

  const step: ProvenanceStep = {
    tableId: bTable.tableId,
    csvRow: row.csvRow,
    source: bTable.source,
    description: `raw ${rawScore} → SS`,
  };

  if (score === null) {
    return {
      value: null,
      steps: [step],
      note: `Standard score not available for ${subtest} at raw ${rawScore}`,
    };
  }

  return {
    value: score,
    steps: [step],
  };
};

/**
 * Looks up percentile rank from standard score using C1 table.
 * Only works for exact standard scores (not bounded).
 */
export const lookupPercentile = (
  standardScore: ParsedScore,
  ctx: LookupContext
): ValueWithProvenance<ParsedPercentile> => {
  if (!isExact(standardScore)) {
    return {
      value: null,
      steps: [],
      note: `Cannot look up percentile for bounded standard score`,
    };
  }

  const ssValue = standardScore.value;
  const c1 = ctx.standardToPercentile;

  // C1 has 3 columns of SS/percentile pairs per row
  for (const row of c1.rows) {
    const pairs: Array<{ ss: ParsedScore | null; pr: ParsedPercentile | null }> = [
      { ss: row.standardScore1, pr: row.percentileRank1 },
      { ss: row.standardScore2, pr: row.percentileRank2 },
      { ss: row.standardScore3, pr: row.percentileRank3 },
    ];

    for (const { ss, pr } of pairs) {
      if (ss && isExact(ss) && ss.value === ssValue && pr !== null) {
        return {
          value: pr,
          steps: [{
            tableId: c1.tableId,
            csvRow: row.csvRow,
            source: c1.source,
            description: `SS ${ssValue} → percentile`,
          }],
        };
      }
    }
  }

  return {
    value: null,
    steps: [],
    note: `Standard score ${ssValue} not found in C1`,
  };
};

/**
 * Looks up age equivalent from raw score using A1 table.
 * Returns the age (in months) that corresponds to the given raw score.
 */
export const lookupAgeEquivalent = (
  rawScore: number,
  domain: AgeEquivalentKey,
  ctx: LookupContext
): ValueWithProvenance<ParsedAgeMonths> => {
  const a1 = ctx.ageEquivalents;

  for (const row of a1.rows) {
    const domainValue = row[domain as keyof AgeEquivalentRow] as ParsedScore | null;

    if (domainValue === null) continue;

    let matches = false;

    if (isRange(domainValue)) {
      // Raw score falls within range
      matches = rawScore >= domainValue.min && rawScore <= domainValue.max;
    } else if (isExact(domainValue)) {
      // Exact match
      matches = rawScore === domainValue.value;
    }

    if (matches) {
      return {
        value: row.ageMonths,
        steps: [{
          tableId: a1.tableId,
          csvRow: row.csvRow,
          source: a1.source,
          description: `raw ${rawScore} → age equiv`,
        }],
      };
    }
  }

  return {
    value: null,
    steps: [],
    note: `Raw score ${rawScore} not found in A1 for ${domain}`,
  };
};

/**
 * Looks up domain composite standard score from sum of subtest standard scores.
 * Used for Communication (RL+EL) and Physical (GM+FM) domains.
 */
export const lookupDomainComposite = (
  sum: number,
  ctx: LookupContext
): ValueWithProvenance<ParsedScore> => {
  const d1 = ctx.sumToDomain;

  // D1 has 3 columns of sum/standardScore pairs per row
  for (const row of d1.rows) {
    const pairs: Array<{ sumRange: ParsedScore | null; ss: ParsedScore | null }> = [
      { sumRange: row.sumRange1, ss: row.standardScore1 },
      { sumRange: row.sumRange2, ss: row.standardScore2 },
      { sumRange: row.sumRange3, ss: row.standardScore3 },
    ];

    for (const { sumRange, ss } of pairs) {
      if (sumRange === null || ss === null) continue;

      let matches = false;

      if (isRange(sumRange)) {
        matches = sum >= sumRange.min && sum <= sumRange.max;
      } else if (isExact(sumRange)) {
        matches = sum === sumRange.value;
      }

      if (matches) {
        return {
          value: ss,
          steps: [{
            tableId: d1.tableId,
            csvRow: row.csvRow,
            source: d1.source,
            description: `sum ${sum} → domain SS`,
          }],
        };
      }
    }
  }

  return {
    value: null,
    steps: [],
    note: `Sum ${sum} not found in D1`,
  };
};
