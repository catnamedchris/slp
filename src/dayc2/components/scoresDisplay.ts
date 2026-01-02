// Shared display logic for scores - centralizes formatting and warning logic

import type { SubtestResult, DomainResult, SumValue } from '../lib/calculate';
import type { ParsedScore, ParsedPercentile, ParsedAgeMonths, SubtestKey } from '../types';
import type { ValueWithProvenance, ProvenanceStep } from '@/shared/lib/types';
import { formatValue } from '../lib/tables';

export const SUBTEST_LABELS: Record<SubtestKey, string> = {
  cognitive: 'Cognitive',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  socialEmotional: 'Social-Emotional',
  grossMotor: 'Gross Motor',
  fineMotor: 'Fine Motor',
  adaptiveBehavior: 'Adaptive Behavior',
};

export const SUBTESTS: SubtestKey[] = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
];

export const DEFAULT_VISIBLE_SUBTESTS: SubtestKey[] = [
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
];

export type DomainKey = 'communication' | 'physical';

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  communication: 'Communication (RL+EL)',
  physical: 'Physical (GM+FM)',
};

export const DOMAINS: DomainKey[] = ['communication', 'physical'];

export const DEFAULT_VISIBLE_DOMAINS: DomainKey[] = [];

// Formatting helpers
export const formatAgeEquivalent = (ae: ValueWithProvenance<ParsedAgeMonths>): string => {
  if (!ae.value) return '—';
  return formatValue(ae.value) + ' mo';
};

export const formatScore = (score: ValueWithProvenance<ParsedScore>): string => {
  if (!score.value) return '—';
  return formatValue(score.value);
};

export const formatPercentile = (pct: ValueWithProvenance<ParsedPercentile>): string => {
  if (!pct.value) return '—';
  return formatValue(pct.value) + '%';
};

export const formatSumValue = (sum: SumValue | null): string => {
  if (!sum) return '—';
  switch (sum.type) {
    case 'exact':
      return sum.value.toString();
    case 'lt':
      return `<${sum.value}`;
    case 'gt':
      return `>${sum.value}`;
  }
};

// Score column definitions
export interface ScoreColumn {
  key: 'standardScore' | 'percentile' | 'ageEquivalent';
  label: string;
}

export const SUBTEST_SCORE_COLUMNS: ScoreColumn[] = [
  { key: 'standardScore', label: 'Standard' },
  { key: 'percentile', label: 'Percentile' },
  { key: 'ageEquivalent', label: 'Age Equiv.' },
];

export type DomainScoreKey = 'standardScore' | 'percentile';

export interface DomainScoreColumn {
  key: DomainScoreKey;
  label: string;
}

export const DOMAIN_SCORE_COLUMNS: DomainScoreColumn[] = [
  { key: 'standardScore', label: 'Standard' },
  { key: 'percentile', label: 'Percentile' },
];

// Display data interfaces
export interface SubtestScoreDisplay {
  key: ScoreColumn['key'];
  label: string;
  value: string;
  steps: ProvenanceStep[];
}

export interface SubtestDisplay {
  label: string;
  scores: SubtestScoreDisplay[];
  note: string | null;
}

export interface DomainScoreDisplay {
  key: DomainScoreKey;
  label: string;
  value: string;
  steps: ProvenanceStep[];
}

export interface DomainDisplay {
  sum: string;
  note: string | null;
  showNote: boolean;
  scores: DomainScoreDisplay[];
}

// Compute display data for a subtest
export const getSubtestDisplay = (
  subtest: SubtestKey,
  result: SubtestResult | null
): SubtestDisplay => {
  const scores: SubtestScoreDisplay[] = SUBTEST_SCORE_COLUMNS.map((col) => {
    if (!result) {
      return { key: col.key, label: col.label, value: '—', steps: [] };
    }

    let value: string;
    if (col.key === 'standardScore') {
      value = formatScore(result.standardScore);
    } else if (col.key === 'percentile') {
      value = formatPercentile(result.percentile);
    } else {
      value = formatAgeEquivalent(result.ageEquivalent);
    }

    return {
      key: col.key,
      label: col.label,
      value,
      steps: result[col.key].steps,
    };
  });

  // Get note from standard score (e.g., when raw score exceeds table max)
  const note = result?.standardScore.note ?? null;

  return {
    label: SUBTEST_LABELS[subtest],
    scores,
    note,
  };
};

// Compute display data for a domain
export const getDomainDisplay = (result: DomainResult | null): DomainDisplay => {
  const note = result?.standardScore.note ?? null;
  const showNote = !!(result && !result.sum && note);

  const scores: DomainScoreDisplay[] = DOMAIN_SCORE_COLUMNS.map((col) => {
    if (!result) {
      return { key: col.key, label: col.label, value: '—', steps: [] };
    }

    let value: string;
    if (col.key === 'standardScore') {
      value = formatScore(result.standardScore);
    } else {
      value = formatPercentile(result.percentile);
    }

    return {
      key: col.key,
      label: col.label,
      value,
      steps: result[col.key].steps,
    };
  });

  return {
    sum: formatSumValue(result?.sum ?? null),
    note,
    showNote,
    scores,
  };
};

// Raw score input handler factory
export const createRawScoreHandler = (
  subtest: SubtestKey,
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void
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
