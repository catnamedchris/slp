// ResultsTable: Displays calculated scores for subtests and domain composites

import type { CalculationResult, SubtestResult, DomainResult } from '../lib/calculate';
import type { SubtestKey, ParsedScore, ParsedPercentile, ParsedAgeMonths } from '../types';
import type { ValueWithProvenance, ProvenanceStep } from '@/shared/lib/types';
import { formatValue, isExact, isBounded } from '../lib/tables';

interface ResultsTableProps {
  result: CalculationResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[]) => void;
}

const SUBTEST_LABELS: Record<SubtestKey, string> = {
  cognitive: 'Cognitive',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  socialEmotional: 'Social-Emotional',
  grossMotor: 'Gross Motor',
  fineMotor: 'Fine Motor',
  adaptiveBehavior: 'Adaptive Behavior',
};

const SUBTESTS: SubtestKey[] = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
];

const getScoreClass = (score: ParsedScore | null): string => {
  if (!score) return '';
  const value = isExact(score) ? score.value : isBounded(score) ? score.value : null;
  if (value === null) return '';
  if (value < 85) return 'score-low';
  if (value > 115) return 'score-high';
  return 'score-avg';
};

const formatAgeEquivalent = (ae: ValueWithProvenance<ParsedAgeMonths>): string => {
  if (!ae.value) return '—';
  return formatValue(ae.value);
};

const formatScore = (score: ValueWithProvenance<ParsedScore>): string => {
  if (!score.value) return '—';
  return formatValue(score.value);
};

const formatPercentile = (pct: ValueWithProvenance<ParsedPercentile>): string => {
  if (!pct.value) return '—';
  return formatValue(pct.value);
};

interface ScoreCellProps {
  value: string;
  scoreClass?: string;
  steps?: ProvenanceStep[];
  onProvenanceClick?: (steps: ProvenanceStep[]) => void;
}

const ScoreCell = ({ value, scoreClass = '', steps, onProvenanceClick }: ScoreCellProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;
  
  return (
    <td
      className={`${scoreClass} ${hasProvenance ? 'clickable' : ''}`}
      onClick={hasProvenance ? () => onProvenanceClick(steps) : undefined}
      title={hasProvenance ? 'Click to view provenance' : undefined}
    >
      {value}
    </td>
  );
};

const SubtestRow = ({
  subtest,
  result,
  onProvenanceClick,
}: {
  subtest: SubtestKey;
  result: SubtestResult;
  onProvenanceClick?: (steps: ProvenanceStep[]) => void;
}) => (
  <tr>
    <td className="subtest-name">{SUBTEST_LABELS[subtest]}</td>
    <td>{result.rawScore}</td>
    <ScoreCell
      value={formatScore(result.standardScore)}
      scoreClass={getScoreClass(result.standardScore.value)}
      steps={result.standardScore.steps}
      onProvenanceClick={onProvenanceClick}
    />
    <ScoreCell
      value={formatPercentile(result.percentile)}
      steps={result.percentile.steps}
      onProvenanceClick={onProvenanceClick}
    />
    <ScoreCell
      value={formatAgeEquivalent(result.ageEquivalent)}
      steps={result.ageEquivalent.steps}
      onProvenanceClick={onProvenanceClick}
    />
  </tr>
);

const DomainRow = ({
  label,
  result,
  onProvenanceClick,
}: {
  label: string;
  result: DomainResult;
  onProvenanceClick?: (steps: ProvenanceStep[]) => void;
}) => (
  <tr className="composite-row">
    <td className="subtest-name">{label}</td>
    <td>{result.sum ?? '—'}</td>
    <ScoreCell
      value={formatScore(result.standardScore)}
      scoreClass={getScoreClass(result.standardScore.value)}
      steps={result.standardScore.steps}
      onProvenanceClick={onProvenanceClick}
    />
    <ScoreCell
      value={formatPercentile(result.percentile)}
      steps={result.percentile.steps}
      onProvenanceClick={onProvenanceClick}
    />
    <td>—</td>
  </tr>
);

const ResultsTable = ({ result, onProvenanceClick }: ResultsTableProps) => {
  if (!result) {
    return (
      <div className="card">
        <h2>Results</h2>
        <p>Enter child information and raw scores to see results.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Results</h2>
      <table>
        <thead>
          <tr>
            <th>Subtest</th>
            <th>Raw</th>
            <th>Standard Score</th>
            <th>Percentile</th>
            <th>Age Equiv.</th>
          </tr>
        </thead>
        <tbody>
          {SUBTESTS.map((subtest) => (
            <SubtestRow
              key={subtest}
              subtest={subtest}
              result={result.subtests[subtest]}
              onProvenanceClick={onProvenanceClick}
            />
          ))}
          <DomainRow
            label="Communication (RL+EL)"
            result={result.domains.communication}
            onProvenanceClick={onProvenanceClick}
          />
          <DomainRow
            label="Physical (GM+FM)"
            result={result.domains.physical}
            onProvenanceClick={onProvenanceClick}
          />
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
