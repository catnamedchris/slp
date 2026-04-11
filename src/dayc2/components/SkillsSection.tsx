// SkillsSection: Able/Unable item input with validation, chips, and copy

import { useState, useMemo, useCallback } from 'react';
import type { ActiveSubtestKey } from '../lib/scoresDisplay';
import { validateSkillItems, type SkillItemsInput } from '../lib/skills';
import { handleEnterAdvance } from '@/shared/lib/keyboard';

interface SkillsSectionProps {
  subtest: ActiveSubtestKey;
  input: SkillItemsInput;
  onItemsChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', value: string) => void;
}

const SkillsSection = ({ subtest, input, onItemsChange }: SkillsSectionProps) => {
  const validation = useMemo(() => validateSkillItems(input), [input]);

  return (
    <div className="p-3 flex gap-[14px]">
      <SkillColumn
        subtest={subtest}
        list="able"
        label="✓ Able to"
        labelClass="text-[#059669]"
        chipClass="text-[#065f46] bg-[#ecfdf5] border-[#a7f3d0]"
        value={input.able}
        items={validation.ableItems}
        conflicts={validation.conflicts}
        canCopy={validation.canCopyAble}
        copyText={validation.formatCopyText('able')}
        onChange={onItemsChange}
      />
      <SkillColumn
        subtest={subtest}
        list="unable"
        label="✗ Unable to"
        labelClass="text-[#e11d48]"
        chipClass="text-[#9f1239] bg-[#fff1f2] border-[#fecdd3]"
        value={input.unable}
        items={validation.unableItems}
        conflicts={validation.conflicts}
        canCopy={validation.canCopyUnable}
        copyText={validation.formatCopyText('unable')}
        onChange={onItemsChange}
      />
    </div>
  );
};

interface SkillColumnProps {
  subtest: ActiveSubtestKey;
  list: 'able' | 'unable';
  label: string;
  labelClass: string;
  chipClass: string;
  value: string;
  items: number[];
  conflicts: number[];
  canCopy: boolean;
  copyText: string;
  onChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', value: string) => void;
}

const SkillColumn = ({
  subtest,
  list,
  label,
  labelClass,
  chipClass,
  value,
  items,
  conflicts,
  canCopy,
  copyText,
  onChange,
}: SkillColumnProps) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const conflictSet = useMemo(() => new Set(conflicts), [conflicts]);

  const handleCopy = useCallback(async () => {
    if (!canCopy || !copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      // Fallback: select the input text so user can Ctrl+C
      const input = document.querySelector<HTMLInputElement>(
        `[aria-label="${subtest} ${list} items"]`
      );
      if (input) {
        input.select();
      }
    }
  }, [canCopy, copyText, subtest, list]);

  return (
    <div className="flex-1 flex flex-col gap-[5px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold ${labelClass}`}>{label}</span>
        <button
          type="button"
          disabled={!canCopy}
          onClick={handleCopy}
          className={`text-[10px] font-semibold rounded-[6px] px-2 py-[3px] flex items-center gap-[3px] border transition-colors ${
            canCopy
              ? 'text-slate-500 bg-white border-slate-200 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 cursor-pointer'
              : 'text-[#cbd5e1] bg-white border-[#f1f5f9] cursor-default'
          }`}
        >
          {copyFeedback ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(subtest, list, e.target.value)}
        onKeyDown={handleEnterAdvance}
        placeholder={list === 'able' ? 'e.g. 8, 11, 14' : 'e.g. 16, 18'}
        aria-label={`${subtest} ${list} items`}
        className="w-full py-[5px] px-[9px] bg-white border border-[#e2e8f0] rounded-[7px] text-xs font-sans text-slate-800 placeholder:text-[#cbd5e1] focus:border-[#a5b4fc] focus:shadow-[0_0_0_2px_#eef2ff] focus:outline-none"
      />

      {/* Chips or empty hint */}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {items.map((item) => {
            const isConflict = conflictSet.has(item);
            return (
              <span
                key={item}
                className={`text-[11px] font-medium px-2 py-[3px] rounded-[6px] leading-tight border ${
                  isConflict
                    ? 'text-amber-800 bg-amber-50 border-amber-300'
                    : chipClass
                }`}
                title={isConflict ? 'Conflict: item appears in both lists' : undefined}
              >
                {isConflict && '⚠ '}
                Item {item}
              </span>
            );
          })}
        </div>
      ) : (
        <span className="text-[11px] text-[#cbd5e1] italic">Enter item numbers</span>
      )}

      {/* Conflict warning */}
      {conflicts.length > 0 && (
        <div className="text-[10px] text-amber-600 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          Conflict: items {conflicts.join(', ')} in both lists
        </div>
      )}
    </div>
  );
};

export default SkillsSection;
