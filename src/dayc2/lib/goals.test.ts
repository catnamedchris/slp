// Reverse lookup tests for goal planning

import { describe, it, expect, beforeEach } from 'vitest';
import {
  lookupStandardScoreFromPercentile,
  lookupRawScoreFromStandardScore,
} from './goals';
import type { LookupContext } from '../data/context';
import { createFixtureLookupContext } from '../data/fixtures';

describe('lookupStandardScoreFromPercentile', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('finds standard score for exact percentile', () => {
    // From mockC1: percentileRank 50 → standardScore 100
    const result = lookupStandardScoreFromPercentile(50, ctx);
    expect(result.value).toEqual({ value: 100 });
    expect(result.steps[0].tableId).toBe('C1');
  });

  it('finds standard score for high percentile', () => {
    // From mockC1: percentileRank 98 → standardScore 130
    const result = lookupStandardScoreFromPercentile(98, ctx);
    expect(result.value).toEqual({ value: 130 });
  });

  it('finds standard score for low percentile', () => {
    // From mockC1: percentileRank 9 → standardScore 80
    const result = lookupStandardScoreFromPercentile(9, ctx);
    expect(result.value).toEqual({ value: 80 });
  });

  it('returns null for percentile not in table', () => {
    // 99 is not directly in mockC1 (only >99.9 and 98)
    const result = lookupStandardScoreFromPercentile(99, ctx);
    expect(result.value).toBeNull();
  });
});

describe('lookupRawScoreFromStandardScore', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('finds raw score for exact standard score match', () => {
    // From mockB13: cognitive 60 at rawScore 10
    const result = lookupRawScoreFromStandardScore(60, 'cognitive', 12, ctx);
    expect(result.value).toBe(10);
    expect(result.steps[0].tableId).toBe('B13');
    expect(result.steps[0].csvRow).toBe(12);
  });

  it('finds minimum raw score when multiple rows have same SS', () => {
    // If multiple raw scores map to same SS, return the minimum
    // From mockB13: cognitive 50 at rawScore 5
    const result = lookupRawScoreFromStandardScore(50, 'cognitive', 12, ctx);
    expect(result.value).toBe(5);
  });

  it('returns null when no row has the target standard score', () => {
    // 75 is not a cognitive SS in mockB13
    const result = lookupRawScoreFromStandardScore(75, 'cognitive', 12, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('not found');
  });

  it('returns null when age has no B table', () => {
    const result = lookupRawScoreFromStandardScore(60, 'cognitive', 36, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('No table');
  });

  it('works with different subtest', () => {
    // From mockB13: fineMotor 69 at rawScore 5
    const result = lookupRawScoreFromStandardScore(69, 'fineMotor', 13, ctx);
    expect(result.value).toBe(5);
  });

  it('uses B17 for age 24', () => {
    // From mockB17: cognitive 85 at rawScore 20
    const result = lookupRawScoreFromStandardScore(85, 'cognitive', 24, ctx);
    expect(result.value).toBe(20);
    expect(result.steps[0].tableId).toBe('B17');
  });
});
