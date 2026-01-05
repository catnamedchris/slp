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
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

interface ScoreCellProps {
  value: string;
  steps?: ProvenanceStep[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoreCell = ({ value, steps, title, onProvenanceClick }: ScoreCellProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;

  const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (hasProvenance) {
      onProvenanceClick(steps, e.currentTarget, title);
    }
  };

  return (
    <td
      className={`py-4 px-3 text-center text-sm border-b border-slate-100 transition-colors ${
        hasProvenance 
          ? 'cursor-pointer text-primary-700 font-semibold underline decoration-dotted decoration-primary-300 hover:bg-primary-50' 
          : 'text-slate-400'
      }`}
      onClick={handleClick}
      title={hasProvenance ? 'Click to view calculation details' : undefined}
    >
      {value}
    </td>
  );
};

interface ScoreChipProps {
  label: string;
  value: string;
  steps?: ProvenanceStep[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoreChip = ({ label, value, steps, title, onProvenanceClick }: ScoreChipProps) => {
  const hasProvenance = steps && steps.length > 0 && onProvenanceClick;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasProvenance) {
      onProvenanceClick(steps, e.currentTarget, title);
    }
  };

  return (
    <button
      type="button"
      disabled={!hasProvenance}
      onClick={handleClick}
      className={`score-chip flex-1 px-3 py-3 rounded-xl border-2 text-left transition-all ${
        hasProvenance
          ? 'border-primary-200 bg-primary-50/50 hover:bg-primary-100 hover:border-primary-300 active:scale-[0.98]'
          : 'border-slate-200 bg-slate-50 opacity-70'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
    >
      <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">
        {label}
      </div>
      <div className={`text-xl font-bold ${hasProvenance ? 'text-primary-700' : 'text-slate-400'}`}>
        {value}
      </div>
    </button>
  );
};

interface DomainSumBadgeProps {
  sum: string;
  note: string | null;
  showNote: boolean;
}

const DomainSumBadge = ({ sum, note, showNote }: DomainSumBadgeProps) => (
  <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200" title={note ?? undefined}>
    Sum: <span className="font-semibold">{sum}</span>
    {showNote && <span className="ml-1 text-amber-600">⚠</span>}
  </span>
);

interface ScoreChipsProps {
  scores: SubtestScoreDisplay[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoreChips = ({ scores, title, onProvenanceClick }: ScoreChipsProps) => (
  <>
    {scores.map((score) => (
      <ScoreChip
        key={score.key}
        label={score.label}
        value={score.value}
        steps={score.steps}
        title={title}
        onProvenanceClick={onProvenanceClick}
      />
    ))}
  </>
);

interface ScoreCellsProps {
  scores: SubtestScoreDisplay[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoreCells = ({ scores, title, onProvenanceClick }: ScoreCellsProps) => (
  <>
    {scores.map((score) => (
      <ScoreCell
        key={score.key}
        value={score.value}
        steps={score.steps}
        title={title}
        onProvenanceClick={onProvenanceClick}
      />
    ))}
  </>
);

interface DomainNoteRowProps {
  note: string;
}

const DomainNoteRow = ({ note }: DomainNoteRowProps) => (
  <tr className="bg-amber-50/50">
    <td colSpan={5} className="px-3 py-2 text-xs text-amber-700 border-b border-slate-100">
      <span className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {note}
      </span>
    </td>
  </tr>
);

interface DomainNoteParagraphProps {
  note: string;
}

const DomainNoteParagraph = ({ note }: DomainNoteParagraphProps) => (
  <p className="mt-3 text-xs text-amber-700 flex items-center gap-1.5">
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    {note}
  </p>
);

interface SubtestCardProps {
  subtest: SubtestKey;
  rawScore: number | null;
  subtestResult: SubtestResult | null;
  disabled: boolean;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
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
    <article className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-card card-interactive animate-slide-up">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-800">{display.label}</h3>
      </header>

      <div className="mb-4">
        <label
          htmlFor={`raw-mobile-${subtest}`}
          className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
        >
          Raw Score
        </label>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          id={`raw-mobile-${subtest}`}
          min="0"
          value={rawScore ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter score"
          className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal disabled:bg-slate-100 disabled:border-dashed disabled:border-slate-300 disabled:text-slate-300 disabled:cursor-not-allowed focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </div>

      {display.note && (
        <p className="text-xs text-amber-600 mb-3 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {display.note}
        </p>
      )}

      <div className="flex gap-2">
        <ScoreChips scores={display.scores} title={display.label} onProvenanceClick={onProvenanceClick} />
      </div>
    </article>
  );
};

interface SubtestRowProps {
  subtest: SubtestKey;
  rawScore: number | null;
  subtestResult: SubtestResult | null;
  disabled: boolean;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
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
    <tr className="table-row-animate odd:bg-slate-50/50 hover:bg-primary-50/50">
      <td className="text-left text-sm text-slate-700 py-4 px-3 border-b border-slate-100 border-r border-slate-200">
        <label htmlFor={`raw-${subtest}`} className="font-medium">
          {display.label}
        </label>
        {display.note && (
          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {display.note}
          </div>
        )}
      </td>
      <td className="py-4 px-3 text-center border-b border-slate-100">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          id={`raw-${subtest}`}
          min="0"
          value={rawScore ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={disabled}
          placeholder=""
          className="w-20 py-2 px-3 border-2 border-slate-200 bg-slate-50 rounded-lg text-center text-sm font-medium placeholder:text-slate-300 disabled:bg-slate-100 disabled:border-dashed disabled:border-slate-300 disabled:text-slate-300 disabled:cursor-not-allowed focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </td>
      <ScoreCells scores={display.scores} title={display.label} onProvenanceClick={onProvenanceClick} />
    </tr>
  );
};

interface DomainCardProps {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const DomainCard = ({ label, result, onProvenanceClick }: DomainCardProps) => {
  const display = getDomainDisplay(result);

  return (
    <article className="rounded-2xl border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-amber-50/50 p-4 shadow-card animate-slide-up">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-800">{label}</h3>
        <DomainSumBadge sum={display.sum} note={display.note} showNote={display.showNote} />
      </header>

      <div className="flex gap-2">
        <ScoreChips scores={display.scores} title={label} onProvenanceClick={onProvenanceClick} />
        <ScoreChip label="Age Equiv." value="N/A" />
      </div>
      {display.showNote && display.note && <DomainNoteParagraph note={display.note} />}
    </article>
  );
};

interface DomainRowProps {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const DomainRow = ({ label, result, onProvenanceClick }: DomainRowProps) => {
  const display = getDomainDisplay(result);

  return (
    <>
      <tr className="table-row-animate bg-accent-50/50 hover:bg-accent-100/50">
        <td className="text-left text-sm font-semibold text-slate-700 py-4 px-3 border-b border-slate-100 border-r border-slate-200">
          {label}
        </td>
        <td className="py-4 px-3 text-center text-sm text-slate-700 border-b border-slate-100" title={display.note ?? undefined}>
          <span className="font-semibold">{display.sum}</span>
          {display.showNote && (
            <span className="ml-1 text-amber-600">⚠</span>
          )}
        </td>
        <ScoreCells scores={display.scores} title={label} onProvenanceClick={onProvenanceClick} />
        <td className="py-4 px-3 text-center text-sm text-slate-400 border-b border-slate-100">N/A</td>
      </tr>
      {display.showNote && display.note && <DomainNoteRow note={display.note} />}
    </>
  );
};

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
    <section className="bg-white rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h2 className="text-slate-800 font-semibold text-lg m-0">Scores</h2>
      </header>
      
      <div className="p-5">
        {isDisabled && (
          <div className="alert-warning mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-amber-800 text-sm font-medium m-0">
              Enter valid child information to enable score entry.
            </p>
          </div>
        )}

        {/* Mobile: Card layout */}
        <div className="md:hidden space-y-4">
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
        <div className="hidden md:block overflow-x-auto -mx-5 px-5">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-primary-400">
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600 w-[28%]">Subtest</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Raw</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Standard</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Percentile</th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-600">Age Eq.</th>
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
    </section>
  );
};

export default ScoresTable;
