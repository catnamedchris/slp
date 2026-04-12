// Eligibility logic: determines whether entered raw scores exceed targets

import type { ActiveSubtestKey } from './metadata';
import type { ReverseLookupResults } from '../components/ReverseLookup';
import type { RawScores } from './rawScores';
import { SUBTESTS } from './metadata';

export interface SubtestEligibility {
  /** true when raw score exceeds the target (child does NOT qualify on this subtest) */
  exceedsTarget: boolean;
}

export type EligibilityMap = Partial<Record<ActiveSubtestKey, SubtestEligibility>>;

export interface EligibilityResult {
  /** Per-subtest eligibility flags (only for administered subtests with a target) */
  subtests: EligibilityMap;
  /** true when ALL administered subtests exceed targets — coverage denied */
  allExceed: boolean;
}

/**
 * Computes eligibility by comparing entered raw scores against reverse-lookup targets.
 * A subtest "exceeds target" when its raw score is strictly greater than the target raw score.
 * Coverage is denied only when ALL administered subtests exceed their targets.
 */
export const computeEligibility = (
  rawScores: RawScores,
  lookup: ReverseLookupResults | null
): EligibilityResult => {
  const subtests: EligibilityMap = {};

  if (!lookup?.subtests) {
    return { subtests, allExceed: false };
  }

  let administeredCount = 0;
  let exceedCount = 0;

  for (const subtest of SUBTESTS) {
    const rawScore = rawScores[subtest];
    if (rawScore === null) continue; // not administered

    const target = lookup.subtests.find((r) => r.subtest === subtest);
    if (!target || target.rawScore === null) continue; // no target available

    administeredCount++;
    const exceeds = rawScore > target.rawScore;
    if (exceeds) exceedCount++;

    subtests[subtest] = { exceedsTarget: exceeds };
  }

  return {
    subtests,
    allExceed: administeredCount > 0 && exceedCount === administeredCount,
  };
};
