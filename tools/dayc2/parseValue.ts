import { ParsedNumeric, ParsedAgeMonths, ParsedPercentile, BoundedNumber, ExactNumber, NumberRange } from '../../src/dayc2/types';

const RANGE_PATTERN = /^(\d+)-(\d+)$/;
const BOUNDED_PATTERN = /^([<>])(\d+(?:\.\d+)?)$/;
const NUMBER_PATTERN = /^(\d+(?:\.\d+)?)$/;

export const parseValue = (raw: string): ParsedNumeric | null => {
  const trimmed = raw.trim();

  if (trimmed === '' || trimmed === '-') {
    return null;
  }

  const boundedMatch = trimmed.match(BOUNDED_PATTERN);
  if (boundedMatch) {
    const bound: 'lt' | 'gt' = boundedMatch[1] === '<' ? 'lt' : 'gt';
    const value = parseFloat(boundedMatch[2]);
    return { bound, value } as BoundedNumber;
  }

  const rangeMatch = trimmed.match(RANGE_PATTERN);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return { min, max } as NumberRange;
  }

  const numberMatch = trimmed.match(NUMBER_PATTERN);
  if (numberMatch) {
    const value = parseFloat(numberMatch[1]);
    return { value } as ExactNumber;
  }

  throw new Error(`Cannot parse value: "${raw}"`);
};

export const parseAgeMonths = (raw: string): ParsedAgeMonths => {
  const result = parseValue(raw);
  if (result === null) {
    throw new Error(`age_months cannot be null: "${raw}"`);
  }
  if ('min' in result) {
    throw new Error(`age_months cannot be a range: "${raw}"`);
  }
  return result;
};

export const parsePercentile = (raw: string): ParsedPercentile | null => {
  const result = parseValue(raw);
  if (result === null) {
    return null;
  }
  if ('min' in result) {
    throw new Error(`percentile cannot be a range: "${raw}"`);
  }
  return result;
};
