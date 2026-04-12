import { describe, it, expect } from 'vitest';
import { computeEligibility } from './eligibility';
import { createEmptyRawScores } from './rawScores';
import type { ReverseLookupResults } from '../components/ReverseLookup';

const makeLookup = (targets: Record<string, number | null>): ReverseLookupResults => ({
  standardScore: 77,
  ssSteps: [],
  note: null,
  subtests: Object.entries(targets).map(([subtest, rawScore]) => ({
    subtest: subtest as any,
    rawScore,
    steps: [],
  })),
});

describe('computeEligibility', () => {
  it('returns empty result when lookup is null', () => {
    const result = computeEligibility(createEmptyRawScores(), null);
    expect(result.subtests).toEqual({});
    expect(result.allExceed).toBe(false);
  });

  it('returns empty result when no subtests are administered', () => {
    const lookup = makeLookup({ receptiveLanguage: 12, expressiveLanguage: 10 });
    const result = computeEligibility(createEmptyRawScores(), lookup);
    expect(result.subtests).toEqual({});
    expect(result.allExceed).toBe(false);
  });

  it('marks subtest as exceeding when raw score > target', () => {
    const rawScores = { ...createEmptyRawScores(), receptiveLanguage: 15 };
    const lookup = makeLookup({ receptiveLanguage: 12 });
    const result = computeEligibility(rawScores, lookup);
    expect(result.subtests.receptiveLanguage?.exceedsTarget).toBe(true);
  });

  it('marks subtest as not exceeding when raw score <= target', () => {
    const rawScores = { ...createEmptyRawScores(), receptiveLanguage: 12 };
    const lookup = makeLookup({ receptiveLanguage: 12 });
    const result = computeEligibility(rawScores, lookup);
    expect(result.subtests.receptiveLanguage?.exceedsTarget).toBe(false);
  });

  it('marks subtest as not exceeding when raw score < target', () => {
    const rawScores = { ...createEmptyRawScores(), receptiveLanguage: 8 };
    const lookup = makeLookup({ receptiveLanguage: 12 });
    const result = computeEligibility(rawScores, lookup);
    expect(result.subtests.receptiveLanguage?.exceedsTarget).toBe(false);
  });

  it('allExceed is true when all administered subtests exceed targets', () => {
    const rawScores = {
      ...createEmptyRawScores(),
      receptiveLanguage: 15,
      expressiveLanguage: 13,
    };
    const lookup = makeLookup({ receptiveLanguage: 12, expressiveLanguage: 10 });
    const result = computeEligibility(rawScores, lookup);
    expect(result.subtests.receptiveLanguage?.exceedsTarget).toBe(true);
    expect(result.subtests.expressiveLanguage?.exceedsTarget).toBe(true);
    expect(result.allExceed).toBe(true);
  });

  it('allExceed is false when at least one administered subtest meets target', () => {
    const rawScores = {
      ...createEmptyRawScores(),
      receptiveLanguage: 15,
      expressiveLanguage: 8,
    };
    const lookup = makeLookup({ receptiveLanguage: 12, expressiveLanguage: 10 });
    const result = computeEligibility(rawScores, lookup);
    expect(result.subtests.receptiveLanguage?.exceedsTarget).toBe(true);
    expect(result.subtests.expressiveLanguage?.exceedsTarget).toBe(false);
    expect(result.allExceed).toBe(false);
  });

  it('ignores subtests without a target raw score', () => {
    const rawScores = { ...createEmptyRawScores(), receptiveLanguage: 15 };
    const lookup = makeLookup({ receptiveLanguage: null });
    const result = computeEligibility(rawScores, lookup);
    expect(result.subtests).toEqual({});
    expect(result.allExceed).toBe(false);
  });

  it('only considers administered subtests for allExceed', () => {
    // Only RL administered and it exceeds — but other subtests not administered
    const rawScores = { ...createEmptyRawScores(), receptiveLanguage: 15 };
    const lookup = makeLookup({
      receptiveLanguage: 12,
      expressiveLanguage: 10,
      socialEmotional: 8,
    });
    const result = computeEligibility(rawScores, lookup);
    expect(result.allExceed).toBe(true);
  });
});
