// Age calculation tests

import { describe, it, expect } from 'vitest';
import { calcAgeMonths, findAgeBand } from './age';
import type { LookupContext } from '../data/context';
import { createFixtureLookupContext } from '../data/fixtures';

describe('calcAgeMonths', () => {
  it('calculates months for exactly one year', () => {
    const dob = new Date('2020-01-15');
    const testDate = new Date('2021-01-15');
    expect(calcAgeMonths(dob, testDate)).toBe(12);
  });

  it('calculates months for partial year', () => {
    // June 1 to Jan 1 next year = 7 months
    const dob = new Date(2020, 5, 1); // June 1, 2020 (months are 0-indexed)
    const testDate = new Date(2021, 0, 1); // Jan 1, 2021
    expect(calcAgeMonths(dob, testDate)).toBe(7);
  });

  it('calculates months when day of month not reached', () => {
    // June 15 to Jan 1 = only 6 complete months (day 1 < day 15)
    const dob = new Date('2020-06-15');
    const testDate = new Date('2021-01-01');
    expect(calcAgeMonths(dob, testDate)).toBe(6);
  });

  it('calculates months spanning year boundary', () => {
    const dob = new Date('2019-11-15');
    const testDate = new Date('2021-02-15');
    expect(calcAgeMonths(dob, testDate)).toBe(15);
  });

  it('handles same month (partial month not counted)', () => {
    const dob = new Date('2020-01-01');
    const testDate = new Date('2020-01-31');
    expect(calcAgeMonths(dob, testDate)).toBe(0);
  });

  it('handles leap year (Feb 29 to Feb 28 next year is 11 months)', () => {
    // Feb 29 → Feb 28 next year: date-fns considers this 11 months
    // because day 28 < day 29, the final month isn't complete
    const dob = new Date('2020-02-29');
    const testDate = new Date('2021-02-28');
    expect(calcAgeMonths(dob, testDate)).toBe(11);
  });

  it('handles leap year (Feb 29 to Mar 1 next year is 12 months)', () => {
    const dob = new Date('2020-02-29');
    const testDate = new Date('2021-03-01');
    expect(calcAgeMonths(dob, testDate)).toBe(12);
  });

  it('returns 0 if testDate equals dob', () => {
    const date = new Date('2020-01-15');
    expect(calcAgeMonths(date, date)).toBe(0);
  });

  it('returns negative if testDate before dob', () => {
    const dob = new Date('2021-01-15');
    const testDate = new Date('2020-01-15');
    expect(calcAgeMonths(dob, testDate)).toBe(-12);
  });

  it('accepts string dates', () => {
    expect(calcAgeMonths('2020-01-15', '2021-07-15')).toBe(18);
  });
});

describe('findAgeBand', () => {
  let ctx: LookupContext;

  beforeEach(() => {
    ctx = createFixtureLookupContext();
  });

  it('returns B13 for age 12 months', () => {
    const table = findAgeBand(12, ctx);
    expect(table?.tableId).toBe('B13');
  });

  it('returns B13 for age 13 months', () => {
    const table = findAgeBand(13, ctx);
    expect(table?.tableId).toBe('B13');
  });

  it('returns B17 for age 22 months', () => {
    const table = findAgeBand(22, ctx);
    expect(table?.tableId).toBe('B17');
  });

  it('returns B17 for age 24 months', () => {
    const table = findAgeBand(24, ctx);
    expect(table?.tableId).toBe('B17');
  });

  it('returns null for age outside all bands (fixtures only have B13, B17)', () => {
    const table = findAgeBand(36, ctx);
    expect(table).toBe(null);
  });

  it('returns null for age below minimum', () => {
    const table = findAgeBand(10, ctx);
    expect(table).toBe(null);
  });
});
