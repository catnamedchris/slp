import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  SourceMeta,
  AgeEquivalentsTableJson,
  RawToStandardTableJson,
  C1TableJson,
  D1TableJson,
  BTableId,
} from '../../src/dayc2/types';
import {
  parseA1Row,
  parseBRow,
  parseC1Row,
  parseD1Row,
  getAgeBandForTable,
  extractBTableId,
} from './parsers';

const GENERATOR_VERSION = 'dayc2-csv2json@1.1.0';

// Page numbers in the DAYC-2 Scoring Manual PDF
const TABLE_MANUAL_PAGES: Record<string, number> = {
  A1: 1,
  B13: 4, B14: 6, B15: 8, B16: 10, B17: 12, B18: 14, B19: 16,
  B20: 18, B21: 20, B22: 22, B23: 24, B24: 26, B25: 28, B26: 30,
  B27: 32, B28: 34, B29: 36,
  C1: 38,
  D1: 39,
};

// Human-readable table titles as printed in the manual
const TABLE_TITLES: Record<string, string> = {
  A1: 'Table A.1 Raw Scores to Age Equivalents',
  B13: 'Table B.13 Raw Scores to Standard Scores: Ages 12–13 Months',
  B14: 'Table B.14 Raw Scores to Standard Scores: Ages 14–15 Months',
  B15: 'Table B.15 Raw Scores to Standard Scores: Ages 16–18 Months',
  B16: 'Table B.16 Raw Scores to Standard Scores: Ages 19–21 Months',
  B17: 'Table B.17 Raw Scores to Standard Scores: Ages 22–24 Months',
  B18: 'Table B.18 Raw Scores to Standard Scores: Ages 25–27 Months',
  B19: 'Table B.19 Raw Scores to Standard Scores: Ages 28–30 Months',
  B20: 'Table B.20 Raw Scores to Standard Scores: Ages 31–33 Months',
  B21: 'Table B.21 Raw Scores to Standard Scores: Ages 34–36 Months',
  B22: 'Table B.22 Raw Scores to Standard Scores: Ages 37–39 Months',
  B23: 'Table B.23 Raw Scores to Standard Scores: Ages 40–42 Months',
  B24: 'Table B.24 Raw Scores to Standard Scores: Ages 43–45 Months',
  B25: 'Table B.25 Raw Scores to Standard Scores: Ages 46–48 Months',
  B26: 'Table B.26 Raw Scores to Standard Scores: Ages 49–53 Months',
  B27: 'Table B.27 Raw Scores to Standard Scores: Ages 54–59 Months',
  B28: 'Table B.28 Raw Scores to Standard Scores: Ages 60–65 Months',
  B29: 'Table B.29 Raw Scores to Standard Scores: Ages 66–71 Months',
  C1: 'Table C.1 Standard Scores to Percentile Ranks',
  D1: 'Table D.1 Sums of Subdomain Standard Scores to Domain Standard Scores',
};

export const parseCsv = (content: string): Record<string, string>[] => {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = values[i] ?? '';
    });
    return record;
  });
};

export const computeSha256 = (content: string): string =>
  crypto.createHash('sha256').update(content).digest('hex');

export const createSourceMeta = (tableId: string, csvFilename: string, csvContent: string): SourceMeta => ({
  tableId,
  tableTitle: TABLE_TITLES[tableId] ?? `Table ${tableId}`,
  manualPage: TABLE_MANUAL_PAGES[tableId] ?? 0,
  csvFilename,
  csvSha256: computeSha256(csvContent),
  generatedAt: new Date().toISOString(),
  generatorVersion: GENERATOR_VERSION,
});

export const processA1 = (csvPath: string): AgeEquivalentsTableJson => {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvFilename = path.basename(csvPath);
  const records = parseCsv(csvContent);
  const rows = records.map((r, i) => parseA1Row(r, i + 2));

  return {
    tableId: 'A1',
    source: createSourceMeta('A1', csvFilename, csvContent),
    rows,
  };
};

export const processBTable = (csvPath: string, tableId: BTableId): RawToStandardTableJson => {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvFilename = path.basename(csvPath);
  const records = parseCsv(csvContent);
  const rows = records.map((r, i) => parseBRow(r, i + 2));

  return {
    tableId,
    source: {
      ...createSourceMeta(tableId, csvFilename, csvContent),
      ageBand: getAgeBandForTable(tableId),
    },
    rows,
  };
};

export const processC1 = (csvPath: string): C1TableJson => {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvFilename = path.basename(csvPath);
  const records = parseCsv(csvContent);
  const rows = records.map((r, i) => parseC1Row(r, i + 2));

  return {
    tableId: 'C1',
    source: createSourceMeta('C1', csvFilename, csvContent),
    rows,
  };
};

export const processD1 = (csvPath: string): D1TableJson => {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvFilename = path.basename(csvPath);
  const records = parseCsv(csvContent);
  const rows = records.map((r, i) => parseD1Row(r, i + 2));

  return {
    tableId: 'D1',
    source: createSourceMeta('D1', csvFilename, csvContent),
    rows,
  };
};

const main = () => {
  const csvDir = path.join(__dirname, '../../data/csv');
  const jsonDir = path.join(__dirname, '../../data/json');

  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  const csvFiles = fs.readdirSync(csvDir).filter((f) => f.endsWith('.csv'));

  for (const csvFile of csvFiles) {
    const csvPath = path.join(csvDir, csvFile);
    const jsonFile = csvFile.replace('.csv', '.json');
    const jsonPath = path.join(jsonDir, jsonFile);

    let result: unknown;

    if (csvFile.startsWith('Table-A1')) {
      result = processA1(csvPath);
      console.log(`Processed A1: ${csvFile}`);
    } else if (csvFile.startsWith('Table-B')) {
      const tableId = extractBTableId(csvFile);
      if (tableId) {
        result = processBTable(csvPath, tableId);
        console.log(`Processed ${tableId}: ${csvFile}`);
      } else {
        console.warn(`Skipping unknown B table: ${csvFile}`);
        continue;
      }
    } else if (csvFile.startsWith('Table-C1')) {
      result = processC1(csvPath);
      console.log(`Processed C1: ${csvFile}`);
    } else if (csvFile.startsWith('Table-D1')) {
      result = processD1(csvPath);
      console.log(`Processed D1: ${csvFile}`);
    } else {
      console.warn(`Skipping unrecognized file: ${csvFile}`);
      continue;
    }

    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`  → ${jsonFile}`);
  }

  console.log('\nDone!');
};

if (require.main === module) {
  main();
}
