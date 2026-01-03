import * as path from 'path';
import { parseCsv, computeSha256, createSourceMeta, processA1, processBTable, processC1, processD1 } from './csvToJson';

describe('parseCsv', () => {
  it('parses simple CSV with header', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = parseCsv(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Alice', age: '30' });
    expect(result[1]).toEqual({ name: 'Bob', age: '25' });
  });

  it('handles empty values', () => {
    const csv = 'a,b,c\n1,,3\n,2,';
    const result = parseCsv(csv);

    expect(result[0]).toEqual({ a: '1', b: '', c: '3' });
    expect(result[1]).toEqual({ a: '', b: '2', c: '' });
  });

  it('handles single row', () => {
    const csv = 'col1,col2\nval1,val2';
    const result = parseCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ col1: 'val1', col2: 'val2' });
  });

  it('trims trailing newline', () => {
    const csv = 'x,y\n1,2\n';
    const result = parseCsv(csv);

    expect(result).toHaveLength(1);
  });
});

describe('computeSha256', () => {
  it('computes correct hash for known input', () => {
    const hash = computeSha256('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('produces different hash for different input', () => {
    const hash1 = computeSha256('abc');
    const hash2 = computeSha256('abd');
    expect(hash1).not.toBe(hash2);
  });
});

describe('createSourceMeta', () => {
  it('creates metadata with correct fields', () => {
    const meta = createSourceMeta('B13', 'test.csv', 'content');

    expect(meta.tableId).toBe('B13');
    expect(meta.csvFilename).toBe('test.csv');
    expect(meta.csvSha256).toBe(computeSha256('content'));
    expect(meta.generatorVersion).toBe('dayc2-csv2json@1.0.0');
    expect(meta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

const CSV_DIR = path.join(__dirname, '../../data/csv');

describe('processA1', () => {
  const csvPath = path.join(CSV_DIR, 'Table-A1-Raw-Scores-to-Age-Equivalents.csv');

  it('returns correct tableId', () => {
    const result = processA1(csvPath);
    expect(result.tableId).toBe('A1');
  });

  it('includes source metadata with checksum', () => {
    const result = processA1(csvPath);
    expect(result.source.csvFilename).toBe('Table-A1-Raw-Scores-to-Age-Equivalents.csv');
    expect(result.source.csvSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('parses first row correctly (age <1)', () => {
    const result = processA1(csvPath);
    const firstRow = result.rows[0];

    expect(firstRow.csvRow).toBe(2);
    expect(firstRow.ageMonths).toEqual({ bound: 'lt', value: 1 });
    expect(firstRow.cognitive).toEqual({ min: 0, max: 4 });
  });

  it('parses last row correctly (age >71)', () => {
    const result = processA1(csvPath);
    const lastRow = result.rows[result.rows.length - 1];

    expect(lastRow.ageMonths).toEqual({ bound: 'gt', value: 71 });
    expect(lastRow.cognitive).toEqual({ bound: 'gt', value: 81 });
  });

  it('has expected row count', () => {
    const result = processA1(csvPath);
    expect(result.rows.length).toBeGreaterThanOrEqual(70);
  });
});

describe('processBTable', () => {
  const csvPath = path.join(CSV_DIR, 'Table-B13-Raw-Scores-to-Standard-Scores-Age-12-13-Months.csv');

  it('returns correct tableId and ageBand', () => {
    const result = processBTable(csvPath, 'B13');

    expect(result.tableId).toBe('B13');
    expect(result.source.ageBand).toEqual({
      minMonths: 12,
      maxMonths: 13,
      label: '12-13 Months',
    });
  });

  it('parses first row (rawScore 0) with bounded values', () => {
    const result = processBTable(csvPath, 'B13');
    const firstRow = result.rows[0];

    expect(firstRow.rawScore).toBe(0);
    expect(firstRow.cognitive).toEqual({ bound: 'lt', value: 50 });
    expect(firstRow.fineMotor).toEqual({ value: 56 });
  });

  it('parses row with greater-than values', () => {
    const result = processBTable(csvPath, 'B13');
    const row48 = result.rows.find(r => r.rawScore === 48);

    expect(row48?.cognitive).toEqual({ bound: 'gt', value: 150 });
  });

  it('has expected row count', () => {
    const result = processBTable(csvPath, 'B13');
    expect(result.rows.length).toBeGreaterThanOrEqual(50);
  });
});

describe('processC1', () => {
  const csvPath = path.join(CSV_DIR, 'Table-C1-Standard-Scores-to-Percentile-Ranks.csv');

  it('returns correct tableId', () => {
    const result = processC1(csvPath);
    expect(result.tableId).toBe('C1');
  });

  it('parses first row with >99.9 percentile', () => {
    const result = processC1(csvPath);
    const firstRow = result.rows[0];

    expect(firstRow.standardScore1).toEqual({ value: 160 });
    expect(firstRow.percentileRank1).toEqual({ bound: 'gt', value: 99.9 });
  });

  it('parses row with <0.1 percentile', () => {
    const result = processC1(csvPath);
    const row = result.rows.find(r => 
      r.percentileRank3 && 'bound' in r.percentileRank3 && r.percentileRank3.bound === 'lt'
    );

    expect(row?.percentileRank3).toEqual({ bound: 'lt', value: 0.1 });
  });

  it('handles empty trailing cells', () => {
    const result = processC1(csvPath);
    const lastRow = result.rows[result.rows.length - 1];

    expect(lastRow.standardScore3).toBeNull();
    expect(lastRow.percentileRank3).toBeNull();
  });
});

describe('processD1', () => {
  const csvPath = path.join(CSV_DIR, 'Table-D1-Sums-of-Subdomain-Standard-Scores-to-Domain-Standard-Scores.csv');

  it('returns correct tableId', () => {
    const result = processD1(csvPath);
    expect(result.tableId).toBe('D1');
  });

  it('parses row with range sum', () => {
    const result = processD1(csvPath);
    const firstRow = result.rows[0];

    expect(firstRow.sumRange1).toEqual({ min: 100, max: 101 });
    expect(firstRow.standardScore1).toEqual({ value: 49 });
  });

  it('parses row with single-value sum', () => {
    const result = processD1(csvPath);
    const row = result.rows.find(r => 
      r.sumRange1 && 'value' in r.sumRange1 && r.sumRange1.value === 102
    );

    expect(row?.sumRange1).toEqual({ value: 102 });
    expect(row?.standardScore1).toEqual({ value: 50 });
  });

  it('has expected row count', () => {
    const result = processD1(csvPath);
    expect(result.rows.length).toBeGreaterThanOrEqual(30);
  });
});
