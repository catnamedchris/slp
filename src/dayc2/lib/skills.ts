// Skills input parsing, validation, and copy formatting
// Skill descriptions will be added later — for now, items are displayed as numbers

import type { ActiveSubtestKey } from './metadata';

/** Raw input strings for a single subtest's skills */
export interface SkillItemsInput {
  able: string;
  unable: string;
}

/** All subtests' skill items */
export type AllSkillItems = Record<ActiveSubtestKey, SkillItemsInput>;

/** Validation result for a single subtest's skill items */
export interface SkillValidation {
  ableItems: number[];
  unableItems: number[];
  conflicts: number[];
  hasConflicts: boolean;
  canCopyAble: boolean;
  canCopyUnable: boolean;
  formatCopyText: (list: 'able' | 'unable') => string;
}

/** Create empty skill items for all subtests */
export const createEmptySkillItems = (): AllSkillItems => ({
  receptiveLanguage: { able: '', unable: '' },
  expressiveLanguage: { able: '', unable: '' },
  socialEmotional: { able: '', unable: '' },
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
 * Validate a subtest's skill items: parse both lists, detect conflicts.
 */
export const validateSkillItems = (input: SkillItemsInput): SkillValidation => {
  const ableItems = parseItemInput(input.able);
  const unableItems = parseItemInput(input.unable);

  const ableSet = new Set(ableItems);
  const conflicts = unableItems.filter((item) => ableSet.has(item));
  const hasConflicts = conflicts.length > 0;

  const formatCopyText = (list: 'able' | 'unable'): string => {
    const items = list === 'able' ? ableItems : unableItems;
    return items.join(', ');
  };

  return {
    ableItems,
    unableItems,
    conflicts,
    hasConflicts,
    canCopyAble: ableItems.length > 0 && !hasConflicts,
    canCopyUnable: unableItems.length > 0 && !hasConflicts,
    formatCopyText,
  };
};
