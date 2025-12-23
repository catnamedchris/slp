// ScoresTable: Combined raw score input and results display

import { useState } from 'react';
import type { CalculationResult, SubtestResult, DomainResult } from '../lib/calculate';
import type { SubtestKey, ParsedScore, ParsedPercentile, ParsedAgeMonths } from '../types';
import type { ValueWithProvenance, ProvenanceStep } from '@/shared/lib/types';
import { formatValue } from '../lib/tables';
import type { RawScores } from './RawScoresForm';

interface ScoresTableProps {
  ageMonths: number | null;
  rawScores: RawScores;
  result: CalculationResult | null;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
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

const DEFAULT_VISIBLE: SubtestKey[] = [
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
];

type DomainKey = 'communication' | 'physical';

const DOMAIN_LABELS: Record<DomainKey, string> = {
  communication: 'Communication (RL+EL)',
  physical: 'Physical (GM+FM)',
};

const DOMAINS: DomainKey[] = ['communication', 'physical'];

const DEFAULT_VISIBLE_DOMAINS: DomainKey[] = [];

const formatAgeEquivalent = (ae: ValueWithProvenance<ParsedAgeMonths>): string => {
  if (!ae.value) return '—';
  return formatValue(ae.value) + ' mo';
};

const formatScore = (score: ValueWithProvenance<ParsedScore>): string => {
  if (!score.value) return '—';
  return formatValue(score.value);
};

const formatPercentile = (pct: ValueWithProvenance<ParsedPercentile>): string => {
  if (!pct.value) return '—';
  return formatValue(pct.value) + '%';
};

interface ScoreCellProps {
  value: string;
  steps?: ProvenanceStep[];
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const ScoreCell = ({ value, steps, onProvenanceClick }: ScoreCellProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;

  const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (hasProvenance) {
      onProvenanceClick(steps, e.currentTarget);
    }
  };

  return (
    <td
      className={`p-2.5 text-center border-b border-gray-100 ${hasProvenance ? 'cursor-pointer underline decoration-dotted hover:bg-blue-50' : ''}`}
      onClick={handleClick}
      title={hasProvenance ? 'Click to view provenance' : undefined}
    >
      {value}
    </td>
  );
};

interface ScoreChipProps {
  label: string;
  value: string;
  steps?: ProvenanceStep[];
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const ScoreChip = ({ label, value, steps, onProvenanceClick }: ScoreChipProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasProvenance) {
      onProvenanceClick(steps, e.currentTarget);
    }
  };

  return (
    <button
      type="button"
      disabled={!hasProvenance}
      onClick={handleClick}
      className="flex-1 px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-left disabled:opacity-60 active:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </div>
      <div className="text-base font-semibold text-slate-900 mt-0.5">
        {value}
      </div>
    </button>
  );
};

interface SubtestCardProps {
  subtest: SubtestKey;
  rawScore: number | null;
  subtestResult: SubtestResult | null;
  disabled: boolean;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const SubtestCard = ({
  subtest,
  rawScore,
  subtestResult,
  disabled,
  onRawScoreChange,
  onProvenanceClick,
}: SubtestCardProps) => {
  const handleInputChange = (value: string) => {
    if (value === '') {
      onRawScoreChange(subtest, null);
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        onRawScoreChange(subtest, parsed);
      }
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-800">{SUBTEST_LABELS[subtest]}</h3>
      </header>

      <div className="mb-3">
        <label
          htmlFor={`raw-mobile-${subtest}`}
          className="block text-xs font-medium text-slate-600 mb-1"
        >
          Raw score
        </label>
        <input
          type="number"
          id={`raw-mobile-${subtest}`}
          min="0"
          value={rawScore ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder="Tap to enter"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-center text-lg font-semibold text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex gap-2">
        <ScoreChip
          label="Standard"
          value={subtestResult ? formatScore(subtestResult.standardScore) : '—'}
          steps={subtestResult?.standardScore.steps}
          onProvenanceClick={onProvenanceClick}
        />
        <ScoreChip
          label="Percentile"
          value={subtestResult ? formatPercentile(subtestResult.percentile) : '—'}
          steps={subtestResult?.percentile.steps}
          onProvenanceClick={onProvenanceClick}
        />
        <ScoreChip
          label="Age Equiv."
          value={subtestResult ? formatAgeEquivalent(subtestResult.ageEquivalent) : '—'}
          steps={subtestResult?.ageEquivalent.steps}
          onProvenanceClick={onProvenanceClick}
        />
      </div>
    </section>
  );
};

interface DomainCardProps {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const DomainCard = ({ label, result, onProvenanceClick }: DomainCardProps) => (
  <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
    <header className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
      <span className="text-xs text-slate-500">Sum: {result?.sum ?? '—'}</span>
    </header>

    <div className="flex gap-2">
      <ScoreChip
        label="Standard"
        value={result ? formatScore(result.standardScore) : '—'}
        steps={result?.standardScore.steps}
        onProvenanceClick={onProvenanceClick}
      />
      <ScoreChip
        label="Percentile"
        value={result ? formatPercentile(result.percentile) : '—'}
        steps={result?.percentile.steps}
        onProvenanceClick={onProvenanceClick}
      />
      <ScoreChip
        label="Age Equiv."
        value="—"
      />
    </div>
  </section>
);

interface SubtestRowProps {
  subtest: SubtestKey;
  rawScore: number | null;
  subtestResult: SubtestResult | null;
  disabled: boolean;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const SubtestRow = ({
  subtest,
  rawScore,
  subtestResult,
  disabled,
  onRawScoreChange,
  onProvenanceClick,
}: SubtestRowProps) => {
  const handleInputChange = (value: string) => {
    if (value === '') {
      onRawScoreChange(subtest, null);
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        onRawScoreChange(subtest, parsed);
      }
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="text-left font-medium p-2.5 border-b border-gray-100">
        <label htmlFor={`raw-${subtest}`}>{SUBTEST_LABELS[subtest]}</label>
      </td>
      <td className="p-2.5 text-center border-b border-gray-100">
        <input
          type="number"
          id={`raw-${subtest}`}
          min="0"
          value={rawScore ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder="—"
          className="w-24 p-2 border border-gray-300 rounded text-center text-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </td>
      <ScoreCell
        value={subtestResult ? formatScore(subtestResult.standardScore) : '—'}
        steps={subtestResult?.standardScore.steps}
        onProvenanceClick={onProvenanceClick}
      />
      <ScoreCell
        value={subtestResult ? formatPercentile(subtestResult.percentile) : '—'}
        steps={subtestResult?.percentile.steps}
        onProvenanceClick={onProvenanceClick}
      />
      <ScoreCell
        value={subtestResult ? formatAgeEquivalent(subtestResult.ageEquivalent) : '—'}
        steps={subtestResult?.ageEquivalent.steps}
        onProvenanceClick={onProvenanceClick}
      />
    </tr>
  );
};

const DomainRow = ({
  label,
  result,
  onProvenanceClick,
}: {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}) => (
  <tr className="composite-row bg-amber-100 font-semibold">
    <td className="text-left font-medium p-2.5 border-b border-gray-100">{label}</td>
    <td className="p-2.5 text-center border-b border-gray-100">{result?.sum ?? '—'}</td>
    <ScoreCell
      value={result ? formatScore(result.standardScore) : '—'}
      steps={result?.standardScore.steps}
      onProvenanceClick={onProvenanceClick}
    />
    <ScoreCell
      value={result ? formatPercentile(result.percentile) : '—'}
      steps={result?.percentile.steps}
      onProvenanceClick={onProvenanceClick}
    />
    <td className="p-2.5 text-center border-b border-gray-100">—</td>
  </tr>
);

interface VisibilityToggleProps {
  visibleSubtests: Set<SubtestKey>;
  visibleDomains: Set<DomainKey>;
  onSubtestToggle: (subtest: SubtestKey) => void;
  onDomainToggle: (domain: DomainKey) => void;
}

const VisibilityToggle = ({
  visibleSubtests,
  visibleDomains,
  onSubtestToggle,
  onDomainToggle,
}: VisibilityToggleProps) => (
  <details className="mb-4 text-sm group">
    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 select-none inline-flex items-center gap-1">
      <span className="group-open:rotate-90 transition-transform">▶</span>
      Customize visible rows
    </summary>
    <div className="mt-3 p-3 bg-gray-50 rounded-md space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {SUBTESTS.map((subtest) => (
          <label key={subtest} className="flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-900">
            <input
              type="checkbox"
              checked={visibleSubtests.has(subtest)}
              onChange={() => onSubtestToggle(subtest)}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs">{SUBTEST_LABELS[subtest]}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-gray-200">
        {DOMAINS.map((domain) => (
          <label key={domain} className="flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-900">
            <input
              type="checkbox"
              checked={visibleDomains.has(domain)}
              onChange={() => onDomainToggle(domain)}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs">{DOMAIN_LABELS[domain]}</span>
          </label>
        ))}
      </div>
    </div>
  </details>
);

const ScoresTable = ({
  ageMonths,
  rawScores,
  result,
  onRawScoreChange,
  onProvenanceClick,
}: ScoresTableProps) => {
  const [visibleSubtests, setVisibleSubtests] = useState<Set<SubtestKey>>(
    () => new Set(DEFAULT_VISIBLE)
  );
  const [visibleDomains, setVisibleDomains] = useState<Set<DomainKey>>(
    () => new Set(DEFAULT_VISIBLE_DOMAINS)
  );

  const isDisabled = ageMonths === null || ageMonths < 12 || ageMonths > 71;

  const handleSubtestToggle = (subtest: SubtestKey) => {
    setVisibleSubtests((prev) => {
      const next = new Set(prev);
      if (next.has(subtest)) {
        next.delete(subtest);
      } else {
        next.add(subtest);
      }
      return next;
    });
  };

  const handleDomainToggle = (domain: DomainKey) => {
    setVisibleDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  const visibleSubtestList = SUBTESTS.filter((s) => visibleSubtests.has(s));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h2 className="mt-0 mb-5 text-slate-800 font-semibold text-lg flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        Scores
      </h2>
      <VisibilityToggle
        visibleSubtests={visibleSubtests}
        visibleDomains={visibleDomains}
        onSubtestToggle={handleSubtestToggle}
        onDomainToggle={handleDomainToggle}
      />
      {isDisabled && (
        <p className="bg-red-50 border border-red-200 border-l-4 border-l-red-400 text-red-700 px-4 py-3 rounded text-sm my-3">
          Enter valid child information to enable score entry.
        </p>
      )}

      {/* Mobile: Card layout */}
      <div className="md:hidden mt-2 space-y-3">
        {visibleSubtestList.map((subtest) => (
          <SubtestCard
            key={subtest}
            subtest={subtest}
            rawScore={rawScores[subtest]}
            subtestResult={result?.subtests[subtest] ?? null}
            disabled={isDisabled}
            onRawScoreChange={onRawScoreChange}
            onProvenanceClick={onProvenanceClick}
          />
        ))}
        {visibleDomains.has('communication') && (
          <DomainCard
            label="Communication (RL+EL)"
            result={result?.domains.communication ?? null}
            onProvenanceClick={onProvenanceClick}
          />
        )}
        {visibleDomains.has('physical') && (
          <DomainCard
            label="Physical (GM+FM)"
            result={result?.domains.physical ?? null}
            onProvenanceClick={onProvenanceClick}
          />
        )}
      </div>

      {/* Desktop/Tablet: Table layout */}
      <div className="hidden md:block overflow-x-auto -mx-6 px-6">
        <table className="w-full border-collapse mt-2.5 min-w-[600px]">
        <thead>
          <tr>
            <th className="p-3 text-left border-b-2 border-indigo-100 bg-slate-50 font-semibold text-slate-700 text-sm">Sub-test</th>
            <th className="p-3 text-center border-b-2 border-indigo-100 bg-slate-50 font-semibold text-slate-700 text-sm">Raw</th>
            <th className="p-3 text-center border-b-2 border-indigo-100 bg-slate-50 font-semibold text-slate-700 text-sm">Standard Score</th>
            <th className="p-3 text-center border-b-2 border-indigo-100 bg-slate-50 font-semibold text-slate-700 text-sm">Percentile</th>
            <th className="p-3 text-center border-b-2 border-indigo-100 bg-slate-50 font-semibold text-slate-700 text-sm">Age Equiv.</th>
          </tr>
        </thead>
        <tbody>
          {visibleSubtestList.map((subtest) => (
            <SubtestRow
              key={subtest}
              subtest={subtest}
              rawScore={rawScores[subtest]}
              subtestResult={result?.subtests[subtest] ?? null}
              disabled={isDisabled}
              onRawScoreChange={onRawScoreChange}
              onProvenanceClick={onProvenanceClick}
            />
          ))}
          {visibleDomains.has('communication') && (
            <DomainRow
              label="Communication (RL+EL)"
              result={result?.domains.communication ?? null}
              onProvenanceClick={onProvenanceClick}
            />
          )}
          {visibleDomains.has('physical') && (
            <DomainRow
              label="Physical (GM+FM)"
              result={result?.domains.physical ?? null}
              onProvenanceClick={onProvenanceClick}
            />
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ScoresTable;
