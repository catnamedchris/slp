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

    // Check receptiveLanguage results (raw 10 → SS 90 in mockB13)
    expect(result.subtests.receptiveLanguage.standardScore.value).toEqual({ value: 90 });
    expect(result.subtests.receptiveLanguage.standardScore.steps).toHaveLength(1);
    expect(result.subtests.receptiveLanguage.standardScore.steps[0].tableId).toBe('B13');
  });

  it('calculates percentile from standard score', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 20,
        receptiveLanguage: 20,
        expressiveLanguage: 20,
        socialEmotional: 20,
        grossMotor: 20,
        fineMotor: 20,
        adaptiveBehavior: 20,
      },
    };

    const result = calculateAllScores(input, ctx);

    // receptiveLanguage raw 20 → SS 120 → percentile 91
    expect(result.subtests.receptiveLanguage.standardScore.value).toEqual({ value: 120 });
    expect(result.subtests.receptiveLanguage.percentile.value).toEqual({ value: 91 });
    // Percentile steps include both the B table lookup and C1 lookup (chained provenance)
    expect(result.subtests.receptiveLanguage.percentile.steps).toHaveLength(2);
    expect(result.subtests.receptiveLanguage.percentile.steps[0].tableId).toBe('B13');
    expect(result.subtests.receptiveLanguage.percentile.steps[1].tableId).toBe('C1');
  });

  it('calculates age equivalent', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 24,
        receptiveLanguage: 13, // matches ageMonths 12 in mockA1
        expressiveLanguage: 12,
        socialEmotional: 22,
        grossMotor: 28,
        fineMotor: 21,
        adaptiveBehavior: 18,
      },
    };

    const result = calculateAllScores(input, ctx);

    // receptiveLanguage raw 13 → age equiv 12 months
    expect(result.subtests.receptiveLanguage.ageEquivalent.value).toEqual({ value: 12 });
  });

  it('calculates domain composites', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10, // SS 90
        expressiveLanguage: 10, // SS 95
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // Communication = RL SS + EL SS = 90 + 95 = 185
    // Sum 185 is NOT in mockD1 (falls between 167 and 186), so lookup fails
    expect(result.domains.communication.sum).toEqual({ type: 'exact', value: 185 });
    expect(result.domains.communication.standardScore.value).toBeNull();
  });

  it('handles missing standard scores gracefully', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 30,
        receptiveLanguage: 30, // SS >150 (bounded)
        expressiveLanguage: 30,
        socialEmotional: 30,
        grossMotor: 30,
        fineMotor: 30,
        adaptiveBehavior: 30,
      },
    };

    const result = calculateAllScores(input, ctx);

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

    expect(result.subtests.receptiveLanguage.standardScore.value).toBeNull();
    expect(result.subtests.receptiveLanguage.standardScore.note).toContain('No B table available');
    expect(result.subtests.receptiveLanguage.standardScore.steps).toHaveLength(0);
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

    // EL is null → subtest result is empty with note
    expect(result.subtests.expressiveLanguage.rawScore).toBeNull();
    expect(result.subtests.expressiveLanguage.standardScore.value).toBeNull();
    expect(result.subtests.expressiveLanguage.standardScore.note).toBe('No raw score entered');
    expect(result.subtests.expressiveLanguage.standardScore.steps).toHaveLength(0);

    // Communication domain has no valid sum
    expect(result.domains.communication.sum).toBeNull();
    expect(result.domains.communication.standardScore.value).toBeNull();
    expect(result.domains.communication.percentile.value).toBeNull();
    expect(result.domains.communication.standardScore.note).toBe(
      'Communication composite requires both RL and EL standard scores'
    );
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
    expect(result.domains.communication.standardScore.note).toBe(
      'Communication composite requires both RL and EL standard scores'
    );
  });

  it('derives bounded composite percentile for lt sum', () => {
    // RL raw 0 → SS <50, EL raw 0 → SS <50
    // Sum <100 → D1 lookup at 99 → SS 40 → bounded as <41
    // Percentile: lookup SS 40 in C1 → <1, apply lt bound → <1
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 0,
        expressiveLanguage: 0,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    expect(result.domains.communication.standardScore.value).toEqual({ bound: 'lt', value: 41 });
    // mockC1 has SS 40 → percentile <1, with lt bound applied stays <1
    expect(result.domains.communication.percentile.value).toEqual({ bound: 'lt', value: 1 });
  });

  it('derives bounded composite percentile for gt sum', () => {
    // RL raw 30 → SS >150, EL raw 30 → SS >150
    // Sum >300 → D1 lookup at 301 → SS 160 → bounded as >159
    // Percentile: lookup SS 160 in C1 → >99.9, apply gt bound → >99.9
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 30,
        expressiveLanguage: 30,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    expect(result.domains.communication.standardScore.value).toEqual({ bound: 'gt', value: 159 });
    // mockC1 has SS 160 → >99.9, with gt bound applied stays >99.9
    expect(result.domains.communication.percentile.value).toEqual({ bound: 'gt', value: 99.9 });
  });

  it('includes bound transformation step in composite provenance', () => {
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 0,
        expressiveLanguage: 0,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);

    // Standard score provenance should include the bound transformation step
    const ssSteps = result.domains.communication.standardScore.steps;
    const transformStep = ssSteps.find((s) => s.description?.includes('reported as'));
    expect(transformStep).toBeDefined();
    expect(transformStep!.description).toContain('bounded');
  });
});

describe('computeSumValue coverage', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('computes exact + lt sum', () => {
    // RL raw 10 → SS 90 (exact), EL raw 0 → SS <50 (lt)
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10,
        expressiveLanguage: 0,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);
    expect(result.domains.communication.sum).toEqual({ type: 'lt', value: 140 });
  });

  it('computes exact + gt sum', () => {
    // RL raw 10 → SS 90 (exact), EL raw 30 → SS >150 (gt)
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 10,
        expressiveLanguage: 30,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);
    expect(result.domains.communication.sum).toEqual({ type: 'gt', value: 240 });
  });

  it('computes gt + lt sum (uses gt value only)', () => {
    // RL raw 30 → SS >150 (gt), EL raw 0 → SS <50 (lt)
    const input: CalculationInput = {
      ageMonths: 12,
      rawScores: {
        cognitive: 10,
        receptiveLanguage: 30,
        expressiveLanguage: 0,
        socialEmotional: 10,
        grossMotor: 10,
        fineMotor: 10,
        adaptiveBehavior: 10,
      },
    };

    const result = calculateAllScores(input, ctx);
    expect(result.domains.communication.sum).toEqual({ type: 'gt', value: 150 });
  });
});
