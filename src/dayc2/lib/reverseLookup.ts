// Reverse lookup functions

import type { ValueWithProvenance } from '@/shared/lib/types';
import { createFailureStep } from '@/shared/lib/provenance';
import type { ParsedScore, SubtestKey, RawToStandardRow } from '../types';
import type { LookupContext } from '../data/context';
import { isExact } from './tables';

/**
 * Reverse lookup: finds the standard score that corresponds to a target percentile.
 * Used for reverse lookup ("what SS do I need to reach the 50th percentile?").
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
    steps: [createFailureStep(
      c1.tableId,
      c1.source,
      `${targetPercentile}th percentile not found in table`
    )],
    note: `Percentile ${targetPercentile} not found in C1`,
  };
};

/**
 * Reverse lookup: finds the minimum raw score needed to achieve a target standard score.
 * Used for reverse lookup ("what raw score do I need to reach SS 100?").
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
      note: `No B table available for age ${ageMonths} months (valid range: 12-71 months)`,
    };
  }

  // Find the minimum raw score that achieves at most the target SS
  // (For qualification: you qualify if your score is at or below the threshold)
  // If exact match not found, use the next highest available SS that's still ≤ target
  let bestRow: RawToStandardRow | null = null;
  let bestSS: number | null = null;

  for (const row of bTable.rows) {
    const score = row[subtest];
    if (score === null) continue;

    // Only consider exact values, not bounded ones
    if (!isExact(score)) continue;

    const ss = score.value;

    // We want scores <= targetSS (at or below the threshold)
    // Among those, find the highest SS (closest to target)
    // Among rows with that SS, find the minimum raw score
    if (ss <= targetSS) {
      if (bestSS === null || ss > bestSS || (ss === bestSS && row.rawScore < bestRow!.rawScore)) {
        bestSS = ss;
        bestRow = row;
      }
    }
  }

  if (!bestRow || bestSS === null) {
    const { minMonths, maxMonths } = bTable.source.ageBand;
    return {
      value: null,
      steps: [{
        tableId: bTable.tableId,
        csvRow: null,
        source: bTable.source,
        description: `No raw score produces Standard Score ≤${targetSS} for this subtest at ages ${minMonths}–${maxMonths} months`,
      }],
      note: `Standard score ${targetSS} not achievable for this subtest at this age`,
    };
  }

  const ssNote = bestSS !== targetSS ? ` (closest available: ${bestSS})` : '';

  return {
    value: bestRow.rawScore,
    steps: [{
      tableId: bTable.tableId,
      csvRow: bestRow.csvRow,
      source: bTable.source,
      description: `Standard Score ≤${targetSS}${ssNote} → Raw Score ${bestRow.rawScore}`,
    }],
  };
};
