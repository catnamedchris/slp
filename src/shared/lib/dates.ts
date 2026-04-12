// Plain-date utilities for timezone-safe date handling

export interface PlainDate {
  year: number;
  month: number; // 1-12
  day: number;
}

/**
 * Parses a YYYY-MM-DD string into a PlainDate without timezone ambiguity.
 * Returns null if the string is invalid or represents an impossible date.
 */
export const parseIsoDateOnly = (value: string): PlainDate | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  // Validate the date is real (e.g., not Feb 30)
  const check = new Date(year, month - 1, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month - 1 ||
    check.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

/**
 * Returns today's date as a YYYY-MM-DD string in the local timezone.
 */
export const todayIso = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Calculates completed calendar months between two PlainDates.
 * Returns negative if test date is before dob.
 */
export const calcCompletedMonths = (dob: PlainDate, testDate: PlainDate): number => {
  let months = (testDate.year - dob.year) * 12 + (testDate.month - dob.month);
  if (testDate.day < dob.day) months -= 1;
  return months;
};
