// Type guards and utilities for ParsedNumeric values

import type {
  ParsedNumeric,
  ExactNumber,
  BoundedNumber,
  NumberRange,
} from '../types';

/**
 * Type guard: checks if value is an exact number (has only 'value' property)
 */
export const isExact = (v: ParsedNumeric | null): v is ExactNumber => {
  return v !== null && 'value' in v && !('bound' in v) && !('min' in v);
};

/**
 * Type guard: checks if value is bounded (has 'bound' and 'value' properties)
 */
export const isBounded = (v: ParsedNumeric | null): v is BoundedNumber => {
  return v !== null && 'bound' in v && 'value' in v;
};

/**
 * Type guard: checks if value is a range (has 'min' and 'max' properties)
 */
export const isRange = (v: ParsedNumeric | null): v is NumberRange => {
  return v !== null && 'min' in v && 'max' in v;
};

/**
 * Extracts a numeric value from any ParsedNumeric type.
 * - ExactNumber: returns value
 * - BoundedNumber: returns value (the bound)
 * - NumberRange: returns min (conservative/lower bound)
 * - null: returns null
 */
export const getNumericValue = (v: ParsedNumeric | null): number | null => {
  if (v === null) return null;
  if (isRange(v)) return v.min;
  return v.value;
};

/**
 * Formats a ParsedNumeric for display.
 * - ExactNumber: "100"
 * - BoundedNumber lt: "<50"
 * - BoundedNumber gt: ">150"
 * - NumberRange: "10-20"
 * - null: ""
 */
export const formatValue = (v: ParsedNumeric | null): string => {
  if (v === null) return '';
  if (isRange(v)) return `${v.min}-${v.max}`;
  if (isBounded(v)) return v.bound === 'lt' ? `<${v.value}` : `>${v.value}`;
  return String(v.value);
};
