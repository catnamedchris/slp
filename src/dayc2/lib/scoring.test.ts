// Scoring function tests

import { describe, it, expect, beforeEach } from 'vitest';
import {
  lookupStandardScore,
  lookupPercentile,
  lookupAgeEquivalent,
  lookupDomainComposite,
} from './scoring';
import type { LookupContext } from '../data/context';
import { createFixtureLookupContext } from '../data/fixtures';

describe('lookupStandardScore', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('looks up exact standard score from B table', () => {
    // From mockB13: rawScore 10, cognitive = { value: 60 }
    const result = lookupStandardScore(10, 'cognitive', 12, ctx);
    expect(result.value).toEqual({ value: 60 });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].tableId).toBe('B13');
    expect(result.steps[0].csvRow).toBe(12);
  });

  it('looks up bounded standard score (less than)', () => {
    // From mockB13: rawScore 0, cognitive = { bound: 'lt', value: 50 }
    const result = lookupStandardScore(0, 'cognitive', 12, ctx);
    expect(result.value).toEqual({ bound: 'lt', value: 50 });
  });

  it('looks up bounded standard score (greater than)', () => {
    // From mockB13: rawScore 30, receptiveLanguage = { bound: 'gt', value: 150 }
    const result = lookupStandardScore(30, 'receptiveLanguage', 13, ctx);
    expect(result.value).toEqual({ bound: 'gt', value: 150 });
  });

  it('returns null value when cell is null', () => {
    // From mockB13: rawScore 30, fineMotor = null
    const result = lookupStandardScore(30, 'fineMotor', 12, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('not available');
  });

  it('returns null when age has no B table', () => {
    const result = lookupStandardScore(10, 'cognitive', 36, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('No table');
  });

  it('returns null when raw score not found in table', () => {
    // mockB13 only has rawScores 0, 5, 10, 20, 30
    const result = lookupStandardScore(15, 'cognitive', 12, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('not found');
  });

  it('uses B17 for age 24 months', () => {
    // From mockB17: rawScore 20, cognitive = { value: 85 }
    const result = lookupStandardScore(20, 'cognitive', 24, ctx);
    expect(result.value).toEqual({ value: 85 });
    expect(result.steps[0].tableId).toBe('B17');
  });
});

describe('lookupPercentile', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('looks up percentile for exact standard score', () => {
    // From mockC1: standardScore 100 → percentileRank 50
    const result = lookupPercentile({ value: 100 }, ctx);
    expect(result.value).toEqual({ value: 50 });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].tableId).toBe('C1');
  });

  it('looks up percentile for high standard score (>99.9)', () => {
    // From mockC1: standardScore 140 → percentileRank { bound: 'gt', value: 99.9 }
    const result = lookupPercentile({ value: 140 }, ctx);
    expect(result.value).toEqual({ bound: 'gt', value: 99.9 });
  });

  it('looks up percentile for low standard score (<1)', () => {
    // From mockC1: standardScore 58 → percentileRank { bound: 'lt', value: 1 }
    const result = lookupPercentile({ value: 58 }, ctx);
    expect(result.value).toEqual({ bound: 'lt', value: 1 });
  });

  it('returns null for bounded input (cannot look up)', () => {
    const result = lookupPercentile({ bound: 'lt', value: 50 }, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('bounded');
  });

  it('returns null when standard score not found', () => {
    // 200 is not in mockC1
    const result = lookupPercentile({ value: 200 }, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('not found');
  });
});

describe('lookupAgeEquivalent', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('finds age equivalent for exact raw score match', () => {
    // From mockA1: ageMonths 12, cognitive = { value: 24 }
    // So raw score 24 should give age equivalent 12 months
    const result = lookupAgeEquivalent(24, 'cognitive', ctx);
    expect(result.value).toEqual({ value: 12 });
    expect(result.steps[0].tableId).toBe('A1');
  });

  it('finds age equivalent when raw score falls in range', () => {
    // From mockA1 row 2: ageMonths { bound: 'lt', value: 1 }, cognitive = { min: 0, max: 4 }
    // Raw score 2 falls in range 0-4
    const result = lookupAgeEquivalent(2, 'cognitive', ctx);
    expect(result.value).toEqual({ bound: 'lt', value: 1 });
  });

  it('returns null when raw score not found', () => {
    // Raw score 100 is not in any A1 row for cognitive
    const result = lookupAgeEquivalent(100, 'cognitive', ctx);
    expect(result.value).toBeNull();
  });

  it('looks up domain key (communication)', () => {
    // From mockA1: ageMonths 24, communication = { value: 40 }
    const result = lookupAgeEquivalent(40, 'communication', ctx);
    expect(result.value).toEqual({ value: 24 });
  });
});

describe('lookupDomainComposite', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('looks up domain standard score for sum in exact range', () => {
    // From mockD1: sumRange { value: 140 } → standardScore { value: 70 }
    const result = lookupDomainComposite(140, ctx);
    expect(result.value).toEqual({ value: 70 });
    expect(result.steps[0].tableId).toBe('D1');
  });

  it('looks up domain standard score for sum in min-max range', () => {
    // From mockD1: sumRange { min: 100, max: 101 } → standardScore { value: 49 }
    const result = lookupDomainComposite(100, ctx);
    expect(result.value).toEqual({ value: 49 });

    const result2 = lookupDomainComposite(101, ctx);
    expect(result2.value).toEqual({ value: 49 });
  });

  it('returns null when sum not found in any range', () => {
    // 50 is below the minimum in mockD1
    const result = lookupDomainComposite(50, ctx);
    expect(result.value).toBeNull();
    expect(result.note).toContain('not found');
  });
});
