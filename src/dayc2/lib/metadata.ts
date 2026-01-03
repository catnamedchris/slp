// Canonical metadata definitions for DAYC-2 subtests and domains

import type { SubtestKey, AgeEquivalentKey } from '../types';

export const SUBTESTS: SubtestKey[] = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
];

export const SUBTEST_LABELS: Record<SubtestKey, string> = {
  cognitive: 'Cognitive',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  socialEmotional: 'Social-Emotional',
  grossMotor: 'Gross Motor',
  fineMotor: 'Fine Motor',
  adaptiveBehavior: 'Adaptive Behavior',
};

export type DomainKey = 'communication' | 'physical';

export const DOMAINS: DomainKey[] = ['communication', 'physical'];

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  communication: 'Communication (RL+EL)',
  physical: 'Physical (GM+FM)',
};

export const AGE_EQUIV_LABELS: Record<AgeEquivalentKey, string> = {
  cognitive: 'Cognitive',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  communication: 'Communication',
  socialEmotional: 'Social-Emotional',
  physicalDevelopment: 'Physical Development',
  grossMotor: 'Gross Motor',
  fineMotor: 'Fine Motor',
  adaptiveBehavior: 'Adaptive Behavior',
};

export const DOMAIN_TO_AGE_EQUIV: Record<DomainKey, AgeEquivalentKey> = {
  communication: 'communication',
  physical: 'physicalDevelopment',
};

export const DEFAULT_VISIBLE_SUBTESTS: SubtestKey[] = [
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
];

export const DEFAULT_VISIBLE_DOMAINS: DomainKey[] = [];
