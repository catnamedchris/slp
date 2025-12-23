// Reverse lookup functions for goal planning

import type { ValueWithProvenance } from '@/shared/lib/types';
import type { ParsedScore, SubtestKey, RawToStandardRow } from '../types';
import type { LookupContext } from '../data/context';
import { isExact } from './tables';

/**
 * Reverse lookup: finds the standard score that corresponds to a target percentile.
 * Used for goal planning ("what SS do I need to reach the 50th percentile?").
 */
export const lookupStandardScoreFromPercentile = (
  targetPercentile: number,
  ctx: LookupContext
): ValueWithProvenance<ParsedScore> => {
  const c1 = ctx.standardToPercentile;

  // C1 has 3 columns of SS/percentile pairs per row
  for (const row of c1.rows) {
    const pairs: Array<{ ss: ParsedScore | null; pr: ParsedScore | null }> = [
      { ss: row.standardScore1, pr: row.percentileRank1 },
      { ss: row.standardScore2, pr: row.percentileRank2 },
      { ss: row.standardScore3, pr: row.percentileRank3 },
    ];

    for (const { ss, pr } of pairs) {
      if (pr && isExact(pr) && pr.value === targetPercentile && ss !== null) {
        const ssValue = isExact(ss) ? ss.value : '?';
        return {
          value: ss,
          steps: [{
            tableId: c1.tableId,
            csvRow: row.csvRow,
            source: c1.source,
            description: `${targetPercentile}th percentile → Standard Score ${ssValue}`,
          }],
        };
      }
    }
  }

  return {
    value: null,
    steps: [],
    note: `Percentile ${targetPercentile} not found in C1`,
  };
};

/**
 * Reverse lookup: finds the minimum raw score needed to achieve a target standard score.
 * Used for goal planning ("what raw score do I need to reach SS 100?").
 */
export const lookupRawScoreFromStandardScore = (
  targetSS: number,
  subtest: SubtestKey,
  ageMonths: number,
  ctx: LookupContext
): ValueWithProvenance<number> => {
  const bTable = ctx.getBTableForAge(ageMonths);

  if (!bTable) {
    return {
      value: null,
      steps: [],
      note: `No table for age ${ageMonths} months`,
    };
  }

  // Find all rows where the subtest SS matches the target
  // Return the minimum raw score (first occurrence when sorted by rawScore)
  let bestRow: RawToStandardRow | null = null;

  for (const row of bTable.rows) {
    const score = row[subtest];
    if (score === null) continue;

    // Only match exact values, not bounded ones
    if (isExact(score) && score.value === targetSS) {
      if (!bestRow || row.rawScore < bestRow.rawScore) {
        bestRow = row;
      }
    }
  }

  if (!bestRow) {
    return {
      value: null,
      steps: [],
      note: `Standard score ${targetSS} not found for ${subtest} in ${bTable.tableId}`,
    };
  }

  return {
    value: bestRow.rawScore,
    steps: [{
      tableId: bTable.tableId,
      csvRow: bestRow.csvRow,
      source: bTable.source,
      description: `Standard Score ${targetSS} → Raw Score ${bestRow.rawScore}`,
    }],
  };
};
