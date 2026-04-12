// SkillsSection: Able/Unable chip-input with validation and copy

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { ActiveSubtestKey } from '../lib/metadata';
import { SUBTEST_LABELS, SUBTEST_MAX_ITEM } from '../lib/metadata';
import { validateSkillItems, formatSkillCopyText, type SkillItemsInput } from '../lib/skills';
import ChipInput from './ChipInput';

interface SkillsSectionProps {
  subtest: ActiveSubtestKey;
  input: SkillItemsInput;
  onItemsChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', items: number[]) => void;
}

const SkillsSection = ({ subtest, input, onItemsChange }: SkillsSectionProps) => {
  const validation = useMemo(() => validateSkillItems(input, subtest), [input, subtest]);
  const conflictSet = useMemo(() => new Set(validation.conflicts), [validation.conflicts]);
  const outOfRangeSet = useMemo(() => new Set(validation.outOfRange), [validation.outOfRange]);
  const subtestLabel = SUBTEST_LABELS[subtest];

  return (
    <div className="p-3 px-4 flex flex-col gap-3">
      <SkillRow
        subtest={subtest}
        subtestLabel={subtestLabel}
        list="able"
        label="Able"
        labelClass="text-primary-600"
        chipClass="text-primary-700 bg-primary-50 border-primary-200"
        items={validation.ableItems}
        conflicts={conflictSet}
        outOfRange={outOfRangeSet}
        canCopy={validation.canCopyAble}
        onChange={onItemsChange}
      />
      <SkillRow
        subtest={subtest}
        subtestLabel={subtestLabel}
        list="unable"
        label="Unable"
        labelClass="text-text-muted"
        chipClass="text-text-default bg-surface-muted border-border-default"
        items={validation.unableItems}
        conflicts={conflictSet}
        outOfRange={outOfRangeSet}
        canCopy={validation.canCopyUnable}
        onChange={onItemsChange}
      />

      {/* Warnings */}
      {validation.hasConflicts && (
        <div className="text-xs text-amber-800 flex items-center gap-1" role="alert">
          <WarningIcon />
          Conflict: items {validation.conflicts.join(', ')} in both lists
        </div>
      )}
      {validation.hasOutOfRange && (
        <div className="text-xs text-red-700 flex items-center gap-1" role="alert">
          <WarningIcon />
          Invalid: items {validation.outOfRange.join(', ')} exceed max ({SUBTEST_MAX_ITEM[subtest]})
        </div>
      )}
    </div>
  );
};

interface SkillRowProps {
  subtest: ActiveSubtestKey;
  subtestLabel: string;
  list: 'able' | 'unable';
  label: string;
  labelClass: string;
  chipClass: string;
  items: number[];
  conflicts: Set<number>;
  outOfRange: Set<number>;
  canCopy: boolean;
  onChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', items: number[]) => void;
}

const SkillRow = ({
  subtest,
  subtestLabel,
  list,
  label,
  labelClass,
  chipClass,
  items,
  conflicts,
  outOfRange,
  canCopy,
  onChange,
}: SkillRowProps) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!canCopy) return;
    const copyText = formatSkillCopyText(items);
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyFeedback(true);
      feedbackTimerRef.current = setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      // Clipboard API unavailable — no-op
    }
  }, [canCopy, items]);

  const showCopyButton = items.length > 0;

  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[6px]">
        <span className={`text-sm font-bold ${labelClass}`}>{label}</span>
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            onMouseDown={(e) => e.preventDefault()}
            disabled={!canCopy}
            className={`ml-auto flex items-center gap-1 text-xs font-semibold transition-colors ${
              !canCopy
                ? 'text-text-placeholder cursor-not-allowed'
                : copyFeedback
                  ? 'text-emerald-600 cursor-pointer'
                  : 'text-primary-600 hover:text-primary-700 cursor-pointer'
            }`}
            aria-label={`Copy ${subtestLabel} ${list} items`}
            title={!canCopy ? 'Fix errors before copying' : 'Copy items'}
          >
            {copyFeedback ? (
              <span aria-live="polite">Copied!</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              </>
            )}
          </button>
        )}
      </div>
      <ChipInput
        subtest={subtest}
        subtestLabel={subtestLabel}
        list={list}
        items={items}
        conflicts={conflicts}
        outOfRange={outOfRange}
        chipClass={chipClass}
        placeholder={list === 'able' ? 'e.g. 8, 11, 14' : 'e.g. 16, 18'}
        onChange={onChange}
      />
    </div>
  );
};

const WarningIcon = () => (
  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

export default SkillsSection;
