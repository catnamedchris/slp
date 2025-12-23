// DAYC-2 CSV to JSON Type Definitions

// Re-export SourceMeta from shared for convenience
export type { SourceMeta } from '@/shared/lib/types';
import type { SourceMeta } from '@/shared/lib/types';

// === Numeric Value Types (No 'kind' discriminator) ===

export interface ExactNumber {
  value: number;
}

export interface BoundedNumber {
  bound: 'lt' | 'gt';
  value: number;
}

export interface NumberRange {
  min: number;
  max: number;
}

export type ParsedNumeric = ExactNumber | BoundedNumber | NumberRange;

// Type aliases for semantic clarity
export type ParsedAgeMonths = ExactNumber | BoundedNumber; // No ranges in A1 age_months
export type ParsedScore = ParsedNumeric;
export type ParsedPercentile = ExactNumber | BoundedNumber;

// === Subtest Keys (for lookup functions) ===

export type SubtestKey =
  | 'cognitive'
  | 'receptiveLanguage'
  | 'expressiveLanguage'
  | 'socialEmotional'
  | 'grossMotor'
  | 'fineMotor'
  | 'adaptiveBehavior';

// Domain keys for age equivalents (includes composite domains)
export type AgeEquivalentKey = SubtestKey | 'communication' | 'physicalDevelopment';

// === Table A1: Age Equivalents ===

export interface AgeEquivalentRow {
  csvRow: number;
  ageMonths: ParsedAgeMonths;
  cognitive: ParsedScore | null;
  communication: ParsedScore | null;
  receptiveLanguage: ParsedScore | null;
  expressiveLanguage: ParsedScore | null;
  socialEmotional: ParsedScore | null;
  physicalDevelopment: ParsedScore | null;
  grossMotor: ParsedScore | null;
  fineMotor: ParsedScore | null;
  adaptiveBehavior: ParsedScore | null;
}

export interface AgeEquivalentsTableJson {
  tableId: 'A1';
  source: SourceMeta;
  rows: AgeEquivalentRow[];
}

// === Tables B13-B29: Raw Score to Standard Score ===

export interface AgeBand {
  minMonths: number;
  maxMonths: number;
  label: string;
}

export type BTableId =
  | 'B13' | 'B14' | 'B15' | 'B16' | 'B17' | 'B18' | 'B19'
  | 'B20' | 'B21' | 'B22' | 'B23' | 'B24' | 'B25' | 'B26'
  | 'B27' | 'B28' | 'B29';

export interface RawToStandardRow {
  csvRow: number;
  rawScore: number;
  cognitive: ParsedScore | null;
  receptiveLanguage: ParsedScore | null;
  expressiveLanguage: ParsedScore | null;
  socialEmotional: ParsedScore | null;
  grossMotor: ParsedScore | null;
  fineMotor: ParsedScore | null;
  adaptiveBehavior: ParsedScore | null;
}

export interface RawToStandardTableJson {
  tableId: BTableId;
  source: SourceMeta & { ageBand: AgeBand };
  rows: RawToStandardRow[];
}

// === Table C1: Standard Score to Percentile Rank ===

export interface C1Row {
  csvRow: number;
  standardScore1: ParsedScore | null;
  percentileRank1: ParsedPercentile | null;
  standardScore2: ParsedScore | null;
  percentileRank2: ParsedPercentile | null;
  standardScore3: ParsedScore | null;
  percentileRank3: ParsedPercentile | null;
}

export interface C1TableJson {
  tableId: 'C1';
  source: SourceMeta;
  rows: C1Row[];
}

// === Table D1: Sum of Subdomain Scores to Domain Standard Score ===

export interface D1Row {
  csvRow: number;
  sumRange1: ParsedScore | null;
  standardScore1: ParsedScore | null;
  sumRange2: ParsedScore | null;
  standardScore2: ParsedScore | null;
  sumRange3: ParsedScore | null;
  standardScore3: ParsedScore | null;
}

export interface D1TableJson {
  tableId: 'D1';
  source: SourceMeta;
  rows: D1Row[];
}

// === Union of all table JSON types ===

export type TableJson =
  | AgeEquivalentsTableJson
  | RawToStandardTableJson
  | C1TableJson
  | D1TableJson;
