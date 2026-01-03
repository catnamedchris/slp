import { describe, it, expect } from 'vitest';
import {
  DAYC2_MIN_AGE_MONTHS,
  DAYC2_MAX_AGE_MONTHS,
  isDayc2AgeInRange,
} from './constants';

describe('DAYC-2 age constants', () => {
  it('defines minimum age as 12 months', () => {
    expect(DAYC2_MIN_AGE_MONTHS).toBe(12);
  });

  it('defines maximum age as 71 months', () => {
    expect(DAYC2_MAX_AGE_MONTHS).toBe(71);
  });
});

describe('isDayc2AgeInRange', () => {
  it('returns false for null', () => {
    expect(isDayc2AgeInRange(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDayc2AgeInRange(undefined)).toBe(false);
  });

  it('returns false for age below minimum (11 months)', () => {
    expect(isDayc2AgeInRange(11)).toBe(false);
  });

  it('returns true for minimum age (12 months)', () => {
    expect(isDayc2AgeInRange(12)).toBe(true);
  });

  it('returns true for age in middle of range (40 months)', () => {
    expect(isDayc2AgeInRange(40)).toBe(true);
  });

  it('returns true for maximum age (71 months)', () => {
    expect(isDayc2AgeInRange(71)).toBe(true);
  });

  it('returns false for age above maximum (72 months)', () => {
    expect(isDayc2AgeInRange(72)).toBe(false);
  });

  it('returns false for negative age', () => {
    expect(isDayc2AgeInRange(-5)).toBe(false);
  });
});
