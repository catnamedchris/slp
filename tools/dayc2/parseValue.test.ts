import { parseValue, parseAgeMonths, parsePercentile } from './parseValue';

describe('parseValue', () => {
  describe('null/missing values', () => {
    it('returns null for empty string', () => {
      expect(parseValue('')).toBeNull();
    });

    it('returns null for dash', () => {
      expect(parseValue('-')).toBeNull();
    });

    it('returns null for whitespace-only', () => {
      expect(parseValue('   ')).toBeNull();
    });
  });

  describe('exact numbers', () => {
    it('parses integer', () => {
      expect(parseValue('56')).toEqual({ value: 56 });
    });

    it('parses zero', () => {
      expect(parseValue('0')).toEqual({ value: 0 });
    });

    it('parses decimal', () => {
      expect(parseValue('0.1')).toEqual({ value: 0.1 });
    });

    it('parses decimal with leading digit', () => {
      expect(parseValue('99.9')).toEqual({ value: 99.9 });
    });
  });

  describe('bounded numbers', () => {
    it('parses less-than integer', () => {
      expect(parseValue('<50')).toEqual({ bound: 'lt', value: 50 });
    });

    it('parses greater-than integer', () => {
      expect(parseValue('>150')).toEqual({ bound: 'gt', value: 150 });
    });

    it('parses less-than decimal', () => {
      expect(parseValue('<0.1')).toEqual({ bound: 'lt', value: 0.1 });
    });

    it('parses greater-than decimal', () => {
      expect(parseValue('>99.9')).toEqual({ bound: 'gt', value: 99.9 });
    });
  });

  describe('ranges', () => {
    it('parses simple range', () => {
      expect(parseValue('5-6')).toEqual({ min: 5, max: 6 });
    });

    it('parses range with larger numbers', () => {
      expect(parseValue('100-101')).toEqual({ min: 100, max: 101 });
    });

    it('parses range starting at zero', () => {
      expect(parseValue('0-4')).toEqual({ min: 0, max: 4 });
    });

    it('parses three-digit range', () => {
      expect(parseValue('227-229')).toEqual({ min: 227, max: 229 });
    });
  });

  describe('whitespace handling', () => {
    it('trims leading whitespace', () => {
      expect(parseValue('  56')).toEqual({ value: 56 });
    });

    it('trims trailing whitespace', () => {
      expect(parseValue('56  ')).toEqual({ value: 56 });
    });
  });
});

describe('parseAgeMonths', () => {
  it('parses exact age', () => {
    expect(parseAgeMonths('12')).toEqual({ value: 12 });
  });

  it('parses less-than age', () => {
    expect(parseAgeMonths('<1')).toEqual({ bound: 'lt', value: 1 });
  });

  it('parses greater-than age', () => {
    expect(parseAgeMonths('>71')).toEqual({ bound: 'gt', value: 71 });
  });

  it('throws on range (not allowed for age_months)', () => {
    expect(() => parseAgeMonths('5-6')).toThrow();
  });
});

describe('parsePercentile', () => {
  it('parses exact percentile', () => {
    expect(parsePercentile('50')).toEqual({ value: 50 });
  });

  it('parses decimal percentile', () => {
    expect(parsePercentile('0.1')).toEqual({ value: 0.1 });
  });

  it('parses less-than percentile', () => {
    expect(parsePercentile('<0.1')).toEqual({ bound: 'lt', value: 0.1 });
  });

  it('parses greater-than percentile', () => {
    expect(parsePercentile('>99.9')).toEqual({ bound: 'gt', value: 99.9 });
  });

  it('throws on range (not allowed for percentile)', () => {
    expect(() => parsePercentile('5-6')).toThrow();
  });
});
