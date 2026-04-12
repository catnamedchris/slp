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
  outOfRange: number[];
  hasConflicts: boolean;
  hasOutOfRange: boolean;
  canCopyAble: boolean;
  canCopyUnable: boolean;
  formatCopyText: (list: 'able' | 'unable') => string;
}

/** Create empty skill items for all subtests */
export const createEmptySkillItems = (): AllSkillItems => ({
  receptiveLanguage: { able: [], unable: [] },
  expressiveLanguage: { able: [], unable: [] },
  socialEmotional: { able: [], unable: [] },
});

/**
 * Parse a flexible input string into sorted unique positive integers.
 * Accepts commas, spaces, semicolons as separators.
 * Ignores non-numeric, negative, zero, and decimal values.
 */
export const parseItemInput = (input: string): number[] => {
  if (!input.trim()) return [];

  const tokens = input.split(/[,;\s]+/).filter(Boolean);
  const numbers: Set<number> = new Set();

  for (const token of tokens) {
    const parsed = Number(token);
    if (Number.isInteger(parsed) && parsed > 0) {
      numbers.add(parsed);
    }
  }

  return [...numbers].sort((a, b) => a - b);
};

/**
 * Add items to a sorted number array, returning a new sorted unique array.
 */
export const addItems = (existing: number[], toAdd: number[]): number[] => {
  const set = new Set([...existing, ...toAdd]);
  return [...set].sort((a, b) => a - b);
};

/**
 * Remove an item from a number array, returning a new array.
 */
export const removeItem = (existing: number[], item: number): number[] =>
  existing.filter((n) => n !== item);

/**
 * Validate a subtest's skill items: detect conflicts and out-of-range items.
 */
export const validateSkillItems = (
  input: SkillItemsInput,
  subtest?: ActiveSubtestKey,
): SkillValidation => {
  const { able: ableItems, unable: unableItems } = input;

  const ableSet = new Set(ableItems);
  const conflicts = unableItems.filter((item) => ableSet.has(item));
  const hasConflicts = conflicts.length > 0;

  const maxItem = subtest ? SUBTEST_MAX_ITEM[subtest] : Infinity;
  const allItems = [...new Set([...ableItems, ...unableItems])];
  const outOfRange = allItems.filter((item) => item > maxItem).sort((a, b) => a - b);
  const hasOutOfRange = outOfRange.length > 0;

  const hasErrors = hasConflicts || hasOutOfRange;

  const formatCopyText = (list: 'able' | 'unable'): string => {
    const items = list === 'able' ? ableItems : unableItems;
    return items.join(', ');
  };

  return {
    ableItems,
    unableItems,
    conflicts,
    outOfRange,
    hasConflicts,
    hasOutOfRange,
    canCopyAble: ableItems.length > 0 && !hasErrors,
    canCopyUnable: unableItems.length > 0 && !hasErrors,
    formatCopyText,
  };
};
