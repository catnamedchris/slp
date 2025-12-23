// Test fixtures: Small mock tables for unit testing scoring logic
// These are minimal datasets that allow testing without loading full JSON files

import type {
  AgeEquivalentsTableJson,
  RawToStandardTableJson,
  C1TableJson,
  D1TableJson,
  BTableId,
} from '../types';
import type { SourceMeta } from '@/shared/lib/types';
import type { LookupContext } from './context';

// Helper to create mock source metadata
const mockSource = (tableId: string): SourceMeta => ({
  tableId,
  csvFilename: `mock-${tableId}.csv`,
  csvSha256: 'mock-sha256-for-testing',
  generatedAt: '2025-01-01T00:00:00.000Z',
  generatorVersion: 'test@1.0.0',
});

// Mock A1: Age Equivalents (minimal)
export const mockA1: AgeEquivalentsTableJson = {
  tableId: 'A1',
  source: mockSource('A1'),
  rows: [
    {
      csvRow: 2,
      ageMonths: { bound: 'lt', value: 1 },
      cognitive: { min: 0, max: 4 },
      communication: { min: 0, max: 7 },
      receptiveLanguage: { min: 0, max: 4 },
      expressiveLanguage: { min: 0, max: 3 },
      socialEmotional: { min: 0, max: 6 },
      physicalDevelopment: { min: 0, max: 8 },
      grossMotor: { min: 0, max: 5 },
      fineMotor: { min: 0, max: 3 },
      adaptiveBehavior: { min: 0, max: 6 },
    },
    {
      csvRow: 14,
      ageMonths: { value: 12 },
      cognitive: { value: 24 },
      communication: { value: 25 },
      receptiveLanguage: { value: 13 },
      expressiveLanguage: { value: 12 },
      socialEmotional: { value: 22 },
      physicalDevelopment: { value: 49 },
      grossMotor: { value: 28 },
      fineMotor: { value: 21 },
      adaptiveBehavior: { value: 18 },
    },
    {
      csvRow: 26,
      ageMonths: { value: 24 },
      cognitive: { value: 39 },
      communication: { value: 40 },
      receptiveLanguage: { value: 20 },
      expressiveLanguage: { value: 20 },
      socialEmotional: { value: 35 },
      physicalDevelopment: { value: 60 },
      grossMotor: { value: 38 },
      fineMotor: { value: 22 },
      adaptiveBehavior: { value: 33 },
    },
  ],
};

// Mock B13: Raw to Standard (12-13 months, minimal)
export const mockB13: RawToStandardTableJson = {
  tableId: 'B13',
  source: {
    ...mockSource('B13'),
    ageBand: { minMonths: 12, maxMonths: 13, label: '12-13 Months' },
  },
  rows: [
    {
      csvRow: 2,
      rawScore: 0,
      cognitive: { bound: 'lt', value: 50 },
      receptiveLanguage: { bound: 'lt', value: 50 },
      expressiveLanguage: { bound: 'lt', value: 50 },
      socialEmotional: { bound: 'lt', value: 50 },
      grossMotor: { bound: 'lt', value: 50 },
      fineMotor: { value: 56 },
      adaptiveBehavior: { bound: 'lt', value: 50 },
    },
    {
      csvRow: 7,
      rawScore: 5,
      cognitive: { value: 50 },
      receptiveLanguage: { value: 58 },
      expressiveLanguage: { value: 67 },
      socialEmotional: { value: 54 },
      grossMotor: { bound: 'lt', value: 50 },
      fineMotor: { value: 69 },
      adaptiveBehavior: { value: 50 },
    },
    {
      csvRow: 12,
      rawScore: 10,
      cognitive: { value: 60 },
      receptiveLanguage: { value: 90 },
      expressiveLanguage: { value: 95 },
      socialEmotional: { value: 70 },
      grossMotor: { value: 55 },
      fineMotor: { value: 85 },
      adaptiveBehavior: { value: 65 },
    },
    {
      csvRow: 22,
      rawScore: 20,
      cognitive: { value: 100 },
      receptiveLanguage: { value: 120 },
      expressiveLanguage: { value: 130 },
      socialEmotional: { value: 105 },
      grossMotor: { value: 85 },
      fineMotor: { value: 110 },
      adaptiveBehavior: { value: 95 },
    },
    {
      csvRow: 32,
      rawScore: 30,
      cognitive: { value: 130 },
      receptiveLanguage: { bound: 'gt', value: 150 },
      expressiveLanguage: { bound: 'gt', value: 150 },
      socialEmotional: { value: 140 },
      grossMotor: { value: 115 },
      fineMotor: null,
      adaptiveBehavior: { value: 125 },
    },
  ],
};

// Mock B17: Raw to Standard (22-24 months, minimal)
export const mockB17: RawToStandardTableJson = {
  tableId: 'B17',
  source: {
    ...mockSource('B17'),
    ageBand: { minMonths: 22, maxMonths: 24, label: '22-24 Months' },
  },
  rows: [
    {
      csvRow: 2,
      rawScore: 0,
      cognitive: { bound: 'lt', value: 50 },
      receptiveLanguage: { bound: 'lt', value: 50 },
      expressiveLanguage: { bound: 'lt', value: 50 },
      socialEmotional: { bound: 'lt', value: 50 },
      grossMotor: { bound: 'lt', value: 50 },
      fineMotor: { bound: 'lt', value: 50 },
      adaptiveBehavior: { bound: 'lt', value: 50 },
    },
    {
      csvRow: 12,
      rawScore: 10,
      cognitive: { value: 55 },
      receptiveLanguage: { value: 70 },
      expressiveLanguage: { value: 75 },
      socialEmotional: { value: 60 },
      grossMotor: { value: 50 },
      fineMotor: { value: 65 },
      adaptiveBehavior: { value: 55 },
    },
    {
      csvRow: 22,
      rawScore: 20,
      cognitive: { value: 85 },
      receptiveLanguage: { value: 100 },
      expressiveLanguage: { value: 105 },
      socialEmotional: { value: 90 },
      grossMotor: { value: 75 },
      fineMotor: { value: 95 },
      adaptiveBehavior: { value: 80 },
    },
  ],
};

// Mock C1: Standard Score to Percentile (minimal)
export const mockC1: C1TableJson = {
  tableId: 'C1',
  source: mockSource('C1'),
  rows: [
    {
      csvRow: 2,
      standardScore1: { value: 160 },
      percentileRank1: { bound: 'gt', value: 99.9 },
      standardScore2: { value: 119 },
      percentileRank2: { value: 90 },
      standardScore3: { value: 78 },
      percentileRank3: { value: 7 },
    },
    {
      csvRow: 22,
      standardScore1: { value: 140 },
      percentileRank1: { bound: 'gt', value: 99.9 },
      standardScore2: { value: 99 },
      percentileRank2: { value: 47 },
      standardScore3: { value: 58 },
      percentileRank3: { bound: 'lt', value: 1 },
    },
    {
      csvRow: 32,
      standardScore1: { value: 130 },
      percentileRank1: { value: 98 },
      standardScore2: { value: 89 },
      percentileRank2: { value: 23 },
      standardScore3: null,
      percentileRank3: null,
    },
    {
      csvRow: 42,
      standardScore1: { value: 120 },
      percentileRank1: { value: 91 },
      standardScore2: { value: 79 },
      percentileRank2: { value: 8 },
      standardScore3: null,
      percentileRank3: null,
    },
    {
      csvRow: 52,
      standardScore1: { value: 110 },
      percentileRank1: { value: 75 },
      standardScore2: { value: 69 },
      percentileRank2: { value: 2 },
      standardScore3: null,
      percentileRank3: null,
    },
    {
      csvRow: 62,
      standardScore1: { value: 100 },
      percentileRank1: { value: 50 },
      standardScore2: { value: 59 },
      percentileRank2: { bound: 'lt', value: 1 },
      standardScore3: null,
      percentileRank3: null,
    },
    {
      csvRow: 72,
      standardScore1: { value: 90 },
      percentileRank1: { value: 25 },
      standardScore2: { value: 49 },
      percentileRank2: { bound: 'lt', value: 1 },
      standardScore3: null,
      percentileRank3: null,
    },
    {
      csvRow: 82,
      standardScore1: { value: 80 },
      percentileRank1: { value: 9 },
      standardScore2: { value: 40 },
      percentileRank2: { bound: 'lt', value: 1 },
      standardScore3: null,
      percentileRank3: null,
    },
  ],
};

// Mock D1: Sum to Domain Standard Score (minimal)
export const mockD1: D1TableJson = {
  tableId: 'D1',
  source: mockSource('D1'),
  rows: [
    {
      csvRow: 2,
      sumRange1: { min: 100, max: 101 },
      standardScore1: { value: 49 },
      sumRange2: { min: 166, max: 167 },
      standardScore2: { value: 83 },
      sumRange3: { min: 227, max: 229 },
      standardScore3: { value: 117 },
    },
    {
      csvRow: 12,
      sumRange1: { min: 120, max: 122 },
      standardScore1: { value: 59 },
      sumRange2: { min: 186, max: 188 },
      standardScore2: { value: 93 },
      sumRange3: { min: 247, max: 250 },
      standardScore3: { value: 127 },
    },
    {
      csvRow: 22,
      sumRange1: { value: 140 },
      standardScore1: { value: 70 },
      sumRange2: { min: 200, max: 202 },
      standardScore2: { value: 100 },
      sumRange3: { min: 260, max: 262 },
      standardScore3: { value: 134 },
    },
    {
      csvRow: 32,
      sumRange1: { min: 160, max: 162 },
      standardScore1: { value: 80 },
      sumRange2: { min: 220, max: 222 },
      standardScore2: { value: 110 },
      sumRange3: { min: 280, max: 282 },
      standardScore3: { value: 143 },
    },
  ],
};

// Mock BTables: Only includes B13 and B17 for testing
export const mockBTables: Partial<Record<BTableId, RawToStandardTableJson>> = {
  B13: mockB13,
  B17: mockB17,
};

// Mock getBTableForAge function
export const mockGetBTableForAge = (ageMonths: number): RawToStandardTableJson | null => {
  if (ageMonths >= 12 && ageMonths <= 13) return mockB13;
  if (ageMonths >= 22 && ageMonths <= 24) return mockB17;
  return null;
};

// Create a fixture LookupContext for testing
export const createFixtureLookupContext = (): LookupContext => ({
  ageEquivalents: mockA1,
  rawToStandard: mockBTables as Record<BTableId, RawToStandardTableJson>,
  standardToPercentile: mockC1,
  sumToDomain: mockD1,
  getBTableForAge: mockGetBTableForAge,
});
