// Shared types for scoring provenance and traceability

/**
 * Metadata about the source of a lookup table.
 * This matches the "source" field in our JSON table files.
 */
export interface SourceMeta {
  tableId: string;
  tableTitle: string;
  manualPage: number;
  csvFilename: string;
  csvSha256: string;
  generatedAt: string;
  generatorVersion: string;
}

/**
 * A single step in a multi-step lookup chain.
 * For example, raw → standard score → percentile involves two steps.
 */
export interface ProvenanceStep {
  tableId: string;
  csvRow: number | null;
  source: SourceMeta;
  description?: string;
}

/**
 * A value paired with its complete provenance chain.
 * Enables full traceability from any displayed score back to source data.
 */
export interface ValueWithProvenance<T> {
  value: T | null;
  steps: ProvenanceStep[];
  note?: string;
}
