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
import { isExact, isRange, isBounded } from './tables';
import { SUBTEST_LABELS, AGE_EQUIV_LABELS, formatScoreValue, formatPercentileValue, formatAgeMonthsValue } from './labels';

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

  let row = bTable.rows.find((r: RawToStandardRow) => r.rawScore === rawScore);
  let clampedRaw = rawScore;

  // If raw score exceeds table max, clamp to highest available raw score
  if (!row) {
    const maxRow = bTable.rows.reduce((max: RawToStandardRow | null, r: RawToStandardRow) => 
      !max || r.rawScore > max.rawScore ? r : max, null);
    if (maxRow && rawScore > maxRow.rawScore) {
      row = maxRow;
      clampedRaw = maxRow.rawScore;
    }
  }

  if (!row) {
    return {
      value: null,
      steps: [],
      note: `Raw score ${rawScore} not found in ${bTable.tableId}`,
    };
  }

  let score = row[subtest];
  let usedRow = row;

  if (score === null) {
    for (let r = rawScore - 1; r >= 0; r--) {
      const fallbackRow = bTable.rows.find((rw: RawToStandardRow) => rw.rawScore === r);
      if (fallbackRow && fallbackRow[subtest] !== null) {
        score = fallbackRow[subtest];
        usedRow = fallbackRow;
        break;
      }
    }
  }

  if (score === null) {
    const step: ProvenanceStep = {
      tableId: bTable.tableId,
      csvRow: usedRow.csvRow,
      source: bTable.source,
      description: `${SUBTEST_LABELS[subtest]}: Raw Score ${rawScore} → Standard Score (not available)`,
    };
    return {
      value: null,
      steps: [step],
      note: `Standard score not available for ${subtest} at raw ${rawScore}`,
    };
  }

  const wasClamped = clampedRaw !== rawScore;
  const clampNote = wasClamped ? ` (entered ${rawScore}, using max ${clampedRaw})` : '';
  const step: ProvenanceStep = {
    tableId: bTable.tableId,
    csvRow: usedRow.csvRow,
    source: bTable.source,
    description: `${SUBTEST_LABELS[subtest]}: Raw Score ${clampedRaw}${clampNote} → Standard Score ${formatScoreValue(score)}`,
  };

  return {
    value: score,
    steps: [step],
    note: wasClamped
      ? `Raw score ${rawScore} exceeds table max (${clampedRaw}). Using ${clampedRaw} instead.`
      : undefined,
  };
};

/**
 * Looks up percentile rank from standard score using C1 table.
 * For bounded standard scores (e.g., <50 or >150), looks up the boundary value
 * and returns the percentile with the same bound indicator.
 */
export const lookupPercentile = (
  standardScore: ParsedScore,
  ctx: LookupContext
): ValueWithProvenance<ParsedPercentile> => {
  // Reject NumberRange inputs - percentile lookup requires exact or bounded scores
  if (!isExact(standardScore) && !isBounded(standardScore)) {
    return {
      value: null,
      steps: [],
      note: 'Percentile lookup requires an exact or bounded standard score',
    };
  }

  const ssValue = standardScore.value;
  const bound = isBounded(standardScore) ? standardScore.bound : null;
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
        // If original standard score was bounded, apply same bound to percentile
        const resultPercentile: ParsedPercentile = bound && isExact(pr)
          ? { bound, value: pr.value }
          : pr;
        const boundPrefix = bound ? (bound === 'lt' ? '<' : '>') : '';
        return {
          value: resultPercentile,
          steps: [{
            tableId: c1.tableId,
            csvRow: row.csvRow,
            source: c1.source,
            description: `Standard Score ${boundPrefix}${ssValue} → Percentile ${formatPercentileValue(resultPercentile)}`,
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
    } else if (isBounded(domainValue)) {
      // Bounded value: >X means rawScore > X, <X means rawScore < X
      matches = domainValue.bound === 'gt'
        ? rawScore > domainValue.value
        : rawScore < domainValue.value;
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
          description: `${AGE_EQUIV_LABELS[domain]}: Raw Score ${rawScore} → Age Equivalent ${formatAgeMonthsValue(row.ageMonths)}`,
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
      } else if (isBounded(sumRange)) {
        matches = sumRange.bound === 'gt'
          ? sum > sumRange.value
          : sum < sumRange.value;
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
            description: `Sum of Standard Scores ${sum} → Composite ${formatScoreValue(ss)}`,
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
