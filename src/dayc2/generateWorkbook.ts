import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import {
  RawToStandardTableJson,
  AgeEquivalentsTableJson,
  C1TableJson,
  D1TableJson,
  ParsedNumeric,
  BTableId,
  AgeBand,
} from './types';

// === Type Guards ===

const isExact = (v: ParsedNumeric): v is { value: number } =>
  'value' in v && !('bound' in v) && !('min' in v);

const isBounded = (v: ParsedNumeric): v is { bound: 'lt' | 'gt'; value: number } =>
  'bound' in v && 'value' in v;

const isRange = (v: ParsedNumeric): v is { min: number; max: number } =>
  'min' in v && 'max' in v;

// === Formatting Helpers ===

const formatValue = (v: ParsedNumeric | null): string => {
  if (v === null) return '';
  if (isBounded(v)) return v.bound === 'lt' ? `<${v.value}` : `>${v.value}`;
  if (isRange(v)) return `${v.min}-${v.max}`;
  return String(v.value);
};

const getNumericValue = (v: ParsedNumeric | null): number | null => {
  if (v === null) return null;
  if (isBounded(v) || isExact(v)) return v.value;
  if (isRange(v)) return v.min; // Use min for lookup
  return null;
};

// === Age Band Configuration ===

const B_TABLE_IDS: BTableId[] = [
  'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19',
  'B20', 'B21', 'B22', 'B23', 'B24', 'B25', 'B26',
  'B27', 'B28', 'B29',
];

const SUBTESTS = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
] as const;

type Subtest = typeof SUBTESTS[number];

// === Data Loading ===

const loadJson = <T>(filePath: string): T => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
};

const loadAllBTables = (jsonDir: string): RawToStandardTableJson[] => {
  const tables: RawToStandardTableJson[] = [];
  for (const tableId of B_TABLE_IDS) {
    const files = fs.readdirSync(jsonDir).filter(f => f.includes(tableId));
    if (files.length > 0) {
      tables.push(loadJson<RawToStandardTableJson>(path.join(jsonDir, files[0])));
    }
  }
  return tables;
};

// === Sheet Builders ===

interface AgeBandRow {
  idx: number;
  label: string;
  minMonths: number;
  maxMonths: number;
}

const buildAgeBandsSheet = (bTables: RawToStandardTableJson[]): unknown[][] => {
  const sheet: unknown[][] = [['Idx', 'Label', 'MinMonths', 'MaxMonths']];
  bTables.forEach((table, idx) => {
    const band = table.source.ageBand;
    sheet.push([idx + 1, band.label, band.minMonths, band.maxMonths]);
  });
  return sheet;
};

const buildRawToStandardSheet = (bTables: RawToStandardTableJson[]): unknown[][] => {
  // Key = AgeBandIdx * 1000 + RawScore for VLOOKUP
  // Columns: Key, AgeBandIdx, RawScore, then SS for each subtest, then Display versions
  // For null values, carry forward the last valid value (for raw scores beyond the table's range)
  const headers = [
    'Key', 'AgeBandIdx', 'RawScore',
    'COG_SS', 'RL_SS', 'EL_SS', 'SE_SS', 'GM_SS', 'FM_SS', 'AB_SS',
    'COG_Disp', 'RL_Disp', 'EL_Disp', 'SE_Disp', 'GM_Disp', 'FM_Disp', 'AB_Disp',
  ];
  const sheet: unknown[][] = [headers];

  bTables.forEach((table, bandIdx) => {
    const ageBandIdx = bandIdx + 1;
    
    // Track last valid values for each subtest to carry forward
    const lastValid: Record<string, { num: number | null; disp: string }> = {
      cognitive: { num: null, disp: '' },
      receptiveLanguage: { num: null, disp: '' },
      expressiveLanguage: { num: null, disp: '' },
      socialEmotional: { num: null, disp: '' },
      grossMotor: { num: null, disp: '' },
      fineMotor: { num: null, disp: '' },
      adaptiveBehavior: { num: null, disp: '' },
    };
    
    for (const row of table.rows) {
      const key = ageBandIdx * 1000 + row.rawScore;
      
      // Update last valid values and get current values (with carry-forward)
      const subtests: (keyof typeof lastValid)[] = [
        'cognitive', 'receptiveLanguage', 'expressiveLanguage', 
        'socialEmotional', 'grossMotor', 'fineMotor', 'adaptiveBehavior'
      ];
      
      const numValues: (number | null)[] = [];
      const dispValues: string[] = [];
      
      for (const subtest of subtests) {
        const val = row[subtest as keyof typeof row] as ParsedNumeric | null;
        const numVal = getNumericValue(val);
        const dispVal = formatValue(val);
        
        if (numVal !== null) {
          // Update last valid
          lastValid[subtest] = { num: numVal, disp: dispVal };
          numValues.push(numVal);
          dispValues.push(dispVal);
        } else {
          // Carry forward last valid value
          numValues.push(lastValid[subtest].num);
          dispValues.push(lastValid[subtest].disp);
        }
      }
      
      sheet.push([
        key,
        ageBandIdx,
        row.rawScore,
        ...numValues,
        ...dispValues,
      ]);
    }
  });
  return sheet;
};

const buildSSToPercentileSheet = (c1: C1TableJson): unknown[][] => {
  // Flatten the 3-column pairs into single SS → Percentile mapping
  // Columns: StandardScore, Percentile, PercDisplay
  const sheet: unknown[][] = [['StandardScore', 'Percentile', 'PercDisplay']];
  const entries: { ss: number; perc: number; display: string }[] = [];

  for (const row of c1.rows) {
    const pairs = [
      { ss: row.standardScore1, perc: row.percentileRank1 },
      { ss: row.standardScore2, perc: row.percentileRank2 },
      { ss: row.standardScore3, perc: row.percentileRank3 },
    ];
    for (const { ss, perc } of pairs) {
      if (ss !== null && perc !== null) {
        const ssNum = getNumericValue(ss);
        const percNum = getNumericValue(perc);
        if (ssNum !== null && percNum !== null) {
          entries.push({ ss: ssNum, perc: percNum, display: formatValue(perc) });
        }
      }
    }
  }

  // Sort by SS descending for VLOOKUP with TRUE (approximate match)
  entries.sort((a, b) => a.ss - b.ss);
  for (const e of entries) {
    sheet.push([e.ss, e.perc, e.display]);
  }
  return sheet;
};

const buildRawToAgeEquivSheet = (a1: AgeEquivalentsTableJson): unknown[][] => {
  // Invert A1: for each subtest, map rawScore ranges to ageMonths
  // Key format: "SUBTEST_RAWSCORE" for text-based VLOOKUP
  const sheet: unknown[][] = [['Key', 'Subtest', 'RawScore', 'AgeEquiv', 'AgeEquivNum']];

  const subtestKeys: { key: Subtest; prefix: string }[] = [
    { key: 'cognitive', prefix: 'COG' },
    { key: 'receptiveLanguage', prefix: 'RL' },
    { key: 'expressiveLanguage', prefix: 'EL' },
    { key: 'socialEmotional', prefix: 'SE' },
    { key: 'grossMotor', prefix: 'GM' },
    { key: 'fineMotor', prefix: 'FM' },
    { key: 'adaptiveBehavior', prefix: 'AB' },
  ];

  // Build reverse lookup: for each rawScore, find the ageMonths
  // A1 gives ageMonths → rawScore ranges, we need rawScore → ageMonths
  const rawToAge: Record<string, { raw: number; ageMonths: number; ageDisplay: string }[]> = {};
  for (const sk of subtestKeys) {
    rawToAge[sk.prefix] = [];
  }

  for (const row of a1.rows) {
    const ageNum = getNumericValue(row.ageMonths);
    if (ageNum === null) continue;

    const ageDisplay = isBounded(row.ageMonths)
      ? formatValue(row.ageMonths)
      : String(row.ageMonths.value);

    for (const sk of subtestKeys) {
      const scoreVal = row[sk.key];
      if (scoreVal === null) continue;

      if (isRange(scoreVal)) {
        // Map each raw score in range to this age
        for (let raw = scoreVal.min; raw <= scoreVal.max; raw++) {
          rawToAge[sk.prefix].push({ raw, ageMonths: ageNum, ageDisplay });
        }
      } else if (isExact(scoreVal)) {
        rawToAge[sk.prefix].push({ raw: scoreVal.value, ageMonths: ageNum, ageDisplay });
      }
    }
  }

  // Output sorted by subtest then raw score, filling gaps with last known value
  for (const sk of subtestKeys) {
    const entries = rawToAge[sk.prefix];
    // Sort by raw score
    entries.sort((a, b) => a.raw - b.raw);
    
    // Build map from raw score to age (first occurrence = lowest age for that raw)
    const rawToAgeMap = new Map<number, { ageMonths: number; ageDisplay: string }>();
    for (const e of entries) {
      if (!rawToAgeMap.has(e.raw)) {
        rawToAgeMap.set(e.raw, { ageMonths: e.ageMonths, ageDisplay: e.ageDisplay });
      }
    }
    
    // Find min and max raw scores
    const rawScores = Array.from(rawToAgeMap.keys()).sort((a, b) => a - b);
    if (rawScores.length === 0) continue;
    
    const minRaw = rawScores[0];
    const maxRaw = Math.max(rawScores[rawScores.length - 1], 150); // Extend to 150
    
    // Output all raw scores from min to max, carrying forward last known value
    let lastAge: { ageMonths: number; ageDisplay: string } | null = null;
    for (let raw = minRaw; raw <= maxRaw; raw++) {
      const age = rawToAgeMap.get(raw);
      if (age) {
        lastAge = age;
      }
      if (lastAge) {
        sheet.push([`${sk.prefix}_${raw}`, sk.prefix, raw, lastAge.ageDisplay, lastAge.ageMonths]);
      }
    }
  }

  return sheet;
};

const buildSumToCompositeSheet = (d1: D1TableJson): unknown[][] => {
  // Flatten D1: SumOfSS → CompositeStandardScore
  const sheet: unknown[][] = [['SumOfSS', 'CompositeStandardScore']];
  const entries: { sum: number; ss: number }[] = [];

  for (const row of d1.rows) {
    const pairs = [
      { sum: row.sumRange1, ss: row.standardScore1 },
      { sum: row.sumRange2, ss: row.standardScore2 },
      { sum: row.sumRange3, ss: row.standardScore3 },
    ];
    for (const { sum, ss } of pairs) {
      if (sum !== null && ss !== null) {
        const ssNum = getNumericValue(ss);
        if (ssNum === null) continue;

        if (isRange(sum)) {
          // Map min of range for lookup
          entries.push({ sum: sum.min, ss: ssNum });
        } else if (isExact(sum)) {
          entries.push({ sum: sum.value, ss: ssNum });
        }
      }
    }
  }

  entries.sort((a, b) => a.sum - b.sum);
  for (const e of entries) {
    sheet.push([e.sum, e.ss]);
  }
  return sheet;
};

const buildSSToRawSheet = (bTables: RawToStandardTableJson[]): unknown[][] => {
  // Reverse lookup: for a given AgeBand + StandardScore, find min raw score
  // Key = AgeBandIdx * 1000 + StandardScore
  const headers = [
    'Key', 'AgeBandIdx', 'StandardScore',
    'COG_Raw', 'RL_Raw', 'EL_Raw', 'SE_Raw', 'GM_Raw', 'FM_Raw', 'AB_Raw',
  ];
  const sheet: unknown[][] = [headers];

  bTables.forEach((table, bandIdx) => {
    const ageBandIdx = bandIdx + 1;

    // For each standard score 40-150, find min raw score per subtest
    for (let ss = 40; ss <= 150; ss++) {
      const key = ageBandIdx * 1000 + ss;
      const minRaws: (number | string)[] = [];

      for (const subtest of SUBTESTS) {
        let minRaw: number | null = null;
        for (const row of table.rows) {
          const subtestVal = row[subtest];
          const ssVal = getNumericValue(subtestVal);
          if (ssVal !== null && ssVal >= ss && (minRaw === null || row.rawScore < minRaw)) {
            minRaw = row.rawScore;
          }
        }
        minRaws.push(minRaw !== null ? minRaw : '>MAX');
      }

      sheet.push([key, ageBandIdx, ss, ...minRaws]);
    }
  });

  return sheet;
};

const buildPercToSSSheet = (c1: C1TableJson): unknown[][] => {
  // Reverse: Percentile → StandardScore
  const sheet: unknown[][] = [['Percentile', 'StandardScore']];
  const entries: { perc: number; ss: number }[] = [];

  for (const row of c1.rows) {
    const pairs = [
      { ss: row.standardScore1, perc: row.percentileRank1 },
      { ss: row.standardScore2, perc: row.percentileRank2 },
      { ss: row.standardScore3, perc: row.percentileRank3 },
    ];
    for (const { ss, perc } of pairs) {
      if (ss !== null && perc !== null) {
        const ssNum = getNumericValue(ss);
        const percNum = getNumericValue(perc);
        if (ssNum !== null && percNum !== null) {
          entries.push({ ss: ssNum, perc: percNum });
        }
      }
    }
  }

  entries.sort((a, b) => a.perc - b.perc);
  for (const e of entries) {
    sheet.push([e.perc, e.ss]);
  }
  return sheet;
};

// === Calculator Sheet ===

const buildCalculatorSheet = (): { data: unknown[][]; formulas: Record<string, { t: string; f: string }>; merges: XLSX.Range[] } => {
  const data: unknown[][] = [
    ['DAYC-2 Score Calculator', '', '', '', ''],
    [''],
    ['CHILD INFORMATION', '', '', '', ''],
    ['Child Name:', '', '', '', ''],
    ['Date of Birth:', '', '← Enter date (e.g., 1/15/2022)', '', ''],
    ['Test Date:', '', '← Enter date (e.g., 12/20/2024)', '', ''],
    [''],
    ['AGE CALCULATION', '', '', '', ''],
    ['Age (Years-Months):', '', '← Auto-calculated from dates', '', ''],
    ['Total Age (Months):', '', '← Auto-calculated', '', ''],
    ['Age Band:', '', '← Auto-determined', '', ''],
    ['Age Band Index:', '', '(Used for lookups)', '', ''],
    [''],
    ['RAW SCORES', 'Enter →', '', '', ''],
    ['Cognitive (COG):', '', '', '', ''],
    ['Receptive Language (RL):', '', '', '', ''],
    ['Expressive Language (EL):', '', '', '', ''],
    ['Social-Emotional (SE):', '', '', '', ''],
    ['Gross Motor (GM):', '', '', '', ''],
    ['Fine Motor (FM):', '', '', '', ''],
    ['Adaptive Behavior (AB):', '', '', '', ''],
    [''],
    ['SUBTEST RESULTS', '', '', '', ''],
    ['Subtest', 'Raw', 'Standard Score', 'Percentile', 'Age Equiv'],
    ['Cognitive', '', '', '', ''],
    ['Receptive Language', '', '', '', ''],
    ['Expressive Language', '', '', '', ''],
    ['Social-Emotional', '', '', '', ''],
    ['Gross Motor', '', '', '', ''],
    ['Fine Motor', '', '', '', ''],
    ['Adaptive Behavior', '', '', '', ''],
    [''],
    ['DOMAIN COMPOSITES', '', '', '', ''],
    ['Domain', 'Sum of SS', 'Standard Score', 'Percentile', ''],
    ['Communication (RL+EL)', '', '', '', ''],
    ['Physical Development (GM+FM)', '', '', '', ''],
    [''],
    ['REVERSE LOOKUP', '', '', '', ''],
    ['Target Percentile:', '', '← Enter percentile (e.g., 16)', '', ''],
    ['Corresponding Standard Score:', '', '← Auto-calculated', '', ''],
    [''],
    ['Raw Score Needed:', '', '', '', ''],
    ['Subtest', 'Raw Score Needed', '', '', ''],
    ['Cognitive', '', '', '', ''],
    ['Receptive Language', '', '', '', ''],
    ['Expressive Language', '', '', '', ''],
    ['Social-Emotional', '', '', '', ''],
    ['Gross Motor', '', '', '', ''],
    ['Fine Motor', '', '', '', ''],
    ['Adaptive Behavior', '', '', '', ''],
  ];

  // Define merge ranges for section headers
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },  // Title row
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },  // CHILD INFORMATION
    { s: { r: 7, c: 0 }, e: { r: 7, c: 4 } },  // AGE CALCULATION
    { s: { r: 13, c: 0 }, e: { r: 13, c: 4 } }, // RAW SCORES
    { s: { r: 22, c: 0 }, e: { r: 22, c: 4 } }, // SUBTEST RESULTS
    { s: { r: 32, c: 0 }, e: { r: 32, c: 4 } }, // DOMAIN COMPOSITES
    { s: { r: 37, c: 0 }, e: { r: 37, c: 4 } }, // REVERSE LOOKUP
  ];

  // Row numbers (1-indexed for Excel)
  const ROW = {
    DOB: 5,
    TEST_DATE: 6,
    AGE_DISPLAY: 9,
    TOTAL_AGE: 10,
    AGE_BAND: 11,
    AGE_BAND_IDX: 12,
    RAW_COG: 15,
    RAW_RL: 16,
    RAW_EL: 17,
    RAW_SE: 18,
    RAW_GM: 19,
    RAW_FM: 20,
    RAW_AB: 21,
    RESULT_COG: 25,
    RESULT_RL: 26,
    RESULT_EL: 27,
    RESULT_SE: 28,
    RESULT_GM: 29,
    RESULT_FM: 30,
    RESULT_AB: 31,
    DOMAIN_COMM: 35,
    DOMAIN_PHYS: 36,
    TARGET_PERC: 39,
    TARGET_SS: 40,
    REVERSE_COG: 44,
    REVERSE_RL: 45,
    REVERSE_EL: 46,
    REVERSE_SE: 47,
    REVERSE_GM: 48,
    REVERSE_FM: 49,
    REVERSE_AB: 50,
  };

  const formulas: Record<string, { t: string; f: string }> = {};

  // Age display (years-months format like "2-6" for 2 years 6 months)
  formulas[`B${ROW.AGE_DISPLAY}`] = {
    t: 's',
    f: `IFERROR(DATEDIF(B${ROW.DOB},B${ROW.TEST_DATE},"Y")&"-"&DATEDIF(B${ROW.DOB},B${ROW.TEST_DATE},"YM"),"")`,
  };

  // Total age in months (using DATEDIF)
  formulas[`B${ROW.TOTAL_AGE}`] = {
    t: 'n',
    f: `IFERROR(DATEDIF(B${ROW.DOB},B${ROW.TEST_DATE},"M"),"")`,
  };

  // Age band lookup using MATCH to find the correct band by minMonths
  // Use C2:C100 to skip header row, so MATCH returns 1-17 directly
  formulas[`B${ROW.AGE_BAND}`] = {
    t: 's',
    f: `IFERROR(INDEX(AgeBands!B2:B100,MATCH(B${ROW.TOTAL_AGE},AgeBands!C2:C100,1)),"Enter dates")`,
  };

  // Age band index (1-17 for the 17 age bands)
  formulas[`B${ROW.AGE_BAND_IDX}`] = {
    t: 'n',
    f: `IFERROR(MATCH(B${ROW.TOTAL_AGE},AgeBands!C2:C100,1),0)`,
  };

  // Sheet name constants for formula references
  const SHEETS = {
    RAW_TO_STANDARD: 'RawScoreToStandardScore',
    SS_TO_PERCENTILE: 'StandardScoreToPercentile',
    RAW_TO_AGE_EQUIV: 'RawScoreToAgeEquivalent',
    SUM_TO_COMPOSITE: 'SumToCompositeScore',
    SS_TO_RAW: 'StandardScoreToRawScore',
    PERC_TO_SS: 'PercentileToStandardScore',
  };

  // Subtest results - Raw scores echoed
  const rawRows = [ROW.RAW_COG, ROW.RAW_RL, ROW.RAW_EL, ROW.RAW_SE, ROW.RAW_GM, ROW.RAW_FM, ROW.RAW_AB];
  const resultRows = [ROW.RESULT_COG, ROW.RESULT_RL, ROW.RESULT_EL, ROW.RESULT_SE, ROW.RESULT_GM, ROW.RESULT_FM, ROW.RESULT_AB];
  const ssColumns = [4, 5, 6, 7, 8, 9, 10]; // D, E, F, G, H, I, J in RawToStandard
  const dispColumns = [11, 12, 13, 14, 15, 16, 17]; // K, L, M, N, O, P, Q for display
  const aeKeys = ['COG', 'RL', 'EL', 'SE', 'GM', 'FM', 'AB'];

  for (let i = 0; i < 7; i++) {
    const rawRow = rawRows[i];
    const resultRow = resultRows[i];
    const ssCol = ssColumns[i];
    const dispCol = dispColumns[i];
    const aeKey = aeKeys[i];

    // Column B: Raw score echo
    formulas[`B${resultRow}`] = { t: 'n', f: `B${rawRow}` };

    // Column C: Standard Score (display with < or >)
    formulas[`C${resultRow}`] = {
      t: 's',
      f: `IFERROR(VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+B${resultRow},'${SHEETS.RAW_TO_STANDARD}'!A:Q,${dispCol},FALSE),"")`,
    };

    // Column D: Percentile
    // First get numeric SS for percentile lookup
    formulas[`D${resultRow}`] = {
      t: 's',
      f: `IFERROR(VLOOKUP(VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+B${resultRow},'${SHEETS.RAW_TO_STANDARD}'!A:Q,${ssCol},FALSE),'${SHEETS.SS_TO_PERCENTILE}'!A:C,3,TRUE),"")`,
    };

    // Column E: Age Equivalent
    formulas[`E${resultRow}`] = {
      t: 's',
      f: `IFERROR(VLOOKUP("${aeKey}_"&B${resultRow},'${SHEETS.RAW_TO_AGE_EQUIV}'!A:D,4,FALSE),"")`,
    };
  }

  // Domain Composites
  // Communication = RL + EL (sum of standard scores)
  // Min sum in D1 is 100; show message if below
  formulas[`B${ROW.DOMAIN_COMM}`] = {
    t: 'n',
    f: `IFERROR(VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+B${ROW.RESULT_RL},'${SHEETS.RAW_TO_STANDARD}'!A:J,5,FALSE)+VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+B${ROW.RESULT_EL},'${SHEETS.RAW_TO_STANDARD}'!A:J,6,FALSE),"")`,
  };
  formulas[`C${ROW.DOMAIN_COMM}`] = {
    t: 's',
    f: `IF(B${ROW.DOMAIN_COMM}="","",IF(B${ROW.DOMAIN_COMM}<100,"<49",IFERROR(VLOOKUP(B${ROW.DOMAIN_COMM},'${SHEETS.SUM_TO_COMPOSITE}'!A:B,2,TRUE),"")))`,
  };
  formulas[`D${ROW.DOMAIN_COMM}`] = {
    t: 's',
    f: `IF(C${ROW.DOMAIN_COMM}="<49","<1",IFERROR(VLOOKUP(C${ROW.DOMAIN_COMM},'${SHEETS.SS_TO_PERCENTILE}'!A:C,3,TRUE),""))`,
  };

  // Physical Development = GM + FM (sum of standard scores)
  formulas[`B${ROW.DOMAIN_PHYS}`] = {
    t: 'n',
    f: `IFERROR(VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+B${ROW.RESULT_GM},'${SHEETS.RAW_TO_STANDARD}'!A:J,8,FALSE)+VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+B${ROW.RESULT_FM},'${SHEETS.RAW_TO_STANDARD}'!A:J,9,FALSE),"")`,
  };
  formulas[`C${ROW.DOMAIN_PHYS}`] = {
    t: 's',
    f: `IF(B${ROW.DOMAIN_PHYS}="","",IF(B${ROW.DOMAIN_PHYS}<100,"<49",IFERROR(VLOOKUP(B${ROW.DOMAIN_PHYS},'${SHEETS.SUM_TO_COMPOSITE}'!A:B,2,TRUE),"")))`,
  };
  formulas[`D${ROW.DOMAIN_PHYS}`] = {
    t: 's',
    f: `IF(C${ROW.DOMAIN_PHYS}="<49","<1",IFERROR(VLOOKUP(C${ROW.DOMAIN_PHYS},'${SHEETS.SS_TO_PERCENTILE}'!A:C,3,TRUE),""))`,
  };

  // Reverse lookup: Percentile → Standard Score
  formulas[`B${ROW.TARGET_SS}`] = {
    t: 'n',
    f: `IFERROR(VLOOKUP(B${ROW.TARGET_PERC},'${SHEETS.PERC_TO_SS}'!A:B,2,TRUE),"")`,
  };

  // Reverse lookup: Standard Score → Raw Score for each subtest
  const reverseRows = [ROW.REVERSE_COG, ROW.REVERSE_RL, ROW.REVERSE_EL, ROW.REVERSE_SE, ROW.REVERSE_GM, ROW.REVERSE_FM, ROW.REVERSE_AB];
  const ssToRawColumns = [4, 5, 6, 7, 8, 9, 10]; // COG_Raw, RL_Raw, etc.

  for (let i = 0; i < 7; i++) {
    formulas[`B${reverseRows[i]}`] = {
      t: 's',
      f: `IFERROR(VLOOKUP($B$${ROW.AGE_BAND_IDX}*1000+$B$${ROW.TARGET_SS},'${SHEETS.SS_TO_RAW}'!A:J,${ssToRawColumns[i]},TRUE),"")`,
    };
  }

  return { data, formulas, merges };
};

// === Main Generator ===

export const generateDAYC2Workbook = (jsonDir: string, outputPath: string): void => {
  console.log('Loading JSON data...');

  // Load all data
  const a1Path = path.join(jsonDir, 'Table-A1-Raw-Scores-to-Age-Equivalents.json');
  const c1Path = path.join(jsonDir, 'Table-C1-Standard-Scores-to-Percentile-Ranks.json');
  const d1Path = path.join(jsonDir, 'Table-D1-Sums-of-Subdomain-Standard-Scores-to-Domain-Standard-Scores.json');

  const a1 = loadJson<AgeEquivalentsTableJson>(a1Path);
  const c1 = loadJson<C1TableJson>(c1Path);
  const d1 = loadJson<D1TableJson>(d1Path);
  const bTables = loadAllBTables(jsonDir);

  console.log(`Loaded ${bTables.length} B-tables, A1, C1, D1`);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Calculator
  console.log('Building Calculator sheet...');
  const { data: calcData, formulas: calcFormulas, merges: calcMerges } = buildCalculatorSheet();
  const wsCalc = XLSX.utils.aoa_to_sheet(calcData);
  
  // Column widths for better readability
  wsCalc['!cols'] = [
    { wch: 28 },  // A: Labels
    { wch: 16 },  // B: Values/Raw
    { wch: 28 },  // C: Standard Score / Help text
    { wch: 12 },  // D: Percentile
    { wch: 12 },  // E: Age Equiv
  ];

  // Row heights for section headers (in points, ~15 default)
  wsCalc['!rows'] = [
    { hpt: 24 },  // Row 1: Title
    {},           // Row 2
    { hpt: 20 },  // Row 3: CHILD INFORMATION
    {}, {}, {},   // Rows 4-6
    {},           // Row 7
    { hpt: 20 },  // Row 8: AGE CALCULATION
    {}, {}, {}, {}, {},  // Rows 9-13
    {},           // Row 14
    { hpt: 20 },  // Row 15: RAW SCORES
    {}, {}, {}, {}, {}, {}, {},  // Rows 16-22
    {},           // Row 23
    { hpt: 20 },  // Row 24: SUBTEST RESULTS
  ];

  // Apply cell merges for section headers
  wsCalc['!merges'] = calcMerges;

  // Apply formulas - need to set after sheet creation
  for (const [cell, { f }] of Object.entries(calcFormulas)) {
    if (!wsCalc[cell]) {
      wsCalc[cell] = { t: 's', v: '' };
    }
    wsCalc[cell].f = f;
  }

  // Set date cells to date format (B5=DOB, B6=Test Date)
  wsCalc['B5'] = { t: 'n', v: null as unknown as number, z: 'm/d/yyyy' };
  wsCalc['B6'] = { t: 'n', v: null as unknown as number, z: 'm/d/yyyy' };

  // Ensure sheet ref includes all formula cells
  wsCalc['!ref'] = 'A1:E50';

  XLSX.utils.book_append_sheet(wb, wsCalc, 'Calculator');

  // Sheet 2: AgeBands
  console.log('Building AgeBands sheet...');
  const ageBandsData = buildAgeBandsSheet(bTables);
  const wsAgeBands = XLSX.utils.aoa_to_sheet(ageBandsData);
  XLSX.utils.book_append_sheet(wb, wsAgeBands, 'AgeBands');

  // Sheet 3: RawScoreToStandardScore
  console.log('Building RawScoreToStandardScore sheet...');
  const rawToStdData = buildRawToStandardSheet(bTables);
  const wsRawToStd = XLSX.utils.aoa_to_sheet(rawToStdData);
  XLSX.utils.book_append_sheet(wb, wsRawToStd, 'RawScoreToStandardScore');

  // Sheet 4: StandardScoreToPercentile
  console.log('Building StandardScoreToPercentile sheet...');
  const ssPercData = buildSSToPercentileSheet(c1);
  const wsSSPerc = XLSX.utils.aoa_to_sheet(ssPercData);
  XLSX.utils.book_append_sheet(wb, wsSSPerc, 'StandardScoreToPercentile');

  // Sheet 5: RawScoreToAgeEquivalent
  console.log('Building RawScoreToAgeEquivalent sheet...');
  const rawAgeData = buildRawToAgeEquivSheet(a1);
  const wsRawAge = XLSX.utils.aoa_to_sheet(rawAgeData);
  XLSX.utils.book_append_sheet(wb, wsRawAge, 'RawScoreToAgeEquivalent');

  // Sheet 6: SumToCompositeScore
  console.log('Building SumToCompositeScore sheet...');
  const sumCompData = buildSumToCompositeSheet(d1);
  const wsSumComp = XLSX.utils.aoa_to_sheet(sumCompData);
  XLSX.utils.book_append_sheet(wb, wsSumComp, 'SumToCompositeScore');

  // Sheet 7: StandardScoreToRawScore
  console.log('Building StandardScoreToRawScore sheet...');
  const ssToRawData = buildSSToRawSheet(bTables);
  const wsSSToRaw = XLSX.utils.aoa_to_sheet(ssToRawData);
  XLSX.utils.book_append_sheet(wb, wsSSToRaw, 'StandardScoreToRawScore');

  // Sheet 8: PercentileToStandardScore
  console.log('Building PercentileToStandardScore sheet...');
  const percToSSData = buildPercToSSSheet(c1);
  const wsPercToSS = XLSX.utils.aoa_to_sheet(percToSSData);
  XLSX.utils.book_append_sheet(wb, wsPercToSS, 'PercentileToStandardScore');

  // Write file
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  XLSX.writeFile(wb, outputPath);
  console.log(`\nCreated: ${outputPath}`);
  console.log('\nUsage:');
  console.log('1. Open Calculator sheet');
  console.log('2. Enter Date of Birth (B5) and Test Date (B6)');
  console.log('3. Enter raw scores (B15-B21)');
  console.log('4. Everything else auto-calculates');
};

// === CLI Entry Point ===

if (require.main === module) {
  const jsonDir = path.join(__dirname, '..', '..', 'data', 'json');
  const outputPath = path.join(__dirname, '..', '..', 'output', 'DAYC2-Score-Calculator.xlsx');
  generateDAYC2Workbook(jsonDir, outputPath);
}
