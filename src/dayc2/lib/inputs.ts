// Input handling utilities for DAYC-2 forms

// Raw score input handler factory
export const createRawScoreHandler = <K extends string>(
  subtest: K,
  onRawScoreChange: (subtest: K, value: number | null) => void
) => {
  return (value: string) => {
    if (value === '') {
      onRawScoreChange(subtest, null);
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        onRawScoreChange(subtest, parsed);
      }
    }
  };
};
