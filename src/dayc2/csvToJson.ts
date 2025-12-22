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
} from './types';
import {
  parseA1Row,
  parseBRow,
  parseC1Row,
  parseD1Row,
  getAgeBandForTable,
  extractBTableId,
} from './parsers';

const GENERATOR_VERSION = 'dayc2-csv2json@1.0.0';

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
