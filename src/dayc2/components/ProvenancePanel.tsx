// ProvenancePanel: Displays lookup provenance for transparency

import { useState } from 'react';
import type { ProvenanceStep, SourceMeta } from '@/shared/lib/types';

interface ProvenancePanelProps {
  selectedSteps: ProvenanceStep[] | null;
  onClose: () => void;
}

interface AboutDataProps {
  sources: SourceMeta[];
}

export const AboutData = ({ sources }: AboutDataProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) return null;

  const uniqueSources = sources.filter(
    (s, i, arr) => arr.findIndex((x) => x.csvFilename === s.csvFilename) === i
  );

  return (
    <div className="card about-data">
      <h2
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        About the Data {isExpanded ? '▼' : '▶'}
      </h2>
      {isExpanded && (
        <div className="about-data-content">
          <p>
            All scores are calculated using direct table lookups from the DAYC-2
            Examiner's Manual. No interpolation or modeling is used.
          </p>
          <table className="sources-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>CSV File</th>
                <th>SHA-256</th>
              </tr>
            </thead>
            <tbody>
              {uniqueSources.map((source) => (
                <tr key={source.csvFilename}>
                  <td>{source.tableId}</td>
                  <td>{source.csvFilename}</td>
                  <td className="sha-cell" title={source.csvSha256}>
                    {source.csvSha256.substring(0, 12)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {uniqueSources.length > 0 && (
            <p className="generator-version">
              Generated: {uniqueSources[0].generatorVersion}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const ProvenancePanel = ({ selectedSteps, onClose }: ProvenancePanelProps) => {
  if (!selectedSteps || selectedSteps.length === 0) return null;

  return (
    <div className="provenance-panel">
      <div className="provenance-header">
        <h3>Lookup Path</h3>
        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>
      <div className="provenance-steps">
        {selectedSteps.map((step, index) => (
          <div key={index} className="provenance-step">
            <div className="step-number">{index + 1}</div>
            <div className="step-details">
              <div className="step-table">
                Table {step.tableId}, Row {step.csvRow}
              </div>
              {step.description && (
                <div className="step-description">{step.description}</div>
              )}
              <div className="step-source">
                {step.source.csvFilename}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProvenancePanel;
