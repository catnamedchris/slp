// calculateAllScores orchestrator tests

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateAllScores, type CalculationInput } from './calculate';
import type { LookupContext } from '../data/context';
import { createFixtureLookupContext } from '../data/fixtures';

describe('calculateAllScores', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('calculates all scores for valid input', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10,
        expressiveLanguage: 10,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // Check cognitive results
    expect(result.subtests.cognitive.standardScore.value).toEqual({ value: 60 });
    expect(result.subtests.cognitive.standardScore.steps).toHaveLength(1);
    expect(result.subtests.cognitive.standardScore.steps[0].tableId).toBe('B13');
  });

  it('calculates percentile from standard score', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 20, // SS 100 in mockB13
        receptiveLanguage: 20,
        expressiveLanguage: 20,
        socialEmotional: 20,
        grossMotor: 20,
        fineMotor: 20,
        adaptiveBehavior: 20,
      },
    };

    const result = calculateAllScores(input, ctx);

    // cognitive raw 20 → SS 100 → percentile 50
    expect(result.subtests.cognitive.standardScore.value).toEqual({ value: 100 });
    expect(result.subtests.cognitive.percentile.value).toEqual({ value: 50 });
    // Percentile steps include both the B table lookup and C1 lookup (chained provenance)
    expect(result.subtests.cognitive.percentile.steps).toHaveLength(2);
    expect(result.subtests.cognitive.percentile.steps[0].tableId).toBe('B13');
    expect(result.subtests.cognitive.percentile.steps[1].tableId).toBe('C1');
  });

  it('calculates age equivalent', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 24, // matches ageMonths 12 in mockA1
        receptiveLanguage: 13,
        expressiveLanguage: 12,
        socialEmotional: 22,
        grossMotor: 28,
        fineMotor: 21,
        adaptiveBehavior: 18,
      },
    };

    const result = calculateAllScores(input, ctx);

    // cognitive raw 24 → age equiv 12 months
    expect(result.subtests.cognitive.ageEquivalent.value).toEqual({ value: 12 });
  });

  it('calculates domain composites', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10, // SS 90
        expressiveLanguage: 10, // SS 95
        socialEmotional: 10,
        grossMotor: 10, // SS 55
        fineMotor: 10, // SS 85
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // Communication = RL SS + EL SS = 90 + 95 = 185
    // Sum 185 is NOT in mockD1 (falls between 167 and 186), so lookup fails
    expect(result.domains.communication.sum).toEqual({ type: 'exact', value: 185 });
    expect(result.domains.communication.standardScore.value).toBeNull();

    // Physical = GM SS + FM SS = 55 + 85 = 140
    // From mockD1: sum 140 → SS 70
    expect(result.domains.physical.sum).toEqual({ type: 'exact', value: 140 });
    expect(result.domains.physical.standardScore.value).toEqual({ value: 70 });
  });

  it('calculates physical domain with provenance chain', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10,
        expressiveLanguage: 10,
        socialEmotional: 10,
        grossMotor: 10, // SS 55
        fineMotor: 10, // SS 85
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // Physical domain composite works
    expect(result.domains.physical.sum).toEqual({ type: 'exact', value: 140 });
    expect(result.domains.physical.standardScore.value).toEqual({ value: 70 });
    // SS 70 is NOT in mockC1 (it has 69, 79, 80, etc.), so percentile lookup fails
    expect(result.domains.physical.percentile.value).toBeNull();

    // Verify provenance chain includes all steps
    expect(result.domains.physical.standardScore.steps.length).toBeGreaterThan(1);
  });

  it('handles missing standard scores gracefully', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 30, // SS 130 in mockB13
        receptiveLanguage: 30, // SS >150 (bounded)
        expressiveLanguage: 30,
        socialEmotional: 30,
        grossMotor: 30,
        fineMotor: 30, // null in mockB13
        adaptiveBehavior: 30,
      },
    };

    const result = calculateAllScores(input, ctx);

    // fineMotor at rawScore 30 is null, but rawScore 20 has 110
    expect(result.subtests.fineMotor.standardScore.value).toEqual({ value: 110 });

    // receptiveLanguage is bounded (>150), percentile lookup should fail
    expect(result.subtests.receptiveLanguage.standardScore.value).toEqual({ bound: 'gt', value: 150 });
    expect(result.subtests.receptiveLanguage.percentile.value).toBeNull();
  });

  it('handles age with no B table', () => {
    const input: CalculationInput = {
      ageMonths: 36, // No B table in fixtures
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10,
        expressiveLanguage: 10,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    expect(result.subtests.cognitive.standardScore.value).toBeNull();
    expect(result.subtests.cognitive.standardScore.note).toContain('No table');
  });

  it('computes bounded sum when one subtest is at ceiling', () => {
    // RL raw 30 → SS >150, EL raw 10 → SS 95
    // Sum should be >(150+95) = >245
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 30, // SS >150
        expressiveLanguage: 10, // SS 95
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    expect(result.domains.communication.sum).toEqual({ type: 'gt', value: 245 });
    // Sum 246 isn't in mockD1 ranges, so standardScore lookup returns null
    expect(result.domains.communication.standardScore.value).toBeNull();
  });

  it('computes bounded sum when one subtest is at floor', () => {
    // RL raw 0 → SS <50, EL raw 10 → SS 95
    // Sum should be <(50+95) = <145
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 0, // SS <50
        receptiveLanguage: 0, // SS <50
        expressiveLanguage: 10, // SS 95
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // RL <50 + EL 95 = <145
    expect(result.domains.communication.sum).toEqual({ type: 'lt', value: 145 });
  });

  it('computes bounded sum when one subtest is floor and one is ceiling', () => {
    // RL raw 0 → SS <50, EL raw 30 → SS >150
    // One < and one >: we can only say sum > 150 (the gt bound value)
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 0, // SS <50
        expressiveLanguage: 30, // SS >150 (from mockB13)
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // With one < and one >, we can only express sum > (the gt value)
    expect(result.domains.communication.sum).toEqual({ type: 'gt', value: 150 });
  });

  it('computes bounded sum when both subtests are at floor (lt/lt)', () => {
    // RL raw 0 → SS <50, EL raw 0 → SS <50
    // Sum should be <(50+50) = <100
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 0, // SS <50
        expressiveLanguage: 0, // SS <50
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    expect(result.domains.communication.sum).toEqual({ type: 'lt', value: 100 });
    // Sum <100 matches mockD1 row with sumRange1 { bound: 'lt', value: 100 } → SS 40
    expect(result.domains.communication.standardScore.value).toEqual({ bound: 'lt', value: 41 });
  });

  it('computes bounded sum when both subtests are at ceiling (gt/gt)', () => {
    // RL raw 30 → SS >150, EL raw 30 → SS >150
    // Sum should be >(150+150) = >300
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 30, // SS >150
        expressiveLanguage: 30, // SS >150
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    expect(result.domains.communication.sum).toEqual({ type: 'gt', value: 300 });
    // Sum >300 matches mockD1 row with sumRange1 { bound: 'gt', value: 300 } → SS 160
    expect(result.domains.communication.standardScore.value).toEqual({ bound: 'gt', value: 159 });
  });

  it('returns null domain composite when one subtest raw score is null', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10,
        expressiveLanguage: null, // missing
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // EL is null → subtest result is empty
    expect(result.subtests.expressiveLanguage.rawScore).toBeNull();
    expect(result.subtests.expressiveLanguage.standardScore.value).toBeNull();

    // Communication domain has no valid sum
    expect(result.domains.communication.sum).toBeNull();
    expect(result.domains.communication.standardScore.value).toBeNull();
    expect(result.domains.communication.percentile.value).toBeNull();
  });

  it('returns null domain composite when both subtest raw scores are null', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: null,
        expressiveLanguage: null,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    expect(result.domains.communication.sum).toBeNull();
    expect(result.domains.communication.standardScore.value).toBeNull();
  });
});
