// Plain-date utilities tests

import { describe, it, expect } from 'vitest';
import { parseIsoDateOnly, calcCompletedMonths } from './dates';

describe('parseIsoDateOnly', () => {
  it('parses valid date', () => {
    expect(parseIsoDateOnly('2020-06-15')).toEqual({ year: 2020, month: 6, day: 15 });
  });

  it('parses leap day', () => {
    expect(parseIsoDateOnly('2020-02-29')).toEqual({ year: 2020, month: 2, day: 29 });
  });

  it('rejects invalid leap day', () => {
    expect(parseIsoDateOnly('2021-02-29')).toBeNull();
  });

  it('rejects invalid day', () => {
    expect(parseIsoDateOnly('2020-04-31')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(parseIsoDateOnly('')).toBeNull();
  });

  it('rejects malformed string', () => {
    expect(parseIsoDateOnly('not-a-date')).toBeNull();
  });

  it('rejects partial date', () => {
    expect(parseIsoDateOnly('2020-06')).toBeNull();
  });

  it('rejects date with extra characters', () => {
    expect(parseIsoDateOnly('2020-06-15T00:00:00')).toBeNull();
  });
});

describe('calcCompletedMonths', () => {
  it('calculates exactly one year', () => {
    const dob = { year: 2020, month: 1, day: 15 };
    const test = { year: 2021, month: 1, day: 15 };
    expect(calcCompletedMonths(dob, test)).toBe(12);
  });

  it('calculates partial year', () => {
    const dob = { year: 2020, month: 6, day: 1 };
    const test = { year: 2021, month: 1, day: 1 };
    expect(calcCompletedMonths(dob, test)).toBe(7);
  });

  it('subtracts a month when day not reached', () => {
    const dob = { year: 2020, month: 6, day: 15 };
    const test = { year: 2021, month: 1, day: 1 };
    expect(calcCompletedMonths(dob, test)).toBe(6);
  });

  it('handles same month', () => {
    const dob = { year: 2020, month: 1, day: 1 };
    const test = { year: 2020, month: 1, day: 31 };
    expect(calcCompletedMonths(dob, test)).toBe(0);
  });

  it('handles leap year (Feb 29 to Feb 28 next year is 11 months)', () => {
    const dob = { year: 2020, month: 2, day: 29 };
    const test = { year: 2021, month: 2, day: 28 };
    expect(calcCompletedMonths(dob, test)).toBe(11);
  });

  it('handles leap year (Feb 29 to Mar 1 next year is 12 months)', () => {
    const dob = { year: 2020, month: 2, day: 29 };
    const test = { year: 2021, month: 3, day: 1 };
    expect(calcCompletedMonths(dob, test)).toBe(12);
  });

  it('returns 0 for same date', () => {
    const d = { year: 2020, month: 1, day: 15 };
    expect(calcCompletedMonths(d, d)).toBe(0);
  });

  it('returns negative if test before dob', () => {
    const dob = { year: 2021, month: 1, day: 15 };
    const test = { year: 2020, month: 1, day: 15 };
    expect(calcCompletedMonths(dob, test)).toBe(-12);
  });

  it('spans year boundary', () => {
    const dob = { year: 2019, month: 11, day: 15 };
    const test = { year: 2021, month: 2, day: 15 };
    expect(calcCompletedMonths(dob, test)).toBe(15);
  });
});
