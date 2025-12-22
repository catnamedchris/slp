import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { generateDAYC2Workbook } from './generateWorkbook';

const JSON_DIR = path.join(__dirname, '..', '..', 'data', 'json');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'output', 'DAYC2-Score-Calculator-Test.xlsx');

// Helper to find a row in sheet data by key column
const findRow = <T>(data: T[], keyCol: keyof T, keyVal: unknown): T | undefined =>
  data.find(r => r[keyCol] === keyVal);

describe('generateDAYC2Workbook', () => {
  let wb: XLSX.WorkBook;

  beforeAll(() => {
    generateDAYC2Workbook(JSON_DIR, OUTPUT_PATH);
    wb = XLSX.readFile(OUTPUT_PATH);
  });

  afterAll(() => {
    if (fs.existsSync(OUTPUT_PATH)) {
      fs.unlinkSync(OUTPUT_PATH);
    }
  });

  describe('workbook structure', () => {
    it('creates all 8 required sheets', () => {
      expect(wb.SheetNames).toEqual([
        'Calculator',
        'AgeBands',
        'RawScoreToStandardScore',
        'StandardScoreToPercentile',
        'RawScoreToAgeEquivalent',
        'SumToCompositeScore',
        'StandardScoreToRawScore',
        'PercentileToStandardScore',
      ]);
    });
  });

  describe('AgeBands sheet', () => {
    interface AgeBandRow {
      Idx: number;
      Label: string;
      MinMonths: number;
      MaxMonths: number;
    }

    it('has 17 age bands plus header', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(data.length).toBe(17);
    });

    it('has correct first age band (B13: 12-13 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      expect(sheet['B2']?.v).toBe('12-13 Months');
      expect(sheet['C2']?.v).toBe(12);
      expect(sheet['D2']?.v).toBe(13);
    });

    it('has correct last age band (B29: 66-71 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      expect(sheet['B18']?.v).toBe('66-71 Months');
      expect(sheet['C18']?.v).toBe(66);
      expect(sheet['D18']?.v).toBe(71);
    });

    it('has MinMonths in ascending order for MATCH lookup', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      for (let i = 1; i < data.length; i++) {
        expect(data[i].MinMonths).toBeGreaterThan(data[i - 1].MinMonths);
      }
    });

    it('covers continuous age range 12-71 months with no gaps', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      
      // First band starts at 12
      expect(data[0].MinMonths).toBe(12);
      
      // Last band ends at 71
      expect(data[data.length - 1].MaxMonths).toBe(71);
      
      // Each band's min should be previous band's max + 1
      for (let i = 1; i < data.length; i++) {
        expect(data[i].MinMonths).toBe(data[i - 1].MaxMonths + 1);
      }
    });
  });

  describe('Age calculation validation', () => {
    interface AgeBandRow {
      Idx: number;
      Label: string;
      MinMonths: number;
      MaxMonths: number;
    }

    // Simulate the MATCH(..., 1) formula behavior (find largest value <= search value)
    const findAgeBandIdx = (ageMonths: number, bands: AgeBandRow[]): number | null => {
      let result: number | null = null;
      for (const band of bands) {
        if (band.MinMonths <= ageMonths) {
          result = band.Idx;
        }
      }
      return result;
    };

    it('age 12 months maps to band 1 (B13: 12-13 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(12, data)).toBe(1);
    });

    it('age 13 months maps to band 1 (B13: 12-13 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(13, data)).toBe(1);
    });

    it('age 14 months maps to band 2 (B14: 14-15 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(14, data)).toBe(2);
    });

    it('age 24 months maps to band 5 (B17: 22-24 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(24, data)).toBe(5);
    });

    it('age 36 months (3 years) maps to band 9 (B21: 34-36 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(36, data)).toBe(9);
    });

    it('age 48 months (4 years) maps to band 13 (B25: 46-48 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(48, data)).toBe(13);
    });

    it('age 60 months (5 years) maps to band 15 (B27: 55-60 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(60, data)).toBe(15);
    });

    it('age 71 months maps to band 17 (B29: 66-71 months)', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(71, data)).toBe(17);
    });

    it('age 11 months (below range) returns null', () => {
      const sheet = wb.Sheets['AgeBands'];
      const data = XLSX.utils.sheet_to_json<AgeBandRow>(sheet);
      expect(findAgeBandIdx(11, data)).toBeNull();
    });
  });

  describe('RawScoreToStandardScore sheet', () => {
    it('has composite key format (AgeBandIdx * 1000 + RawScore)', () => {
      const sheet = wb.Sheets['RawScoreToStandardScore'];
      // First data row: band 1, raw 0 → key 1000
      expect(sheet['A2']?.v).toBe(1000);
      // Band 1, raw 5 → key 1005
      expect(sheet['A7']?.v).toBe(1005);
    });

    it('has both numeric and display columns for standard scores', () => {
      const sheet = wb.Sheets['RawScoreToStandardScore'];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
      const headers = rows[0] as string[];
      expect(headers).toContain('COG_SS');
      expect(headers).toContain('COG_Disp');
      expect(headers).toContain('AB_SS');
      expect(headers).toContain('AB_Disp');
    });

    it('formats bounded values with < and > symbols in display columns', () => {
      const sheet = wb.Sheets['RawScoreToStandardScore'];
      // B13 raw=0 has many <50 values
      const cogDisp = sheet['K2']?.v;
      expect(cogDisp).toBe('<50');
    });
  });

  describe('StandardScoreToPercentile sheet', () => {
    it('is sorted by standard score ascending', () => {
      const sheet = wb.Sheets['StandardScoreToPercentile'];
      const data = XLSX.utils.sheet_to_json<{ StandardScore: number }>(sheet);
      for (let i = 1; i < data.length; i++) {
        expect(data[i].StandardScore).toBeGreaterThanOrEqual(data[i - 1].StandardScore);
      }
    });

    it('has percentile display column with bounded values', () => {
      const sheet = wb.Sheets['StandardScoreToPercentile'];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
      const headers = rows[0] as string[];
      expect(headers).toContain('PercDisplay');
    });
  });

  describe('RawScoreToAgeEquivalent sheet', () => {
    it('has key format SUBTEST_RAWSCORE', () => {
      const sheet = wb.Sheets['RawScoreToAgeEquivalent'];
      const data = XLSX.utils.sheet_to_json<{ Key: string }>(sheet);
      const cogKeys = data.filter(r => r.Key.startsWith('COG_'));
      expect(cogKeys.length).toBeGreaterThan(0);
      expect(cogKeys[0].Key).toMatch(/^COG_\d+$/);
    });

    it('covers all 7 subtests', () => {
      const sheet = wb.Sheets['RawScoreToAgeEquivalent'];
      const data = XLSX.utils.sheet_to_json<{ Subtest: string }>(sheet);
      const subtests = new Set(data.map(r => r.Subtest));
      expect(subtests).toEqual(new Set(['COG', 'RL', 'EL', 'SE', 'GM', 'FM', 'AB']));
    });
  });

  describe('SumToCompositeScore sheet', () => {
    it('is sorted by SumOfSS ascending', () => {
      const sheet = wb.Sheets['SumToCompositeScore'];
      const data = XLSX.utils.sheet_to_json<{ SumOfSS: number }>(sheet);
      for (let i = 1; i < data.length; i++) {
        expect(data[i].SumOfSS).toBeGreaterThanOrEqual(data[i - 1].SumOfSS);
      }
    });
  });

  describe('StandardScoreToRawScore sheet (reverse lookup)', () => {
    it('has composite key format (AgeBandIdx * 1000 + StandardScore)', () => {
      const sheet = wb.Sheets['StandardScoreToRawScore'];
      // First data row: band 1, SS 40 → key 1040
      expect(sheet['A2']?.v).toBe(1040);
    });

    it('has raw score columns for all 7 subtests', () => {
      const sheet = wb.Sheets['StandardScoreToRawScore'];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
      const headers = rows[0] as string[];
      expect(headers).toContain('COG_Raw');
      expect(headers).toContain('RL_Raw');
      expect(headers).toContain('EL_Raw');
      expect(headers).toContain('SE_Raw');
      expect(headers).toContain('GM_Raw');
      expect(headers).toContain('FM_Raw');
      expect(headers).toContain('AB_Raw');
    });
  });

  describe('PercentileToStandardScore sheet', () => {
    it('is sorted by percentile ascending', () => {
      const sheet = wb.Sheets['PercentileToStandardScore'];
      const data = XLSX.utils.sheet_to_json<{ Percentile: number }>(sheet);
      for (let i = 1; i < data.length; i++) {
        expect(data[i].Percentile).toBeGreaterThanOrEqual(data[i - 1].Percentile);
      }
    });
  });

  // === SCORE CONVERSION VALIDATION ===
  // These tests verify actual data values against the source JSON

  describe('RawScoreToStandardScore data validation', () => {
    interface RawToSSRow {
      Key: number;
      AgeBandIdx: number;
      RawScore: number;
      COG_SS: number | null;
      RL_SS: number | null;
      EL_SS: number | null;
      COG_Disp: string;
    }

    it('B13 (age 12-13 months) raw=5 COG=50 (from JSON)', () => {
      // Source: Table-B13 row with rawScore=5, cognitive={value:50}
      const sheet = wb.Sheets['RawScoreToStandardScore'];
      const data = XLSX.utils.sheet_to_json<RawToSSRow>(sheet);
      const row = findRow(data, 'Key', 1005); // AgeBand 1, Raw 5
      expect(row).toBeDefined();
      expect(row?.COG_SS).toBe(50);
      expect(row?.COG_Disp).toBe('50');
    });

    it('B13 raw=0 shows bounded values as <50', () => {
      // Source: Table-B13 row with rawScore=0, cognitive={bound:"lt",value:50}
      const sheet = wb.Sheets['RawScoreToStandardScore'];
      const data = XLSX.utils.sheet_to_json<RawToSSRow>(sheet);
      const row = findRow(data, 'Key', 1000); // AgeBand 1, Raw 0
      expect(row?.COG_SS).toBe(50); // Numeric value for lookups
      expect(row?.COG_Disp).toBe('<50'); // Display shows bound
    });

    it('B13 raw=6 EL=71 (from JSON expressiveLanguage)', () => {
      // Source: Table-B13 row with rawScore=6, expressiveLanguage={value:71}
      const sheet = wb.Sheets['RawScoreToStandardScore'];
      const data = XLSX.utils.sheet_to_json<RawToSSRow>(sheet);
      const row = findRow(data, 'Key', 1006);
      expect(row?.EL_SS).toBe(71);
    });

    it('B29 (age 66-71 months) has correct age band index 17', () => {
      const sheet = wb.Sheets['RawScoreToStandardScore'];
      const data = XLSX.utils.sheet_to_json<RawToSSRow>(sheet);
      // Key for B29, raw 0 = 17*1000 + 0 = 17000
      const row = findRow(data, 'Key', 17000);
      expect(row).toBeDefined();
      expect(row?.AgeBandIdx).toBe(17);
    });
  });

  describe('StandardScoreToPercentile data validation', () => {
    interface SSToPercRow {
      StandardScore: number;
      Percentile: number;
      PercDisplay: string;
    }

    it('SS=100 maps to percentile 50 (from C1)', () => {
      // Source: Table-C1 standardScore=100 → percentileRank=50
      const sheet = wb.Sheets['StandardScoreToPercentile'];
      const data = XLSX.utils.sheet_to_json<SSToPercRow>(sheet);
      const row = findRow(data, 'StandardScore', 100);
      expect(row?.Percentile).toBe(50);
    });

    it('SS=85 maps to percentile 16 (from C1)', () => {
      const sheet = wb.Sheets['StandardScoreToPercentile'];
      const data = XLSX.utils.sheet_to_json<SSToPercRow>(sheet);
      const row = findRow(data, 'StandardScore', 85);
      expect(row?.Percentile).toBe(16);
    });

    it('SS=115 maps to percentile 84 (from C1)', () => {
      const sheet = wb.Sheets['StandardScoreToPercentile'];
      const data = XLSX.utils.sheet_to_json<SSToPercRow>(sheet);
      const row = findRow(data, 'StandardScore', 115);
      expect(row?.Percentile).toBe(84);
    });

    it('high SS shows >99.9 display for bounded percentiles', () => {
      const sheet = wb.Sheets['StandardScoreToPercentile'];
      const data = XLSX.utils.sheet_to_json<SSToPercRow>(sheet);
      const row = findRow(data, 'StandardScore', 150);
      expect(row?.PercDisplay).toBe('>99.9');
    });
  });

  describe('SumToCompositeScore data validation', () => {
    interface SumToCompRow {
      SumOfSS: number;
      CompositeStandardScore: number;
    }

    it('sum=200 maps to composite SS=100 (from D1)', () => {
      // Standard scores sum at mean = 100+100 = 200 → composite 100
      const sheet = wb.Sheets['SumToCompositeScore'];
      const data = XLSX.utils.sheet_to_json<SumToCompRow>(sheet);
      const row = findRow(data, 'SumOfSS', 200);
      expect(row?.CompositeStandardScore).toBe(100);
    });
  });

  describe('RawScoreToAgeEquivalent data validation', () => {
    interface RawToAERow {
      Key: string;
      Subtest: string;
      RawScore: number;
      AgeEquiv: string;
      AgeEquivNum: number;
    }

    it('COG raw=9 maps to age 3 months (from A1)', () => {
      // Source: Table-A1 ageMonths=3, cognitive={value:9}
      const sheet = wb.Sheets['RawScoreToAgeEquivalent'];
      const data = XLSX.utils.sheet_to_json<RawToAERow>(sheet);
      const row = findRow(data, 'Key', 'COG_9');
      expect(row?.AgeEquivNum).toBe(3);
    });
  });

  describe('StandardScoreToRawScore reverse lookup validation', () => {
    interface SSToRawRow {
      Key: number;
      AgeBandIdx: number;
      StandardScore: number;
      COG_Raw: number | string;
    }

    it('B13 SS=51 requires COG raw=6 (first raw achieving SS>=51)', () => {
      // In B13, cognitive first reaches 51 at rawScore=6 (raw 0-4 are <50, raw 5 is exactly 50)
      const sheet = wb.Sheets['StandardScoreToRawScore'];
      const data = XLSX.utils.sheet_to_json<SSToRawRow>(sheet);
      const row = findRow(data, 'Key', 1051); // AgeBand 1, SS 51
      expect(row?.COG_Raw).toBe(6);
    });

    it('B13 SS=55 requires COG raw=9 (from JSON)', () => {
      // Source: Table-B13 rawScore=9 has cognitive={value:55}
      const sheet = wb.Sheets['StandardScoreToRawScore'];
      const data = XLSX.utils.sheet_to_json<SSToRawRow>(sheet);
      const row = findRow(data, 'Key', 1055); // AgeBand 1, SS 55
      expect(row?.COG_Raw).toBe(9);
    });
  });

  describe('Calculator sheet formulas', () => {
    // Row numbers for current layout
    const ROW = {
      DOB: 5,
      TEST_DATE: 6,
      AGE_DISPLAY: 9,
      TOTAL_AGE: 10,
      AGE_BAND: 11,
      AGE_BAND_IDX: 12,
      RESULT_COG: 25,
      DOMAIN_COMM: 35,
      TARGET_SS: 40,
      REVERSE_COG: 44,
    };

    it('has age display formula using DATEDIF', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`B${ROW.AGE_DISPLAY}`]?.f).toContain('DATEDIF');
      expect(sheet[`B${ROW.AGE_DISPLAY}`]?.f).toContain(`B${ROW.DOB}`);
      expect(sheet[`B${ROW.AGE_DISPLAY}`]?.f).toContain(`B${ROW.TEST_DATE}`);
    });

    it('has total age formula using DATEDIF for months', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`B${ROW.TOTAL_AGE}`]?.f).toContain('DATEDIF');
      expect(sheet[`B${ROW.TOTAL_AGE}`]?.f).toContain('"M"');
    });

    it('has age band lookup formula', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`B${ROW.AGE_BAND}`]?.f).toContain('INDEX(AgeBands!B2:B100');
      expect(sheet[`B${ROW.AGE_BAND}`]?.f).toContain(`MATCH(B${ROW.TOTAL_AGE},AgeBands!C2:C100`);
    });

    it('has age band index formula', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`B${ROW.AGE_BAND_IDX}`]?.f).toContain(`MATCH(B${ROW.TOTAL_AGE},AgeBands!C2:C100`);
    });

    it('has standard score lookup formula for Cognitive', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`C${ROW.RESULT_COG}`]?.f).toContain(`VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+B${ROW.RESULT_COG},'RawScoreToStandardScore'!`);
    });

    it('has percentile lookup formula for Cognitive', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`D${ROW.RESULT_COG}`]?.f).toContain("'StandardScoreToPercentile'!");
    });

    it('has age equivalent lookup formula for Cognitive', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`E${ROW.RESULT_COG}`]?.f).toContain(`VLOOKUP("COG_"&B${ROW.RESULT_COG},'RawScoreToAgeEquivalent'!`);
    });

    it('has domain composite formulas for Communication', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet[`B${ROW.DOMAIN_COMM}`]?.f).toContain("'RawScoreToStandardScore'!");
      expect(sheet[`C${ROW.DOMAIN_COMM}`]?.f).toContain("'SumToCompositeScore'!");
      expect(sheet[`D${ROW.DOMAIN_COMM}`]?.f).toContain("'StandardScoreToPercentile'!");
    });

    it('has reverse lookup formulas', () => {
      const sheet = wb.Sheets['Calculator'];
      // Target SS from percentile
      expect(sheet[`B${ROW.TARGET_SS}`]?.f).toContain("'PercentileToStandardScore'!");
      // Raw score needed for COG
      expect(sheet[`B${ROW.REVERSE_COG}`]?.f).toContain("'StandardScoreToRawScore'!");
    });

    it('has merged cells for section headers', () => {
      const sheet = wb.Sheets['Calculator'];
      expect(sheet['!merges']).toBeDefined();
      expect(sheet['!merges']?.length).toBeGreaterThan(0);
    });
  });
});
