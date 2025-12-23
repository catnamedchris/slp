// Age calculation utilities using date-fns

import { differenceInMonths } from 'date-fns';
import type { RawToStandardTableJson } from '../types';
import type { LookupContext } from '../data/context';

/**
 * Calculates age in months between date of birth and test date.
 * Uses date-fns for accurate handling of month boundaries and leap years.
 *
 * @param dob - Date of birth (Date object or ISO string)
 * @param testDate - Test date (Date object or ISO string)
 * @returns Age in complete months (negative if testDate before dob)
 */
export const calcAgeMonths = (
  dob: Date | string,
  testDate: Date | string
): number => {
  const dobDate = typeof dob === 'string' ? new Date(dob) : dob;
  const testDateObj = typeof testDate === 'string' ? new Date(testDate) : testDate;
  return differenceInMonths(testDateObj, dobDate);
};

/**
 * Finds the appropriate B table for a given age in months.
 * Delegates to the LookupContext's getBTableForAge function.
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
