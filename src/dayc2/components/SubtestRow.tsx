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
  thresholdRawScore: number | null;
  skillItemsInput: SkillItemsInput;
  onRawScoreChange: (subtest: ActiveSubtestKey, value: number | null) => void;
  onSkillItemsChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', value: string) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const TONE_TEXT: Record<SemanticTone, string> = {
  neutral: 'text-[#cbd5e1]',
  low: 'text-rose-600',
  average: 'text-primary-700',
  high: 'text-emerald-600',
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
  thresholdRawScore,
  skillItemsInput,
  onRawScoreChange,
  onSkillItemsChange,
  onProvenanceClick,
}: SubtestRowProps) => {
  const handleInputChange = createRawScoreHandler(subtest, onRawScoreChange);
  const display = getSubtestDisplay(subtest, subtestResult);

  return (
    <div className="grid grid-cols-[280px_1fr] border-b border-[#f1f5f9] last:border-b-0">
      {/* Left: scores */}
      <div className="p-3 border-r border-[#f1f5f9] flex flex-col gap-2">
        {/* Header row */}
        <div className="flex items-center gap-[6px]">
          <span className="text-[13px] font-bold text-slate-800">{display.label}</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.06em] text-primary-500 bg-primary-50 px-[6px] py-[2px] rounded-full">
            {SUBTEST_ABBREVS[subtest]}
          </span>
          {thresholdRawScore !== null && (
            <span className="text-[9px] text-slate-400 font-medium ml-auto whitespace-nowrap">
              need <strong className="font-bold text-slate-500">{thresholdRawScore}</strong>
            </span>
          )}
        </div>

        {/* Score grid */}
        <div className="flex gap-[2px] items-center">
          {/* Raw input cell */}
          <div className="flex-1 text-center">
            <div className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-[2px]">Raw</div>
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
              className="w-[46px] h-[30px] bg-slate-50 border border-slate-200 rounded-[7px] text-center text-sm font-bold font-sans text-slate-800 placeholder:text-[#cbd5e1] placeholder:font-normal disabled:text-slate-300 disabled:cursor-not-allowed focus:border-[#a5b4fc] focus:bg-white focus:shadow-[0_0_0_3px_#eef2ff] focus:outline-none"
            />
          </div>

          {/* Computed score cells */}
          {display.scores.map((score) => {
            const hasProvenance = score.steps.length > 0 && onProvenanceClick;
            const toneClass = hasProvenance ? TONE_TEXT[score.tone] : 'text-[#cbd5e1]';

            return (
              <div key={score.key} className="flex-1 text-center">
                <div className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-[2px]">
                  {SCORE_LABELS[score.key] ?? score.label}
                </div>
                <div
                  className={`text-sm font-bold ${toneClass} ${hasProvenance ? 'cursor-pointer hover:opacity-80' : ''}`}
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
          <div className="text-[10px] text-amber-600 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {display.note}
          </div>
        )}
      </div>

      {/* Right: skills */}
      <SkillsSection
        subtest={subtest}
        input={skillItemsInput}
        onItemsChange={onSkillItemsChange}
      />
    </div>
  );
};

export default SubtestRow;
