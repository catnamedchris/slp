// Skills input parsing, validation, and copy formatting
// Skill descriptions will be added later — for now, items are displayed as numbers

import type { ActiveSubtestKey } from './metadata';
import { SUBTEST_MAX_ITEM } from './metadata';

/** Skill items for a single subtest (stored as sorted number arrays) */
export interface SkillItemsInput {
  able: number[];
  unable: number[];
}

/** All subtests' skill items */
export type AllSkillItems = Record<ActiveSubtestKey, SkillItemsInput>;

/** Validation result for a single subtest's skill items */
export interface SkillValidation {
  ableItems: number[];
  unableItems: number[];
  conflicts: number[];
  duplicates: number[];
  duplicatesAble: number[];
  duplicatesUnable: number[];
  outOfRange: number[];
  outOfRangeAble: number[];
  outOfRangeUnable: number[];
  hasConflicts: boolean;
  hasDuplicates: boolean;
  hasOutOfRange: boolean;
  canCopyAble: boolean;
  canCopyUnable: boolean;
}

/** Create empty skill items for all subtests */
export const createEmptySkillItems = (): AllSkillItems => ({
  receptiveLanguage: { able: [], unable: [] },
  expressiveLanguage: { able: [], unable: [] },
  socialEmotional: { able: [], unable: [] },
});

/** Only bare digit sequences are valid item numbers */
const INTEGER_TOKEN = /^\d+$/;

/**
 * Parse a flexible input string into sorted unique positive integers.
 * Accepts commas, spaces, semicolons as separators.
 * Only accepts bare digit tokens (rejects hex, scientific notation, decimals).
 */
export const parseItemInput = (input: string): number[] => {
  if (!input.trim()) return [];

  const tokens = input.split(/[,;\s]+/).filter(Boolean);
  const numbers: Set<number> = new Set();

  for (const token of tokens) {
    if (!INTEGER_TOKEN.test(token)) continue;
    const parsed = Number.parseInt(token, 10);
    if (parsed >= 1) {
      numbers.add(parsed);
    }
  }

  return [...numbers].sort((a, b) => a - b);
};

/** Format a list of item numbers for clipboard copy */
export const formatSkillCopyText = (items: number[]): string =>
  items.join(', ');

/**
 * Add items to a sorted number array, returning a new sorted array.
 * Duplicates are preserved so validation can flag them.
 */
export const addItems = (existing: number[], toAdd: number[]): number[] =>
  [...existing, ...toAdd].sort((a, b) => a - b);

/**
 * Remove the first occurrence of an item from a number array.
 */
export const removeItem = (existing: number[], item: number): number[] => {
  const idx = existing.indexOf(item);
  if (idx === -1) return existing;
  return [...existing.slice(0, idx), ...existing.slice(idx + 1)];
};

/** Find values that appear more than once in a list */
const findDuplicates = (items: number[]): number[] => {
  const seen = new Set<number>();
  const dupes = new Set<number>();
  for (const item of items) {
    if (seen.has(item)) dupes.add(item);
    seen.add(item);
  }
  return [...dupes].sort((a, b) => a - b);
};

/**
 * Validate a subtest's skill items: detect conflicts, duplicates, and out-of-range items.
 */
export const validateSkillItems = (
  input: SkillItemsInput,
  subtest: ActiveSubtestKey,
): SkillValidation => {
  const { able: ableItems, unable: unableItems } = input;

  const ableSet = new Set(ableItems);
  const conflicts = [...new Set(unableItems.filter((item) => ableSet.has(item)))];
  const hasConflicts = conflicts.length > 0;

  const duplicatesAble = findDuplicates(ableItems);
  const duplicatesUnable = findDuplicates(unableItems);
  const duplicates = [...new Set([...duplicatesAble, ...duplicatesUnable])].sort((a, b) => a - b);
  const hasDuplicates = duplicates.length > 0;

  const maxItem = SUBTEST_MAX_ITEM[subtest];
  const outOfRangeAble = [...new Set(ableItems.filter((item) => item > maxItem))];
  const outOfRangeUnable = [...new Set(unableItems.filter((item) => item > maxItem))];
  const outOfRange = [...new Set([...outOfRangeAble, ...outOfRangeUnable])].sort((a, b) => a - b);
  const hasOutOfRange = outOfRange.length > 0;

  return {
    ableItems,
    unableItems,
    conflicts,
    duplicates,
    duplicatesAble,
    duplicatesUnable,
    outOfRange,
    outOfRangeAble,
    outOfRangeUnable,
    hasConflicts,
    hasDuplicates,
    hasOutOfRange,
    canCopyAble: ableItems.length > 0 && !hasConflicts && outOfRangeAble.length === 0 && duplicatesAble.length === 0,
    canCopyUnable: unableItems.length > 0 && !hasConflicts && outOfRangeUnable.length === 0 && duplicatesUnable.length === 0,
  };
};
