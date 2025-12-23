// DAYC-2 Core Library - Public API

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
