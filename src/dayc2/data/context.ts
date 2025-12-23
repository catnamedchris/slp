// LookupContext: Provides all tables needed for scoring calculations
// This abstraction allows scoring functions to accept either real or mock tables

import type {
  AgeEquivalentsTableJson,
  RawToStandardTableJson,
  C1TableJson,
  D1TableJson,
  BTableId,
} from '../types';
import { A1, BTables, C1, D1, getBTableForAge } from './index';

/**
 * Context containing all lookup tables needed for DAYC-2 scoring.
 * Scoring functions accept this as a parameter to enable testing with fixtures.
 */
export interface LookupContext {
  /** Table A1: Raw scores to age equivalents */
  ageEquivalents: AgeEquivalentsTableJson;

  /** Tables B13-B29: Raw to standard scores, indexed by table ID */
  rawToStandard: Record<BTableId, RawToStandardTableJson>;

  /** Table C1: Standard scores to percentile ranks */
  standardToPercentile: C1TableJson;

  /** Table D1: Sum of subtest scores to domain composites */
  sumToDomain: D1TableJson;

  /** Get the appropriate B table for a given age in months */
  getBTableForAge: (ageMonths: number) => RawToStandardTableJson | null;
}

/**
 * Creates a LookupContext using the bundled production data.
 */
export const createLookupContext = (): LookupContext => ({
  ageEquivalents: A1,
  rawToStandard: BTables,
  standardToPercentile: C1,
  sumToDomain: D1,
  getBTableForAge,
});

/**
 * Creates a LookupContext using custom tables (for testing with fixtures).
 */
export const createTestLookupContext = (
  overrides: Partial<LookupContext>
): LookupContext => ({
  ageEquivalents: overrides.ageEquivalents ?? A1,
  rawToStandard: overrides.rawToStandard ?? BTables,
  standardToPercentile: overrides.standardToPercentile ?? C1,
  sumToDomain: overrides.sumToDomain ?? D1,
  getBTableForAge: overrides.getBTableForAge ?? getBTableForAge,
});
