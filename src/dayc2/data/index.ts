// DAYC-2 Data Imports
// All JSON tables bundled into the app for offline support

import type {
  AgeEquivalentsTableJson,
  RawToStandardTableJson,
  C1TableJson,
  D1TableJson,
  BTableId,
} from '../types';

// Table A1: Raw Scores to Age Equivalents
import tableA1 from '@data/json/Table-A1-Raw-Scores-to-Age-Equivalents.json';

// Tables B13-B29: Raw Scores to Standard Scores (by age band)
import tableB13 from '@data/json/Table-B13-Raw-Scores-to-Standard-Scores-Age-12-13-Months.json';
import tableB14 from '@data/json/Table-B14-Raw-Scores-to-Standard-Scores-Age-14-15-Months.json';
import tableB15 from '@data/json/Table-B15-Raw-Scores-to-Standard-Scores-Age-16-18-Months.json';
import tableB16 from '@data/json/Table-B16-Raw-Scores-to-Standard-Scores-Age-19-21-Months.json';
import tableB17 from '@data/json/Table-B17-Raw-Scores-to-Standard-Scores-Age-22-24-Months.json';
import tableB18 from '@data/json/Table-B18-Raw-Scores-to-Standard-Scores-Age-25-27-Months.json';
import tableB19 from '@data/json/Table-B19-Raw-Scores-to-Standard-Scores-Age-28-30-Months.json';
import tableB20 from '@data/json/Table-B20-Raw-Scores-to-Standard-Scores-Age-31-33-Months.json';
import tableB21 from '@data/json/Table-B21-Raw-Scores-to-Standard-Scores-Age-34-36-Months.json';
import tableB22 from '@data/json/Table-B22-Raw-Scores-to-Standard-Scores-Age-37-39-Months.json';
import tableB23 from '@data/json/Table-B23-Raw-Scores-to-Standard-Scores-Age-40-42-Months.json';
import tableB24 from '@data/json/Table-B24-Raw-Scores-to-Standard-Scores-Age-43-45-Months.json';
import tableB25 from '@data/json/Table-B25-Raw-Scores-to-Standard-Scores-Age-46-48-Months.json';
import tableB26 from '@data/json/Table-B26-Raw-Scores-to-Standard-Scores-Age-49-53-Months.json';
import tableB27 from '@data/json/Table-B27-Raw-Scores-to-Standard-Scores-Age-54-59-Months.json';
import tableB28 from '@data/json/Table-B28-Raw-Scores-to-Standard-Scores-Age-60-65-Months.json';
import tableB29 from '@data/json/Table-B29-Raw-Scores-to-Standard-Scores-Age-66-71-Months.json';

// Table C1: Standard Scores to Percentile Ranks
import tableC1 from '@data/json/Table-C1-Standard-Scores-to-Percentile-Ranks.json';

// Table D1: Sums to Domain Standard Scores
import tableD1 from '@data/json/Table-D1-Sums-of-Subdomain-Standard-Scores-to-Domain-Standard-Scores.json';

// Type assertions (JSON imports don't preserve our types)
export const A1 = tableA1 as AgeEquivalentsTableJson;
export const C1 = tableC1 as C1TableJson;
export const D1 = tableD1 as D1TableJson;

// B tables indexed by table ID
export const BTables: Record<BTableId, RawToStandardTableJson> = {
  B13: tableB13 as RawToStandardTableJson,
  B14: tableB14 as RawToStandardTableJson,
  B15: tableB15 as RawToStandardTableJson,
  B16: tableB16 as RawToStandardTableJson,
  B17: tableB17 as RawToStandardTableJson,
  B18: tableB18 as RawToStandardTableJson,
  B19: tableB19 as RawToStandardTableJson,
  B20: tableB20 as RawToStandardTableJson,
  B21: tableB21 as RawToStandardTableJson,
  B22: tableB22 as RawToStandardTableJson,
  B23: tableB23 as RawToStandardTableJson,
  B24: tableB24 as RawToStandardTableJson,
  B25: tableB25 as RawToStandardTableJson,
  B26: tableB26 as RawToStandardTableJson,
  B27: tableB27 as RawToStandardTableJson,
  B28: tableB28 as RawToStandardTableJson,
  B29: tableB29 as RawToStandardTableJson,
};

// Array of all B tables for iteration
export const BTablesList = Object.values(BTables);

// Get B table by age in months
export const getBTableForAge = (ageMonths: number): RawToStandardTableJson | null => {
  for (const table of BTablesList) {
    const { minMonths, maxMonths } = table.source.ageBand;
    if (ageMonths >= minMonths && ageMonths <= maxMonths) {
      return table;
    }
  }
  return null;
};

// Re-export context utilities
export {
  type LookupContext,
  createLookupContext,
  createTestLookupContext,
} from './context';
