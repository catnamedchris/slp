import {
  AgeEquivalentRow,
  RawToStandardRow,
  C1Row,
  D1Row,
  AgeBand,
  BTableId,
} from '../../src/dayc2/types';
import { parseValue, parseAgeMonths, parsePercentile } from './parseValue';

export const parseA1Row = (record: Record<string, string>, csvRow: number): AgeEquivalentRow => ({
  csvRow,
  ageMonths: parseAgeMonths(record['age_months']),
  cognitive: parseValue(record['cognitive']),
  communication: parseValue(record['communication']),
  receptiveLanguage: parseValue(record['receptive_language']),
  expressiveLanguage: parseValue(record['expressive_language']),
  socialEmotional: parseValue(record['social_emotional']),
  physicalDevelopment: parseValue(record['physical_development']),
  grossMotor: parseValue(record['gross_motor']),
  fineMotor: parseValue(record['fine_motor']),
  adaptiveBehavior: parseValue(record['adaptive_behavior']),
});

export const parseBRow = (record: Record<string, string>, csvRow: number): RawToStandardRow => ({
  csvRow,
  rawScore: parseInt(record['raw_score'], 10),
  cognitive: parseValue(record['cognitive']),
  receptiveLanguage: parseValue(record['receptive_language']),
  expressiveLanguage: parseValue(record['expressive_language']),
  socialEmotional: parseValue(record['social_emotional']),
  grossMotor: parseValue(record['gross_motor']),
  fineMotor: parseValue(record['fine_motor']),
  adaptiveBehavior: parseValue(record['adaptive_behavior']),
});

export const parseC1Row = (record: Record<string, string>, csvRow: number): C1Row => ({
  csvRow,
  standardScore1: parseValue(record['standard_score_1']),
  percentileRank1: parsePercentile(record['percentile_rank_1'] ?? ''),
  standardScore2: parseValue(record['standard_score_2']),
  percentileRank2: parsePercentile(record['percentile_rank_2'] ?? ''),
  standardScore3: parseValue(record['standard_score_3']),
  percentileRank3: parsePercentile(record['percentile_rank_3'] ?? ''),
});

export const parseD1Row = (record: Record<string, string>, csvRow: number): D1Row => ({
  csvRow,
  sumRange1: parseValue(record['sum_range_1']),
  standardScore1: parseValue(record['standard_score_1']),
  sumRange2: parseValue(record['sum_range_2']),
  standardScore2: parseValue(record['standard_score_2']),
  sumRange3: parseValue(record['sum_range_3']),
  standardScore3: parseValue(record['standard_score_3']),
});

const B_TABLE_AGE_BANDS: Record<BTableId, AgeBand> = {
  B13: { minMonths: 12, maxMonths: 13, label: '12-13 Months' },
  B14: { minMonths: 14, maxMonths: 15, label: '14-15 Months' },
  B15: { minMonths: 16, maxMonths: 18, label: '16-18 Months' },
  B16: { minMonths: 19, maxMonths: 21, label: '19-21 Months' },
  B17: { minMonths: 22, maxMonths: 24, label: '22-24 Months' },
  B18: { minMonths: 25, maxMonths: 27, label: '25-27 Months' },
  B19: { minMonths: 28, maxMonths: 30, label: '28-30 Months' },
  B20: { minMonths: 31, maxMonths: 33, label: '31-33 Months' },
  B21: { minMonths: 34, maxMonths: 36, label: '34-36 Months' },
  B22: { minMonths: 37, maxMonths: 39, label: '37-39 Months' },
  B23: { minMonths: 40, maxMonths: 42, label: '40-42 Months' },
  B24: { minMonths: 43, maxMonths: 45, label: '43-45 Months' },
  B25: { minMonths: 46, maxMonths: 48, label: '46-48 Months' },
  B26: { minMonths: 49, maxMonths: 54, label: '49-54 Months' },
  B27: { minMonths: 55, maxMonths: 60, label: '55-60 Months' },
  B28: { minMonths: 61, maxMonths: 65, label: '61-65 Months' },
  B29: { minMonths: 66, maxMonths: 71, label: '66-71 Months' },
};

export const getAgeBandForTable = (tableId: BTableId): AgeBand => B_TABLE_AGE_BANDS[tableId];

export const extractBTableId = (filename: string): BTableId | null => {
  const match = filename.match(/Table-(B\d{2})/);
  if (match && match[1] in B_TABLE_AGE_BANDS) {
    return match[1] as BTableId;
  }
  return null;
};
