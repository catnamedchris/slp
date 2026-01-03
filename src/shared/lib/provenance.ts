// Provenance utilities for building audit trails

import type { ProvenanceStep, SourceMeta, ValueWithProvenance } from './types';

/**
 * Creates a failure provenance step indicating a lookup that didn't find a match.
 * Used when lookups fail to maintain audit trail.
 */
export const createFailureStep = (
  tableId: string,
  source: SourceMeta,
  description: string
): ProvenanceStep => ({
  tableId,
  csvRow: null,
  source,
  description,
});

/**
 * Chains multiple provenance step arrays together.
 * Filters out undefined/null entries for convenience.
 */
export const chainProvenance = (
  ...stepArrays: (ProvenanceStep[] | undefined)[]
): ProvenanceStep[] =>
  stepArrays.filter((arr): arr is ProvenanceStep[] => arr != null).flat();

/**
 * Creates a ValueWithProvenance with null value and a failure step.
 * Convenience for returning failure results with audit trail.
 */
export const failureResult = <T>(
  tableId: string,
  source: SourceMeta,
  description: string,
  note?: string
): ValueWithProvenance<T> => ({
  value: null,
  steps: [createFailureStep(tableId, source, description)],
  note,
});
