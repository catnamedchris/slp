// DAYC-2 age range constants and utilities

export const DAYC2_MIN_AGE_MONTHS = 12;
export const DAYC2_MAX_AGE_MONTHS = 71;

/**
 * Check if an age in months is within the valid DAYC-2 range (12-71 months inclusive).
 * Returns false for null/undefined values.
 */
export const isDayc2AgeInRange = (ageMonths: number | null | undefined): boolean => {
  if (ageMonths === null || ageMonths === undefined) {
    return false;
  }
  return ageMonths >= DAYC2_MIN_AGE_MONTHS && ageMonths <= DAYC2_MAX_AGE_MONTHS;
};
