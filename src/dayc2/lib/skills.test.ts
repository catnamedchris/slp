import { describe, it, expect } from 'vitest';
import {
  parseItemInput,
  validateSkillItems,
  addItems,
  removeItem,
  createEmptySkillItems,
  formatSkillCopyText,
  type SkillItemsInput,
} from './skills';

describe('parseItemInput', () => {
  it('returns empty array for empty string', () => {
    expect(parseItemInput('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseItemInput('   ')).toEqual([]);
  });

  it('parses comma-separated numbers', () => {
    expect(parseItemInput('12, 14, 17')).toEqual([12, 14, 17]);
  });

  it('parses space-separated numbers', () => {
    expect(parseItemInput('12 14 17')).toEqual([12, 14, 17]);
  });

  it('parses semicolon-separated numbers', () => {
    expect(parseItemInput('12; 14; 17')).toEqual([12, 14, 17]);
  });

  it('handles mixed separators', () => {
    expect(parseItemInput('12, 14; 17 19')).toEqual([12, 14, 17, 19]);
  });

  it('returns sorted unique numbers', () => {
    expect(parseItemInput('17, 12, 14, 12')).toEqual([12, 14, 17]);
  });

  it('ignores non-numeric tokens', () => {
    expect(parseItemInput('12, abc, 14')).toEqual([12, 14]);
  });

  it('ignores negative numbers', () => {
    expect(parseItemInput('12, -5, 14')).toEqual([12, 14]);
  });

  it('ignores zero', () => {
    expect(parseItemInput('0, 12, 14')).toEqual([12, 14]);
  });

  it('ignores decimal numbers', () => {
    expect(parseItemInput('12, 14.5, 17')).toEqual([12, 17]);
  });

  it('handles trailing/leading separators', () => {
    expect(parseItemInput(', 12, 14, ')).toEqual([12, 14]);
  });

  it('rejects scientific notation', () => {
    expect(parseItemInput('1e2, 12')).toEqual([12]);
  });

  it('rejects hex notation', () => {
    expect(parseItemInput('0x10, 12')).toEqual([12]);
  });

  it('rejects numbers with leading plus', () => {
    expect(parseItemInput('+12, 14')).toEqual([14]);
  });

  it('rejects 14.0 as decimal', () => {
    expect(parseItemInput('14.0, 12')).toEqual([12]);
  });

  it('handles tab-separated input', () => {
    expect(parseItemInput('12\t14\t17')).toEqual([12, 14, 17]);
  });

  it('handles newline-separated input', () => {
    expect(parseItemInput('12\n14\n17')).toEqual([12, 14, 17]);
  });
});

describe('addItems', () => {
  it('adds items to an empty array', () => {
    expect(addItems([], [3, 1, 2])).toEqual([1, 2, 3]);
  });

  it('preserves duplicates', () => {
    expect(addItems([1, 3], [3, 4])).toEqual([1, 3, 3, 4]);
  });

  it('returns sorted result', () => {
    expect(addItems([10], [1, 5])).toEqual([1, 5, 10]);
  });
});

describe('removeItem', () => {
  it('removes first occurrence of an item', () => {
    expect(removeItem([1, 2, 2, 3], 2)).toEqual([1, 2, 3]);
  });

  it('returns same array if item not found', () => {
    expect(removeItem([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });

  it('returns empty array when removing last item', () => {
    expect(removeItem([1], 1)).toEqual([]);
  });
});

describe('createEmptySkillItems', () => {
  it('creates empty arrays for all subtests', () => {
    const items = createEmptySkillItems();
    expect(items.receptiveLanguage).toEqual({ able: [], unable: [] });
    expect(items.expressiveLanguage).toEqual({ able: [], unable: [] });
    expect(items.socialEmotional).toEqual({ able: [], unable: [] });
  });
});

describe('formatSkillCopyText', () => {
  it('returns comma-separated items', () => {
    expect(formatSkillCopyText([12, 14, 17])).toBe('12, 14, 17');
  });

  it('returns empty string for empty list', () => {
    expect(formatSkillCopyText([])).toBe('');
  });

  it('returns single item without comma', () => {
    expect(formatSkillCopyText([5])).toBe('5');
  });
});

describe('validateSkillItems', () => {
  it('returns valid with no errors for clean input', () => {
    const input: SkillItemsInput = { able: [12, 14], unable: [16, 18] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.ableItems).toEqual([12, 14]);
    expect(result.unableItems).toEqual([16, 18]);
    expect(result.conflicts).toEqual([]);
    expect(result.hasConflicts).toBe(false);
  });

  it('detects conflicts (same item in both lists)', () => {
    const input: SkillItemsInput = { able: [12, 14], unable: [14, 18] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.conflicts).toEqual([14]);
    expect(result.hasConflicts).toBe(true);
  });

  it('detects multiple conflicts', () => {
    const input: SkillItemsInput = { able: [12, 14, 18], unable: [14, 18, 20] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.conflicts).toEqual([14, 18]);
    expect(result.hasConflicts).toBe(true);
  });

  it('returns empty arrays for empty input', () => {
    const input: SkillItemsInput = { able: [], unable: [] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.ableItems).toEqual([]);
    expect(result.unableItems).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.hasConflicts).toBe(false);
  });

  it('handles one list empty', () => {
    const input: SkillItemsInput = { able: [12, 14], unable: [] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.ableItems).toEqual([12, 14]);
    expect(result.unableItems).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.hasConflicts).toBe(false);
  });

  it('canCopyAble is true when able has items and no errors', () => {
    const result = validateSkillItems({ able: [12, 14], unable: [16] }, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(true);
  });

  it('canCopyAble is false when conflicts exist', () => {
    const result = validateSkillItems({ able: [12, 14], unable: [14] }, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(false);
  });

  it('canCopyAble is false when able is empty', () => {
    const result = validateSkillItems({ able: [], unable: [14] }, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(false);
  });

  it('canCopyUnable is true when unable has items and no errors', () => {
    const result = validateSkillItems({ able: [12], unable: [16, 18] }, 'receptiveLanguage');
    expect(result.canCopyUnable).toBe(true);
  });

  it('canCopyUnable is false when conflicts exist', () => {
    const result = validateSkillItems({ able: [12], unable: [12, 18] }, 'receptiveLanguage');
    expect(result.canCopyUnable).toBe(false);
  });

  // Out-of-range validation
  it('detects out-of-range items', () => {
    const input: SkillItemsInput = { able: [10, 35], unable: [20] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.outOfRange).toEqual([35]);
    expect(result.hasOutOfRange).toBe(true);
  });

  it('detects out-of-range in both lists', () => {
    const input: SkillItemsInput = { able: [35], unable: [36] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.outOfRange).toEqual([35, 36]);
    expect(result.hasOutOfRange).toBe(true);
  });

  it('no out-of-range when all items valid', () => {
    const input: SkillItemsInput = { able: [10, 34], unable: [20] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.outOfRange).toEqual([]);
    expect(result.hasOutOfRange).toBe(false);
  });

  it('uses correct max for each subtest', () => {
    expect(validateSkillItems({ able: [38], unable: [] }, 'expressiveLanguage').hasOutOfRange).toBe(false);
    expect(validateSkillItems({ able: [39], unable: [] }, 'expressiveLanguage').hasOutOfRange).toBe(true);
    expect(validateSkillItems({ able: [58], unable: [] }, 'socialEmotional').hasOutOfRange).toBe(false);
    expect(validateSkillItems({ able: [59], unable: [] }, 'socialEmotional').hasOutOfRange).toBe(true);
  });

  // Per-list out-of-range tracking
  it('tracks out-of-range per list', () => {
    const input: SkillItemsInput = { able: [10], unable: [36] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.outOfRangeAble).toEqual([]);
    expect(result.outOfRangeUnable).toEqual([36]);
  });

  it('canCopyAble is true when only unable has out-of-range', () => {
    const input: SkillItemsInput = { able: [10, 12], unable: [36] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(true);
    expect(result.canCopyUnable).toBe(false);
  });

  it('canCopyUnable is true when only able has out-of-range', () => {
    const input: SkillItemsInput = { able: [35], unable: [20] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(false);
    expect(result.canCopyUnable).toBe(true);
  });

  it('canCopy is false for both when conflicts exist regardless of range', () => {
    const input: SkillItemsInput = { able: [10, 20], unable: [20] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(false);
    expect(result.canCopyUnable).toBe(false);
  });

  it('handles simultaneous conflict and out-of-range', () => {
    const input: SkillItemsInput = { able: [14, 35], unable: [14, 36] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.conflicts).toEqual([14]);
    expect(result.outOfRange).toEqual([35, 36]);
    expect(result.canCopyAble).toBe(false);
    expect(result.canCopyUnable).toBe(false);
  });

  // Duplicate detection
  it('detects duplicates within able list', () => {
    const input: SkillItemsInput = { able: [8, 8, 12], unable: [] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.duplicatesAble).toEqual([8]);
    expect(result.duplicates).toEqual([8]);
    expect(result.hasDuplicates).toBe(true);
  });

  it('detects duplicates within unable list', () => {
    const input: SkillItemsInput = { able: [], unable: [16, 16, 18] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.duplicatesUnable).toEqual([16]);
    expect(result.duplicates).toEqual([16]);
    expect(result.hasDuplicates).toBe(true);
  });

  it('no duplicates when all items unique', () => {
    const input: SkillItemsInput = { able: [8, 12], unable: [16, 18] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.duplicates).toEqual([]);
    expect(result.hasDuplicates).toBe(false);
  });

  it('canCopy is false when duplicates exist in that list', () => {
    const input: SkillItemsInput = { able: [8, 8], unable: [16] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(false);
    expect(result.canCopyUnable).toBe(true);
  });

  it('same item duplicate in both lists detected independently', () => {
    const input: SkillItemsInput = { able: [8, 8], unable: [8, 8] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.duplicatesAble).toEqual([8]);
    expect(result.duplicatesUnable).toEqual([8]);
    expect(result.hasConflicts).toBe(true);
    expect(result.hasDuplicates).toBe(true);
  });
});
