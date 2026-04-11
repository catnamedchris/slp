// View-model logic for score display - formatting and data transformation

import type { SubtestResult, DomainResult, SumValue } from './calculate';
import type { ParsedScore, ParsedPercentile, ParsedAgeMonths } from '../types';
import type { ValueWithProvenance, ProvenanceStep } from '@/shared/lib/types';
import { formatValue } from './tables';
import {
  SUBTESTS,
  SUBTEST_LABELS,
  SUBTEST_ABBREVS,
  DOMAINS,
  DOMAIN_LABELS,
  DEFAULT_VISIBLE_SUBTESTS,
  DEFAULT_VISIBLE_DOMAINS,
  type ActiveSubtestKey,
  type DomainKey,
} from './metadata';

// Re-export metadata for consumers
export {
  SUBTESTS,
  SUBTEST_LABELS,
  SUBTEST_ABBREVS,
  DOMAINS,
  DOMAIN_LABELS,
  DEFAULT_VISIBLE_SUBTESTS,
  DEFAULT_VISIBLE_DOMAINS,
  type ActiveSubtestKey,
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

// Semantic tone for score coloring
export type SemanticTone = 'neutral' | 'low' | 'average' | 'high';

/**
 * Determines semantic tone from a percentile value.
 * <16th percentile = low (clinical concern), 16-84 = average, >84 = high.
 */
export const getPercentileTone = (pct: ParsedPercentile | null): SemanticTone => {
  if (!pct) return 'neutral';
  if ('bound' in pct) {
    // <N: if N <= 16, it's low; >N: if N >= 84, it's high
    if (pct.bound === 'lt') return pct.value <= 16 ? 'low' : 'average';
    if (pct.bound === 'gt') return pct.value >= 84 ? 'high' : 'average';
  }
  if ('value' in pct && !('bound' in pct) && !('min' in pct)) {
    if (pct.value < 16) return 'low';
    if (pct.value > 84) return 'high';
    return 'average';
  }
  return 'neutral';
};

// Display data interfaces
export interface SubtestScoreDisplay {
  key: ScoreColumn['key'];
  label: string;
  value: string;
  steps: ProvenanceStep[];
  tone: SemanticTone;
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
  tone: SemanticTone;
}

export interface DomainDisplay {
  sum: string;
  note: string | null;
  showNote: boolean;
  scores: DomainScoreDisplay[];
}

// Compute display data for a subtest
export const getSubtestDisplay = (
  subtest: ActiveSubtestKey,
  result: SubtestResult | null
): SubtestDisplay => {
  const tone = result ? getPercentileTone(result.percentile.value) : 'neutral';

  const scores: SubtestScoreDisplay[] = SUBTEST_SCORE_COLUMNS.map((col) => {
    if (!result) {
      return { key: col.key, label: col.label, value: '—', steps: [], tone: 'neutral' as SemanticTone };
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
      tone,
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

  const tone = result ? getPercentileTone(result.percentile.value) : 'neutral';

  const scores: DomainScoreDisplay[] = DOMAIN_SCORE_COLUMNS.map((col) => {
    if (!result) {
      return { key: col.key, label: col.label, value: '—', steps: [], tone: 'neutral' as SemanticTone };
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
      tone,
    };
  });

  return {
    sum: formatSumValue(result?.sum ?? null),
    note,
    showNote,
    scores,
  };
};
