// Re-export label mappings from canonical metadata module
// Also provides score formatting utilities

export {
  SUBTEST_LABELS,
  AGE_EQUIV_LABELS,
} from './metadata';

import type { ParsedScore } from '../types';

export const formatScoreValue = (score: ParsedScore | null): string => {
  if (score === null) return '—';
  if ('bound' in score && score.bound === 'lt') return `<${score.value}`;
  if ('bound' in score && score.bound === 'gt') return `>${score.value}`;
  if ('min' in score && 'max' in score) return `${score.min}-${score.max}`;
  return String(score.value);
};

export const formatPercentileValue = (pct: { value: number } | { min: number; max: number } | null): string => {
  if (pct === null) return '—';
  if ('min' in pct && 'max' in pct) return `${pct.min}-${pct.max}`;
  return String(pct.value);
};

export const formatAgeMonthsValue = (age: { value: number } | { bound: 'lt' | 'gt'; value: number } | null): string => {
  if (age === null) return '—';
  if ('bound' in age) {
    return age.bound === 'lt' ? `<${age.value} months` : `>${age.value} months`;
  }
  return `${age.value} months`;
};
