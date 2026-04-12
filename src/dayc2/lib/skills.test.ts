import { describe, it, expect } from 'vitest';
import {
  parseItemInput,
  validateSkillItems,
  addItems,
  removeItem,
  createEmptySkillItems,
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
});

describe('addItems', () => {
  it('adds items to an empty array', () => {
    expect(addItems([], [3, 1, 2])).toEqual([1, 2, 3]);
  });

  it('merges and deduplicates', () => {
    expect(addItems([1, 3], [2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it('returns sorted result', () => {
    expect(addItems([10], [1, 5])).toEqual([1, 5, 10]);
  });
});

describe('removeItem', () => {
  it('removes an existing item', () => {
    expect(removeItem([1, 2, 3], 2)).toEqual([1, 3]);
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

describe('validateSkillItems', () => {
  it('returns valid with no errors for clean input', () => {
    const input: SkillItemsInput = { able: [12, 14], unable: [16, 18] };
    const result = validateSkillItems(input);
    expect(result.ableItems).toEqual([12, 14]);
    expect(result.unableItems).toEqual([16, 18]);
    expect(result.conflicts).toEqual([]);
    expect(result.hasConflicts).toBe(false);
  });

  it('detects conflicts (same item in both lists)', () => {
    const input: SkillItemsInput = { able: [12, 14], unable: [14, 18] };
    const result = validateSkillItems(input);
    expect(result.conflicts).toEqual([14]);
    expect(result.hasConflicts).toBe(true);
  });

  it('detects multiple conflicts', () => {
    const input: SkillItemsInput = { able: [12, 14, 18], unable: [14, 18, 20] };
    const result = validateSkillItems(input);
    expect(result.conflicts).toEqual([14, 18]);
    expect(result.hasConflicts).toBe(true);
  });

  it('returns empty arrays for empty input', () => {
    const input: SkillItemsInput = { able: [], unable: [] };
    const result = validateSkillItems(input);
    expect(result.ableItems).toEqual([]);
    expect(result.unableItems).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.hasConflicts).toBe(false);
  });

  it('handles one list empty', () => {
    const input: SkillItemsInput = { able: [12, 14], unable: [] };
    const result = validateSkillItems(input);
    expect(result.ableItems).toEqual([12, 14]);
    expect(result.unableItems).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.hasConflicts).toBe(false);
  });

  it('canCopyAble is true when able has items and no errors', () => {
    const result = validateSkillItems({ able: [12, 14], unable: [16] });
    expect(result.canCopyAble).toBe(true);
  });

  it('canCopyAble is false when conflicts exist', () => {
    const result = validateSkillItems({ able: [12, 14], unable: [14] });
    expect(result.canCopyAble).toBe(false);
  });

  it('canCopyAble is false when able is empty', () => {
    const result = validateSkillItems({ able: [], unable: [14] });
    expect(result.canCopyAble).toBe(false);
  });

  it('canCopyUnable is true when unable has items and no errors', () => {
    const result = validateSkillItems({ able: [12], unable: [16, 18] });
    expect(result.canCopyUnable).toBe(true);
  });

  it('canCopyUnable is false when conflicts exist', () => {
    const result = validateSkillItems({ able: [12], unable: [12, 18] });
    expect(result.canCopyUnable).toBe(false);
  });

  it('formatCopyText returns comma-separated items', () => {
    const result = validateSkillItems({ able: [12, 14, 17], unable: [] });
    expect(result.formatCopyText('able')).toBe('12, 14, 17');
  });

  it('formatCopyText returns empty string for empty list', () => {
    const result = validateSkillItems({ able: [], unable: [] });
    expect(result.formatCopyText('able')).toBe('');
  });

  // Out-of-range validation
  it('detects out-of-range items when subtest is provided', () => {
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

  it('canCopy is false when out-of-range items exist', () => {
    const input: SkillItemsInput = { able: [10, 35], unable: [20] };
    const result = validateSkillItems(input, 'receptiveLanguage');
    expect(result.canCopyAble).toBe(false);
    expect(result.canCopyUnable).toBe(false);
  });

  it('uses correct max for each subtest', () => {
    expect(validateSkillItems({ able: [38], unable: [] }, 'expressiveLanguage').hasOutOfRange).toBe(false);
    expect(validateSkillItems({ able: [39], unable: [] }, 'expressiveLanguage').hasOutOfRange).toBe(true);
    expect(validateSkillItems({ able: [58], unable: [] }, 'socialEmotional').hasOutOfRange).toBe(false);
    expect(validateSkillItems({ able: [59], unable: [] }, 'socialEmotional').hasOutOfRange).toBe(true);
  });

  it('skips range check when no subtest provided', () => {
    const input: SkillItemsInput = { able: [999], unable: [] };
    const result = validateSkillItems(input);
    expect(result.outOfRange).toEqual([]);
    expect(result.hasOutOfRange).toBe(false);
  });
});
