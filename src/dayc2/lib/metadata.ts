// Canonical metadata definitions for DAYC-2 subtests and domains

import type { AgeEquivalentKey } from '../types';

// Active subtests used by the app (subset of SubtestKey)
export type ActiveSubtestKey = 'receptiveLanguage' | 'expressiveLanguage' | 'socialEmotional';

export const SUBTESTS: ActiveSubtestKey[] = [
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
];

export const SUBTEST_LABELS: Record<ActiveSubtestKey, string> = {
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  socialEmotional: 'Social-Emotional',
};

export const SUBTEST_ABBREVS: Record<ActiveSubtestKey, string> = {
  receptiveLanguage: 'RL',
  expressiveLanguage: 'EL',
  socialEmotional: 'SE',
};

export type DomainKey = 'communication';

export const DOMAINS: DomainKey[] = ['communication'];

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  communication: 'Communication (RL+EL)',
};

export const AGE_EQUIV_LABELS: Record<ActiveSubtestKey | 'communication', string> = {
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  communication: 'Communication',
  socialEmotional: 'Social-Emotional',
};

export const DOMAIN_TO_AGE_EQUIV: Record<DomainKey, AgeEquivalentKey> = {
  communication: 'communication',
};

export const DEFAULT_VISIBLE_SUBTESTS: ActiveSubtestKey[] = [
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
];

export const DEFAULT_VISIBLE_DOMAINS: DomainKey[] = ['communication'];
