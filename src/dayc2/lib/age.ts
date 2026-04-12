// Age calculation utilities using plain-date parsing

import type { RawToStandardTableJson } from '../types';
import type { LookupContext } from '../data/context';
import { createLookupContext } from '../data/context';
import { DAYC2_MIN_AGE_MONTHS, DAYC2_MAX_AGE_MONTHS } from '../constants';
import { parseIsoDateOnly, calcCompletedMonths } from '@/shared/lib/dates';

/**
 * Calculates age in completed months between date of birth and test date.
 * Accepts Date objects or ISO date strings (YYYY-MM-DD).
 * Uses plain-date parsing to avoid timezone ambiguity.
 */
export const calcAgeMonths = (
  dob: Date | string,
  testDate: Date | string
): number => {
  const dobParts = typeof dob === 'string'
    ? parseIsoDateOnly(dob)
    : { year: dob.getFullYear(), month: dob.getMonth() + 1, day: dob.getDate() };
  const testParts = typeof testDate === 'string'
    ? parseIsoDateOnly(testDate)
    : { year: testDate.getFullYear(), month: testDate.getMonth() + 1, day: testDate.getDate() };

  if (!dobParts || !testParts) return NaN;

  return calcCompletedMonths(dobParts, testParts);
};

/**
 * Finds the appropriate B table for a given age in months.
 *
 * This wrapper exists to provide a consistent function signature for age band
 * lookups, abstracting away the LookupContext method call. It's used by
 * ChildInfoForm to display age band information and validate age ranges.
 *
 * @param ageMonths - Age in months
 * @param ctx - LookupContext containing table data
 * @returns The B table for the age band, or null if age is out of range
 */
export const findAgeBand = (
  ageMonths: number,
  ctx: LookupContext
): RawToStandardTableJson | null => {
  return ctx.getBTableForAge(ageMonths);
};

/**
 * Validates that an age in months falls within DAYC-2 bounds.
 * Returns an error message string if invalid, or null if valid.
 * Does NOT check for negative ages (that's a date-ordering concern, not a bounds concern).
 */
export const validateAgeBounds = (ageMonths: number): string | null => {
  if (ageMonths < DAYC2_MIN_AGE_MONTHS) {
    return `Age ${ageMonths} months is below DAYC-2 minimum (${DAYC2_MIN_AGE_MONTHS} months)`;
  }
  if (ageMonths > DAYC2_MAX_AGE_MONTHS) {
    return `Age ${ageMonths} months is above DAYC-2 maximum (${DAYC2_MAX_AGE_MONTHS} months)`;
  }
  return null;
};

export interface AgeInfo {
  ageMonths: number;
  ageBandLabel: string | null;
  error: string | null;
}

export const calculateAgeInfo = (dob: string, testDate: string): AgeInfo | null => {
  if (!dob || !testDate) return null;

  const dobParsed = parseIsoDateOnly(dob);
  const testParsed = parseIsoDateOnly(testDate);

  if (!dobParsed || !testParsed) {
    return { ageMonths: NaN, ageBandLabel: null, error: 'Invalid date format' };
  }

  const ageMonths = calcCompletedMonths(dobParsed, testParsed);
  const ctx = createLookupContext();
  const bTable = findAgeBand(ageMonths, ctx);

  let error: string | null = null;
  if (ageMonths < 0) {
    error = 'Test date cannot be before date of birth';
  } else {
    error = validateAgeBounds(ageMonths);
    if (!error && !bTable) {
      error = `No normative table available for age ${ageMonths} months`;
    }
  }

  return {
    ageMonths,
    ageBandLabel: bTable?.source.ageBand.label?.toLowerCase() ?? null,
    error,
  };
};
