// View-model logic for score display - formatting and data transformation

import type { SubtestResult, DomainResult, SumValue } from './calculate';
import type { ParsedScore, ParsedPercentile, ParsedAgeMonths, SubtestKey } from '../types';
import type { ValueWithProvenance, ProvenanceStep } from '@/shared/lib/types';
import { formatValue } from './tables';
import {
  SUBTESTS,
  SUBTEST_LABELS,
  DOMAINS,
  DOMAIN_LABELS,
  DEFAULT_VISIBLE_SUBTESTS,
  DEFAULT_VISIBLE_DOMAINS,
  type DomainKey,
} from './metadata';

// Re-export metadata for consumers
export {
  SUBTESTS,
  SUBTEST_LABELS,
  DOMAINS,
  DOMAIN_LABELS,
  DEFAULT_VISIBLE_SUBTESTS,
  DEFAULT_VISIBLE_DOMAINS,
  type DomainKey,
};

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

  // Get note from standard score only if a raw score was entered
  // (e.g., when raw score exceeds table max)
  const note = (result && result.rawScore !== null) ? (result.standardScore.note ?? null) : null;

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
