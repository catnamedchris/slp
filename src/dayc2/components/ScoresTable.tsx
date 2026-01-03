// ScoresTable: Combined raw score input and results display
import type { CalculationResult, SubtestResult, DomainResult } from '../lib/calculate';
import type { SubtestKey } from '../types';
import type { ProvenanceStep } from '@/shared/lib/types';
import type { RawScores } from './RawScoresForm';
import {
  SUBTESTS,
  getSubtestDisplay,
  getDomainDisplay,
  type DomainKey,
  type SubtestScoreDisplay,
} from '../lib/scoresDisplay';
import { createRawScoreHandler } from '../lib/inputs';
import { isDayc2AgeInRange } from '../constants';

interface ScoresTableProps {
  ageMonths: number | null;
  rawScores: RawScores;
  result: CalculationResult | null;
  visibleSubtests: Set<SubtestKey>;
  visibleDomains: Set<DomainKey>;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

// Shared UI primitives

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

// Domain note badge - shared between card and row layouts
interface DomainSumBadgeProps {
  sum: string;
  note: string | null;
  showNote: boolean;
}

const DomainSumBadge = ({ sum, note, showNote }: DomainSumBadgeProps) => (
  <span className="text-xs text-slate-500" title={note ?? undefined}>
    Sum: {sum}
    {showNote && <span className="ml-1 text-amber-600 cursor-help" title={note ?? undefined}>⚠</span>}
  </span>
);

// Shared score chips renderer
interface ScoreChipsProps {
  scores: SubtestScoreDisplay[];
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const ScoreChips = ({ scores, onProvenanceClick }: ScoreChipsProps) => (
  <>
    {scores.map((score) => (
      <ScoreChip
        key={score.key}
        label={score.label}
        value={score.value}
        steps={score.steps}
        onProvenanceClick={onProvenanceClick}
      />
    ))}
  </>
);

// Shared score cells renderer for table rows
interface ScoreCellsProps {
  scores: SubtestScoreDisplay[];
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const ScoreCells = ({ scores, onProvenanceClick }: ScoreCellsProps) => (
  <>
    {scores.map((score) => (
      <ScoreCell
        key={score.key}
        value={score.value}
        steps={score.steps}
        onProvenanceClick={onProvenanceClick}
      />
    ))}
  </>
);

// Domain note row for table layout
interface DomainNoteRowProps {
  note: string;
}

const DomainNoteRow = ({ note }: DomainNoteRowProps) => (
  <tr className="bg-amber-50">
    <td colSpan={5} className="px-2.5 py-1.5 text-xs text-amber-700 border-b border-gray-100">
      ⚠ {note}
    </td>
  </tr>
);

// Domain note paragraph for card layout
interface DomainNoteParagraphProps {
  note: string;
}

const DomainNoteParagraph = ({ note }: DomainNoteParagraphProps) => (
  <p className="mt-2 text-xs text-amber-700">{note}</p>
);

// Subtest components (card + row)

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
  const handleInputChange = createRawScoreHandler(subtest, onRawScoreChange);
  const display = getSubtestDisplay(subtest, subtestResult);

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-800">{display.label}</h3>
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
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-center placeholder:text-center placeholder:text-gray-400 placeholder:font-normal text-lg font-semibold text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {display.note && (
        <p className="text-xs text-amber-600 mb-2">⚠ {display.note}</p>
      )}

      <div className="flex gap-2">
        <ScoreChips scores={display.scores} onProvenanceClick={onProvenanceClick} />
      </div>
    </section>
  );
};

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
  const handleInputChange = createRawScoreHandler(subtest, onRawScoreChange);
  const display = getSubtestDisplay(subtest, subtestResult);

  return (
    <tr className="hover:bg-gray-50">
      <td className="text-left font-medium p-2.5 border-b border-gray-100">
        <label htmlFor={`raw-${subtest}`}>
          {display.label}
          {display.note && (
            <span className="ml-1 text-amber-600 cursor-help" title={display.note}>⚠</span>
          )}
        </label>
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
          className="w-24 p-2 border border-gray-300 rounded text-center placeholder:text-center placeholder:text-gray-400 text-lg disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </td>
      <ScoreCells scores={display.scores} onProvenanceClick={onProvenanceClick} />
    </tr>
  );
};

// Domain components (card + row)

interface DomainCardProps {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const DomainCard = ({ label, result, onProvenanceClick }: DomainCardProps) => {
  const display = getDomainDisplay(result);

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
        <DomainSumBadge sum={display.sum} note={display.note} showNote={display.showNote} />
      </header>

      <div className="flex gap-2">
        <ScoreChips scores={display.scores} onProvenanceClick={onProvenanceClick} />
        <ScoreChip label="Age Equiv." value="N/A" />
      </div>
      {display.showNote && display.note && <DomainNoteParagraph note={display.note} />}
    </section>
  );
};

interface DomainRowProps {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement) => void;
}

const DomainRow = ({ label, result, onProvenanceClick }: DomainRowProps) => {
  const display = getDomainDisplay(result);

  return (
    <>
      <tr className="composite-row bg-amber-100 font-semibold">
        <td className="text-left font-medium p-2.5 border-b border-gray-100">{label}</td>
        <td className="p-2.5 text-center border-b border-gray-100" title={display.note ?? undefined}>
          {display.sum}
          {display.showNote && (
            <span className="ml-1 text-amber-600 cursor-help" title={display.note ?? undefined}>⚠</span>
          )}
        </td>
        <ScoreCells scores={display.scores} onProvenanceClick={onProvenanceClick} />
        <td className="p-2.5 text-center border-b border-gray-100">N/A</td>
      </tr>
      {display.showNote && display.note && <DomainNoteRow note={display.note} />}
    </>
  );
};

// Main component

const ScoresTable = ({
  ageMonths,
  rawScores,
  result,
  visibleSubtests,
  visibleDomains,
  onRawScoreChange,
  onProvenanceClick,
}: ScoresTableProps) => {
  const isDisabled = !isDayc2AgeInRange(ageMonths);

  const visibleSubtestList = SUBTESTS.filter((s) => visibleSubtests.has(s));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h2 className="mt-0 mb-5 text-slate-800 font-semibold text-lg flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        Scores
      </h2>
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
