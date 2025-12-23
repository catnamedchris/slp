import { describe, it, expect } from 'vitest';
import { createLookupContext, createTestLookupContext } from './context';
import { createFixtureLookupContext, mockB13 } from './fixtures';

describe('createLookupContext', () => {
  it('returns a context with all tables loaded', () => {
    const ctx = createLookupContext();

    expect(ctx.ageEquivalents.tableId).toBe('A1');
    expect(ctx.standardToPercentile.tableId).toBe('C1');
    expect(ctx.sumToDomain.tableId).toBe('D1');
    expect(ctx.rawToStandard.B13.tableId).toBe('B13');
    expect(ctx.rawToStandard.B29.tableId).toBe('B29');
  });

  it('getBTableForAge returns correct table for age 12', () => {
    const ctx = createLookupContext();
    const table = ctx.getBTableForAge(12);

    expect(table).not.toBeNull();
    expect(table?.tableId).toBe('B13');
    expect(table?.source.ageBand.minMonths).toBe(12);
    expect(table?.source.ageBand.maxMonths).toBe(13);
  });

  it('getBTableForAge returns correct table for age 70', () => {
    const ctx = createLookupContext();
    const table = ctx.getBTableForAge(70);

    expect(table).not.toBeNull();
    expect(table?.tableId).toBe('B29');
  });

  it('getBTableForAge returns null for age out of range', () => {
    const ctx = createLookupContext();

    expect(ctx.getBTableForAge(11)).toBeNull();
    expect(ctx.getBTableForAge(72)).toBeNull();
  });
});

describe('createTestLookupContext', () => {
  it('allows overriding specific tables', () => {
    const ctx = createTestLookupContext({
      rawToStandard: { B13: mockB13 } as never,
    });

    expect(ctx.rawToStandard.B13.source.csvFilename).toBe('mock-B13.csv');
  });
});

describe('createFixtureLookupContext', () => {
  it('returns a context with mock tables', () => {
    const ctx = createFixtureLookupContext();

    expect(ctx.ageEquivalents.source.generatorVersion).toBe('test@1.0.0');
    expect(ctx.rawToStandard.B13.tableId).toBe('B13');
    expect(ctx.getBTableForAge(12)?.tableId).toBe('B13');
    expect(ctx.getBTableForAge(22)?.tableId).toBe('B17');
  });
});
