// DAYC-2 Core Library - Public API

// Metadata (canonical definitions)
export {
  SUBTESTS,
  SUBTEST_LABELS,
  DOMAINS,
  DOMAIN_LABELS,
  AGE_EQUIV_LABELS,
  DOMAIN_TO_AGE_EQUIV,
  DEFAULT_VISIBLE_SUBTESTS,
  DEFAULT_VISIBLE_DOMAINS,
  type DomainKey,
} from './metadata';

// Type guards and utilities
export {
  isExact,
  isBounded,
  isRange,
  getNumericValue,
  formatValue,
} from './tables';

// Age calculations
export { calcAgeMonths, findAgeBand } from './age';

// Forward lookups (raw → standard → percentile)
export {
  lookupStandardScore,
  lookupPercentile,
  lookupAgeEquivalent,
  lookupDomainComposite,
} from './scoring';

// Reverse lookups (for goal planning)
export {
  lookupStandardScoreFromPercentile,
  lookupRawScoreFromStandardScore,
} from './goals';

// Orchestrator
export {
  calculateAllScores,
  type CalculationInput,
  type CalculationResult,
  type SubtestResult,
  type DomainResult,
} from './calculate';
