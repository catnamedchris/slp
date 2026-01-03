import { describe, it, expect } from 'vitest';
import {
  formatScoreValue,
  formatPercentileValue,
  formatAgeMonthsValue,
  SUBTEST_LABELS,
  AGE_EQUIV_LABELS,
} from './labels';
import { SUBTESTS } from './metadata';
import type { SubtestKey, AgeEquivalentKey } from '../types';

describe('formatScoreValue', () => {
  it('returns dash for null', () => {
    expect(formatScoreValue(null)).toBe('—');
  });

  it('formats exact value', () => {
    expect(formatScoreValue({ value: 100 })).toBe('100');
  });

  it('formats less-than bound', () => {
    expect(formatScoreValue({ bound: 'lt', value: 50 })).toBe('<50');
  });

  it('formats greater-than bound', () => {
    expect(formatScoreValue({ bound: 'gt', value: 150 })).toBe('>150');
  });

  it('formats range', () => {
    expect(formatScoreValue({ min: 10, max: 20 })).toBe('10-20');
  });
});

describe('formatPercentileValue', () => {
  it('returns dash for null', () => {
    expect(formatPercentileValue(null)).toBe('—');
  });

  it('formats exact value', () => {
    expect(formatPercentileValue({ value: 50 })).toBe('50');
  });

  it('formats range', () => {
    expect(formatPercentileValue({ min: 25, max: 75 })).toBe('25-75');
  });
});

describe('formatAgeMonthsValue', () => {
  it('returns dash for null', () => {
    expect(formatAgeMonthsValue(null)).toBe('—');
  });

  it('formats exact value with months suffix', () => {
    expect(formatAgeMonthsValue({ value: 24 })).toBe('24 months');
  });

  it('formats less-than bound with months suffix', () => {
    expect(formatAgeMonthsValue({ bound: 'lt', value: 12 })).toBe('<12 months');
  });

  it('formats greater-than bound with months suffix', () => {
    expect(formatAgeMonthsValue({ bound: 'gt', value: 71 })).toBe('>71 months');
  });
});

describe('SUBTEST_LABELS completeness', () => {
  it('has a label for every subtest key', () => {
    const subtestKeys: SubtestKey[] = SUBTESTS;
    for (const key of subtestKeys) {
      expect(SUBTEST_LABELS[key]).toBeDefined();
      expect(typeof SUBTEST_LABELS[key]).toBe('string');
      expect(SUBTEST_LABELS[key].length).toBeGreaterThan(0);
    }
  });

  it('contains expected subtest labels', () => {
    expect(SUBTEST_LABELS.cognitive).toBe('Cognitive');
    expect(SUBTEST_LABELS.receptiveLanguage).toBe('Receptive Language');
    expect(SUBTEST_LABELS.expressiveLanguage).toBe('Expressive Language');
    expect(SUBTEST_LABELS.socialEmotional).toBe('Social-Emotional');
    expect(SUBTEST_LABELS.grossMotor).toBe('Gross Motor');
    expect(SUBTEST_LABELS.fineMotor).toBe('Fine Motor');
    expect(SUBTEST_LABELS.adaptiveBehavior).toBe('Adaptive Behavior');
  });
});

describe('AGE_EQUIV_LABELS completeness', () => {
  const ageEquivKeys: AgeEquivalentKey[] = [
    'cognitive',
    'receptiveLanguage',
    'expressiveLanguage',
    'communication',
    'socialEmotional',
    'physicalDevelopment',
    'grossMotor',
    'fineMotor',
    'adaptiveBehavior',
  ];

  it('has a label for every age equivalent key', () => {
    for (const key of ageEquivKeys) {
      expect(AGE_EQUIV_LABELS[key]).toBeDefined();
      expect(typeof AGE_EQUIV_LABELS[key]).toBe('string');
      expect(AGE_EQUIV_LABELS[key].length).toBeGreaterThan(0);
    }
  });

  it('contains expected age equivalent labels', () => {
    expect(AGE_EQUIV_LABELS.communication).toBe('Communication');
    expect(AGE_EQUIV_LABELS.physicalDevelopment).toBe('Physical Development');
  });
});
