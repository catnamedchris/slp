import { describe, it, expect, vi } from 'vitest';
import {
  formatAgeEquivalent,
  formatScore,
  formatPercentile,
  formatSumValue,
  getSubtestDisplay,
  getDomainDisplay,
  SUBTEST_SCORE_COLUMNS,
  DOMAIN_SCORE_COLUMNS,
} from './scoresDisplay';
import { createRawScoreHandler } from './inputs';
import type { SubtestResult, DomainResult } from './calculate';

describe('formatAgeEquivalent', () => {
  it('returns dash for null value', () => {
    expect(formatAgeEquivalent({ value: null, steps: [] })).toBe('—');
  });

  it('formats exact value with mo suffix', () => {
    expect(formatAgeEquivalent({ value: { value: 24 }, steps: [] })).toBe('24 mo');
  });

  it('formats less-than bound with mo suffix', () => {
    expect(formatAgeEquivalent({ value: { bound: 'lt', value: 12 }, steps: [] })).toBe('<12 mo');
  });

  it('formats greater-than bound with mo suffix', () => {
    expect(formatAgeEquivalent({ value: { bound: 'gt', value: 71 }, steps: [] })).toBe('>71 mo');
  });
});

describe('formatScore', () => {
  it('returns dash for null value', () => {
    expect(formatScore({ value: null, steps: [] })).toBe('—');
  });

  it('formats exact value', () => {
    expect(formatScore({ value: { value: 100 }, steps: [] })).toBe('100');
  });

  it('formats less-than bound', () => {
    expect(formatScore({ value: { bound: 'lt', value: 50 }, steps: [] })).toBe('<50');
  });

  it('formats greater-than bound', () => {
    expect(formatScore({ value: { bound: 'gt', value: 150 }, steps: [] })).toBe('>150');
  });

  it('formats range', () => {
    expect(formatScore({ value: { min: 10, max: 20 }, steps: [] })).toBe('10-20');
  });
});

describe('formatPercentile', () => {
  it('returns dash for null value', () => {
    expect(formatPercentile({ value: null, steps: [] })).toBe('—');
  });

  it('formats exact value with percent suffix', () => {
    expect(formatPercentile({ value: { value: 50 }, steps: [] })).toBe('50%');
  });

  it('formats less-than bound with percent suffix', () => {
    expect(formatPercentile({ value: { bound: 'lt', value: 1 }, steps: [] })).toBe('<1%');
  });

  it('formats greater-than bound with percent suffix', () => {
    expect(formatPercentile({ value: { bound: 'gt', value: 99 }, steps: [] })).toBe('>99%');
  });
});

describe('formatSumValue', () => {
  it('returns dash for null', () => {
    expect(formatSumValue(null)).toBe('—');
  });

  it('formats exact sum', () => {
    expect(formatSumValue({ type: 'exact', value: 185 })).toBe('185');
  });

  it('formats less-than sum', () => {
    expect(formatSumValue({ type: 'lt', value: 100 })).toBe('<100');
  });

  it('formats greater-than sum', () => {
    expect(formatSumValue({ type: 'gt', value: 300 })).toBe('>300');
  });
});

describe('getSubtestDisplay', () => {
  it('returns dashes for all scores when result is null', () => {
    const display = getSubtestDisplay('receptiveLanguage', null);

    expect(display.label).toBe('Receptive Language');
    expect(display.note).toBeNull();
    expect(display.scores).toHaveLength(3);
    expect(display.scores[0].value).toBe('—');
    expect(display.scores[1].value).toBe('—');
    expect(display.scores[2].value).toBe('—');
  });

  it('formats all score types correctly', () => {
    const result: SubtestResult = {
      rawScore: 20,
      standardScore: { value: { value: 95 }, steps: [] },
      percentile: { value: { value: 37 }, steps: [] },
      ageEquivalent: { value: { value: 22 }, steps: [] },
    };
    const display = getSubtestDisplay('receptiveLanguage', result);

    expect(display.label).toBe('Receptive Language');
    expect(display.scores[0].value).toBe('95');
    expect(display.scores[1].value).toBe('37%');
    expect(display.scores[2].value).toBe('22 mo');
  });

  it('includes note from standard score', () => {
    const result: SubtestResult = {
      rawScore: 50,
      standardScore: {
        value: { value: 120 },
        steps: [],
        note: 'Raw score exceeds table max',
      },
      percentile: { value: { value: 91 }, steps: [] },
      ageEquivalent: { value: { value: 30 }, steps: [] },
    };
    const display = getSubtestDisplay('expressiveLanguage', result);

    expect(display.note).toBe('Raw score exceeds table max');
  });

  it('preserves provenance steps for each score', () => {
    const mockStep = {
      tableId: 'B17',
      csvRow: 25,
      source: {
        tableId: 'B17',
        tableTitle: 'Table B.17',
        manualPage: 12,
        csvFilename: 'test.csv',
        csvSha256: 'abc123',
        generatedAt: '2025-01-01',
        generatorVersion: 'test',
      },
      description: 'test step',
    };
    const result: SubtestResult = {
      rawScore: 20,
      standardScore: { value: { value: 95 }, steps: [mockStep] },
      percentile: { value: { value: 37 }, steps: [] },
      ageEquivalent: { value: { value: 22 }, steps: [] },
    };
    const display = getSubtestDisplay('cognitive', result);

    expect(display.scores[0].steps).toHaveLength(1);
    expect(display.scores[0].steps[0].tableId).toBe('B17');
  });
});

describe('getDomainDisplay', () => {
  it('returns dashes for all scores when result is null', () => {
    const display = getDomainDisplay(null);

    expect(display.sum).toBe('—');
    expect(display.note).toBeNull();
    expect(display.showNote).toBe(false);
    expect(display.scores).toHaveLength(2);
    expect(display.scores[0].value).toBe('—');
    expect(display.scores[1].value).toBe('—');
  });

  it('formats domain scores correctly', () => {
    const result: DomainResult = {
      sum: { type: 'exact', value: 185 },
      standardScore: { value: { value: 92 }, steps: [] },
      percentile: { value: { value: 30 }, steps: [] },
    };
    const display = getDomainDisplay(result);

    expect(display.sum).toBe('185');
    expect(display.scores[0].value).toBe('92');
    expect(display.scores[1].value).toBe('30%');
  });

  it('shows note when sum is null and note exists', () => {
    const result: DomainResult = {
      sum: null,
      standardScore: {
        value: null,
        steps: [],
        note: 'Missing subtest scores',
      },
      percentile: { value: null, steps: [] },
    };
    const display = getDomainDisplay(result);

    expect(display.note).toBe('Missing subtest scores');
    expect(display.showNote).toBe(true);
  });

  it('does not show note when sum exists', () => {
    const result: DomainResult = {
      sum: { type: 'exact', value: 185 },
      standardScore: {
        value: { value: 92 },
        steps: [],
        note: 'Some note',
      },
      percentile: { value: { value: 30 }, steps: [] },
    };
    const display = getDomainDisplay(result);

    expect(display.note).toBe('Some note');
    expect(display.showNote).toBe(false);
  });

  it('formats bounded sum values', () => {
    const resultLt: DomainResult = {
      sum: { type: 'lt', value: 100 },
      standardScore: { value: { bound: 'lt', value: 41 }, steps: [] },
      percentile: { value: null, steps: [] },
    };
    expect(getDomainDisplay(resultLt).sum).toBe('<100');

    const resultGt: DomainResult = {
      sum: { type: 'gt', value: 300 },
      standardScore: { value: { bound: 'gt', value: 159 }, steps: [] },
      percentile: { value: null, steps: [] },
    };
    expect(getDomainDisplay(resultGt).sum).toBe('>300');
  });
});

describe('createRawScoreHandler', () => {
  it('calls onRawScoreChange with parsed integer', () => {
    const mockCallback = vi.fn();
    const handler = createRawScoreHandler('receptiveLanguage', mockCallback);

    handler('20');

    expect(mockCallback).toHaveBeenCalledWith('receptiveLanguage', 20);
  });

  it('calls onRawScoreChange with null for empty string', () => {
    const mockCallback = vi.fn();
    const handler = createRawScoreHandler('expressiveLanguage', mockCallback);

    handler('');

    expect(mockCallback).toHaveBeenCalledWith('expressiveLanguage', null);
  });

  it('ignores negative values', () => {
    const mockCallback = vi.fn();
    const handler = createRawScoreHandler('cognitive', mockCallback);

    handler('-5');

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('ignores non-numeric values', () => {
    const mockCallback = vi.fn();
    const handler = createRawScoreHandler('grossMotor', mockCallback);

    handler('abc');

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('handles zero correctly', () => {
    const mockCallback = vi.fn();
    const handler = createRawScoreHandler('fineMotor', mockCallback);

    handler('0');

    expect(mockCallback).toHaveBeenCalledWith('fineMotor', 0);
  });
});

describe('SUBTEST_SCORE_COLUMNS', () => {
  it('has three columns', () => {
    expect(SUBTEST_SCORE_COLUMNS).toHaveLength(3);
  });

  it('has correct column definitions', () => {
    expect(SUBTEST_SCORE_COLUMNS[0]).toEqual({ key: 'standardScore', label: 'Standard' });
    expect(SUBTEST_SCORE_COLUMNS[1]).toEqual({ key: 'percentile', label: 'Percentile' });
    expect(SUBTEST_SCORE_COLUMNS[2]).toEqual({ key: 'ageEquivalent', label: 'Age Equiv.' });
  });
});

describe('DOMAIN_SCORE_COLUMNS', () => {
  it('has two columns', () => {
    expect(DOMAIN_SCORE_COLUMNS).toHaveLength(2);
  });

  it('has correct column definitions', () => {
    expect(DOMAIN_SCORE_COLUMNS[0]).toEqual({ key: 'standardScore', label: 'Standard' });
    expect(DOMAIN_SCORE_COLUMNS[1]).toEqual({ key: 'percentile', label: 'Percentile' });
  });
});
