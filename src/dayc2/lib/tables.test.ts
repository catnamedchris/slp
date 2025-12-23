// Type guards and utilities for ParsedNumeric values

import { describe, it, expect } from 'vitest';
import {
  isExact,
  isBounded,
  isRange,
  getNumericValue,
  formatValue,
} from './tables';
import type { ExactNumber, BoundedNumber, NumberRange } from '../types';

describe('Type Guards', () => {
  const exact: ExactNumber = { value: 50 };
  const boundedLt: BoundedNumber = { bound: 'lt', value: 50 };
  const boundedGt: BoundedNumber = { bound: 'gt', value: 150 };
  const range: NumberRange = { min: 10, max: 20 };

  describe('isExact', () => {
    it('returns true for ExactNumber', () => {
      expect(isExact(exact)).toBe(true);
    });

    it('returns false for BoundedNumber', () => {
      expect(isExact(boundedLt)).toBe(false);
      expect(isExact(boundedGt)).toBe(false);
    });

    it('returns false for NumberRange', () => {
      expect(isExact(range)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isExact(null)).toBe(false);
    });
  });

  describe('isBounded', () => {
    it('returns true for BoundedNumber', () => {
      expect(isBounded(boundedLt)).toBe(true);
      expect(isBounded(boundedGt)).toBe(true);
    });

    it('returns false for ExactNumber', () => {
      expect(isBounded(exact)).toBe(false);
    });

    it('returns false for NumberRange', () => {
      expect(isBounded(range)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isBounded(null)).toBe(false);
    });
  });

  describe('isRange', () => {
    it('returns true for NumberRange', () => {
      expect(isRange(range)).toBe(true);
    });

    it('returns false for ExactNumber', () => {
      expect(isRange(exact)).toBe(false);
    });

    it('returns false for BoundedNumber', () => {
      expect(isRange(boundedLt)).toBe(false);
      expect(isRange(boundedGt)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isRange(null)).toBe(false);
    });
  });
});

describe('getNumericValue', () => {
  it('returns value for ExactNumber', () => {
    expect(getNumericValue({ value: 100 })).toBe(100);
  });

  it('returns value for BoundedNumber (lt)', () => {
    expect(getNumericValue({ bound: 'lt', value: 50 })).toBe(50);
  });

  it('returns value for BoundedNumber (gt)', () => {
    expect(getNumericValue({ bound: 'gt', value: 150 })).toBe(150);
  });

  it('returns min for NumberRange', () => {
    expect(getNumericValue({ min: 10, max: 20 })).toBe(10);
  });

  it('returns null for null input', () => {
    expect(getNumericValue(null)).toBe(null);
  });
});

describe('formatValue', () => {
  it('formats ExactNumber as plain number', () => {
    expect(formatValue({ value: 100 })).toBe('100');
  });

  it('formats BoundedNumber lt with < prefix', () => {
    expect(formatValue({ bound: 'lt', value: 50 })).toBe('<50');
  });

  it('formats BoundedNumber gt with > prefix', () => {
    expect(formatValue({ bound: 'gt', value: 150 })).toBe('>150');
  });

  it('formats NumberRange as min-max', () => {
    expect(formatValue({ min: 10, max: 20 })).toBe('10-20');
  });

  it('returns empty string for null', () => {
    expect(formatValue(null)).toBe('');
  });

  it('handles decimal values', () => {
    expect(formatValue({ value: 99.9 })).toBe('99.9');
    expect(formatValue({ bound: 'gt', value: 99.9 })).toBe('>99.9');
  });
});
