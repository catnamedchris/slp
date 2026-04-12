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
 * Reverse lookup: finds the maximum raw score that still qualifies at a target standard score.
 *
 * Used for eligibility determination: a child qualifies for services if their
 * standard score is at or below the target. Since B tables have gaps in SS values
 * (e.g., SS jumps from 75 to 79 with no 77), we find the highest SS that doesn't
 * exceed the target, then return the minimum raw score that produces that SS.
 *
 * Example at age 24mo, target SS 77 (6th %ile), Receptive Language:
 *   raw 12 → SS 75 (qualifies ✓) ← returned
 *   raw 13 → SS 79 (does NOT qualify ✗)
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

  // Find the highest SS that is still ≤ targetSS (i.e., still qualifies).
  // Among rows with that SS, pick the minimum raw score.
  let bestRow: RawToStandardRow | null = null;
  let bestSS: number | null = null;

  for (const row of bTable.rows) {
    const score = row[subtest];
    if (score === null) continue;
    if (!isExact(score)) continue; // skip bounded values like <50 or >150

    const ss = score.value;

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
