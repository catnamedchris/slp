import type { SubtestResult } from '../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import type { ActiveSubtestKey } from '../lib/scoresDisplay';
import type { SkillItemsInput } from '../lib/skills';
import {
  getSubtestDisplay,
  SUBTEST_ABBREVS,
  type SemanticTone,
} from '../lib/scoresDisplay';
import { createRawScoreHandler } from '../lib/inputs';
import { handleEnterAdvance } from '@/shared/lib/keyboard';
import SkillsSection from './SkillsSection';

interface SubtestRowProps {
  subtest: ActiveSubtestKey;
  rawScore: number | null;
  subtestResult: SubtestResult | null;
  disabled: boolean;
  skillItemsInput: SkillItemsInput;
  onRawScoreChange: (subtest: ActiveSubtestKey, value: number | null) => void;
  onSkillItemsChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', items: number[]) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const TONE_CLASSES: Record<SemanticTone, string> = {
  neutral: 'text-text-placeholder',
  low: 'text-score-low',
  average: 'text-text-strong',
  high: 'text-score-high',
};

const SCORE_LABELS: Record<string, string> = {
  standardScore: 'SS',
  percentile: '%ile',
  ageEquivalent: 'Age Eq.',
};

const SubtestRow = ({
  subtest,
  rawScore,
  subtestResult,
  disabled,
  skillItemsInput,
  onRawScoreChange,
  onSkillItemsChange,
  onProvenanceClick,
}: SubtestRowProps) => {
  const handleInputChange = createRawScoreHandler(subtest, onRawScoreChange);
  const display = getSubtestDisplay(subtest, subtestResult);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[var(--score-grid-width)_1fr] border-b border-border-subtle last:border-b-0 transition-colors has-[input:focus]:bg-primary-50/30">
      {/* Left: scores — prominent */}
      <div className="p-3 px-4 md:border-r border-border-subtle flex flex-col gap-1.5">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-text-strong">{display.label}</span>
          <span className="text-xs font-bold uppercase tracking-[0.04em] text-primary-500 bg-primary-50 px-2 py-[2px] rounded-full">
            {SUBTEST_ABBREVS[subtest]}
          </span>
        </div>

        {/* Score grid */}
        <div className="flex gap-3 items-start">
          {/* Raw input cell */}
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.04em] text-text-faint mb-1">Raw</div>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              id={`raw-${subtest}`}
              min="0"
              value={rawScore ?? ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleEnterAdvance}
              disabled={disabled}
              placeholder="—"
              className="w-14 h-10 bg-input-bg border border-border-default rounded-lg text-center text-lg font-bold font-sans text-text-strong placeholder:text-text-placeholder placeholder:font-normal disabled:text-text-placeholder disabled:cursor-not-allowed focus:border-focus-border focus:bg-surface focus:shadow-[0_0_0_3px_var(--theme-focus-ring)] focus:outline-none"
            />
          </div>

          {/* Computed score cells */}
          {display.scores.map((score) => {
            const hasProvenance = score.steps.length > 0 && onProvenanceClick;
            const toneClass = hasProvenance ? TONE_CLASSES[score.tone] : 'text-text-placeholder';

            return (
              <div key={score.key} className="flex-1 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.04em] text-text-faint mb-1">
                  {SCORE_LABELS[score.key] ?? score.label}
                </div>
                <div
                  key={score.value}
                  className={`h-10 flex items-center justify-center text-xl font-bold score-value whitespace-nowrap ${score.value !== '—' ? 'animate-value-in' : ''} ${toneClass} ${hasProvenance ? 'cursor-pointer hover:opacity-80' : ''} ${score.value === '—' ? 'select-none' : ''}`}
                  onClick={
                    hasProvenance
                      ? (e: React.MouseEvent<HTMLDivElement>) => {
                          onProvenanceClick(score.steps, e.currentTarget, display.label);
                        }
                      : undefined
                  }
                  title={hasProvenance ? 'Tap to view calculation' : undefined}
                >
                  {score.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note (e.g. raw score exceeds table max) */}
        {display.note && (
          <div className="text-xs text-amber-800 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {display.note}
          </div>
        )}
      </div>

      {/* Right: skills — recessed */}
      <div className="bg-surface-recessed">
        <SkillsSection
          subtest={subtest}
          input={skillItemsInput}
          onItemsChange={onSkillItemsChange}
        />
      </div>
    </div>
  );
};

export default SubtestRow;
