import {
  parseA1Row,
  parseBRow,
  parseC1Row,
  parseD1Row,
  extractBTableId,
  getAgeBandForTable,
} from './parsers';

describe('parseA1Row', () => {
  it('parses a complete row with ranges', () => {
    const record = {
      age_months: '<1',
      cognitive: '0-4',
      communication: '0-7',
      receptive_language: '0-4',
      expressive_language: '0-3',
      social_emotional: '0-6',
      physical_development: '0-8',
      gross_motor: '0-5',
      fine_motor: '0-3',
      adaptive_behavior: '0-6',
    };
    const result = parseA1Row(record, 2);

    expect(result.csvRow).toBe(2);
    expect(result.ageMonths).toEqual({ bound: 'lt', value: 1 });
    expect(result.cognitive).toEqual({ min: 0, max: 4 });
    expect(result.communication).toEqual({ min: 0, max: 7 });
  });

  it('parses row with null values (dashes)', () => {
    const record = {
      age_months: '2',
      cognitive: '7-8',
      communication: '10',
      receptive_language: '-',
      expressive_language: '5',
      social_emotional: '8',
      physical_development: '11-13',
      gross_motor: '7-8',
      fine_motor: '5',
      adaptive_behavior: '-',
    };
    const result = parseA1Row(record, 4);

    expect(result.ageMonths).toEqual({ value: 2 });
    expect(result.receptiveLanguage).toBeNull();
    expect(result.adaptiveBehavior).toBeNull();
    expect(result.expressiveLanguage).toEqual({ value: 5 });
  });

  it('parses greater-than age months', () => {
    const record = {
      age_months: '>71',
      cognitive: '>81',
      communication: '>72',
      receptive_language: '>34',
      expressive_language: '>38',
      social_emotional: '>58',
      physical_development: '>81',
      gross_motor: '>51',
      fine_motor: '>31',
      adaptive_behavior: '>56',
    };
    const result = parseA1Row(record, 74);

    expect(result.ageMonths).toEqual({ bound: 'gt', value: 71 });
    expect(result.cognitive).toEqual({ bound: 'gt', value: 81 });
  });
});

describe('parseBRow', () => {
  it('parses row with bounded values', () => {
    const record = {
      raw_score: '0',
      cognitive: '<50',
      receptive_language: '<50',
      expressive_language: '<50',
      social_emotional: '<50',
      gross_motor: '<50',
      fine_motor: '56',
      adaptive_behavior: '<50',
    };
    const result = parseBRow(record, 2);

    expect(result.csvRow).toBe(2);
    expect(result.rawScore).toBe(0);
    expect(result.cognitive).toEqual({ bound: 'lt', value: 50 });
    expect(result.fineMotor).toEqual({ value: 56 });
  });

  it('parses row with exact and greater-than values', () => {
    const record = {
      raw_score: '48',
      cognitive: '>150',
      receptive_language: '-',
      expressive_language: '-',
      social_emotional: '>150',
      gross_motor: '137',
      fine_motor: '-',
      adaptive_behavior: '>150',
    };
    const result = parseBRow(record, 50);

    expect(result.rawScore).toBe(48);
    expect(result.cognitive).toEqual({ bound: 'gt', value: 150 });
    expect(result.receptiveLanguage).toBeNull();
    expect(result.grossMotor).toEqual({ value: 137 });
  });
});

describe('parseC1Row', () => {
  it('parses row with all three column pairs', () => {
    const record = {
      standard_score_1: '160',
      percentile_rank_1: '>99.9',
      standard_score_2: '119',
      percentile_rank_2: '90',
      standard_score_3: '78',
      percentile_rank_3: '7',
    };
    const result = parseC1Row(record, 2);

    expect(result.csvRow).toBe(2);
    expect(result.standardScore1).toEqual({ value: 160 });
    expect(result.percentileRank1).toEqual({ bound: 'gt', value: 99.9 });
    expect(result.standardScore2).toEqual({ value: 119 });
    expect(result.percentileRank2).toEqual({ value: 90 });
  });

  it('parses row with empty trailing cells', () => {
    const record = {
      standard_score_1: '121',
      percentile_rank_1: '92',
      standard_score_2: '80',
      percentile_rank_2: '9',
      standard_score_3: '',
      percentile_rank_3: '',
    };
    const result = parseC1Row(record, 41);

    expect(result.standardScore3).toBeNull();
    expect(result.percentileRank3).toBeNull();
  });
});

describe('parseD1Row', () => {
  it('parses row with ranges and exact values', () => {
    const record = {
      sum_range_1: '100-101',
      standard_score_1: '49',
      sum_range_2: '166-167',
      standard_score_2: '83',
      sum_range_3: '227-229',
      standard_score_3: '117',
    };
    const result = parseD1Row(record, 2);

    expect(result.csvRow).toBe(2);
    expect(result.sumRange1).toEqual({ min: 100, max: 101 });
    expect(result.standardScore1).toEqual({ value: 49 });
    expect(result.sumRange3).toEqual({ min: 227, max: 229 });
  });

  it('parses single-value sum range', () => {
    const record = {
      sum_range_1: '102',
      standard_score_1: '50',
      sum_range_2: '168-170',
      standard_score_2: '84',
      sum_range_3: '230-231',
      standard_score_3: '118',
    };
    const result = parseD1Row(record, 3);

    expect(result.sumRange1).toEqual({ value: 102 });
  });
});

describe('extractBTableId', () => {
  it('extracts B13 from filename', () => {
    expect(extractBTableId('Table-B13-Raw-Scores-to-Standard-Scores-Age-12-13-Months.csv')).toBe('B13');
  });

  it('extracts B29 from filename', () => {
    expect(extractBTableId('Table-B29-Raw-Scores-to-Standard-Scores-Age-66-71-Months.csv')).toBe('B29');
  });

  it('returns null for non-B table', () => {
    expect(extractBTableId('Table-A1-Raw-Scores-to-Age-Equivalents.csv')).toBeNull();
  });

  it('returns null for unknown B table number', () => {
    expect(extractBTableId('Table-B99-Something.csv')).toBeNull();
  });
});

describe('getAgeBandForTable', () => {
  it('returns correct age band for B13', () => {
    expect(getAgeBandForTable('B13')).toEqual({
      minMonths: 12,
      maxMonths: 13,
      label: '12-13 Months',
    });
  });

  it('returns correct age band for B29', () => {
    expect(getAgeBandForTable('B29')).toEqual({
      minMonths: 66,
      maxMonths: 71,
      label: '66-71 Months',
    });
  });
});
