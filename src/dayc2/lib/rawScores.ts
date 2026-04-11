import type { SubtestKey } from '../types';

export type RawScores = Record<SubtestKey, number | null>;

export const createEmptyRawScores = (): RawScores => ({
  cognitive: null,
  receptiveLanguage: null,
  expressiveLanguage: null,
  socialEmotional: null,
  grossMotor: null,
  fineMotor: null,
  adaptiveBehavior: null,
});
