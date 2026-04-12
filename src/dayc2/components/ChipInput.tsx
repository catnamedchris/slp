// ChipInput: Inline chip-based number input with add/remove, validation states

import { useState, useCallback, useRef } from 'react';
import type { ActiveSubtestKey } from '../lib/metadata';
import { parseItemInput, addItems, removeItem } from '../lib/skills';

interface ChipInputProps {
  subtest: ActiveSubtestKey;
  subtestLabel: string;
  list: 'able' | 'unable';
  items: number[];
  conflicts: Set<number>;
  duplicates: Set<number>;
  outOfRange: Set<number>;
  chipClass: string;
  placeholder: string;
  onChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', items: number[]) => void;
}

const ChipInput = ({
  subtest,
  subtestLabel,
  list,
  items,
  conflicts,
  duplicates,
  outOfRange,
  chipClass,
  placeholder,
  onChange,
}: ChipInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commitInput = useCallback(() => {
    const parsed = parseItemInput(inputValue);
    if (parsed.length > 0) {
      onChange(subtest, list, addItems(items, parsed));
      setInputValue('');
    }
  }, [inputValue, items, subtest, list, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === ' ') {
        e.preventDefault();
        commitInput();
      } else if (e.key === 'Backspace' && inputValue === '' && items.length > 0) {
        onChange(subtest, list, items.slice(0, -1));
      }
    },
    [commitInput, inputValue, items, subtest, list, onChange],
  );

  const handleBlur = useCallback(() => {
    commitInput();
  }, [commitInput]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text');
      const parsed = parseItemInput(pasted);
      if (parsed.length > 0) {
        e.preventDefault();
        onChange(subtest, list, addItems(items, parsed));
        setInputValue('');
      }
    },
    [items, subtest, list, onChange],
  );

  const handleRemove = useCallback(
    (item: number) => {
      onChange(subtest, list, removeItem(items, item));
      inputRef.current?.focus();
    },
    [items, subtest, list, onChange],
  );

  const getChipClassName = (item: number): string => {
    if (conflicts.has(item)) {
      return 'text-amber-800 bg-amber-50 border-amber-300';
    }
    if (duplicates.has(item)) {
      return 'text-amber-800 bg-amber-50 border-amber-300';
    }
    if (outOfRange.has(item)) {
      return 'text-red-700 bg-red-50 border-red-300 border-dashed';
    }
    return chipClass;
  };

  const getChipTitle = (item: number): string | undefined => {
    if (conflicts.has(item)) return 'Conflict: item appears in both lists';
    if (duplicates.has(item)) return 'Duplicate: item entered more than once';
    if (outOfRange.has(item)) return 'Invalid: item number does not exist for this subtest';
    return undefined;
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 w-full min-h-[36px] max-h-24 overflow-y-auto py-1.5 px-2 bg-surface border border-border-default rounded-lg cursor-text focus-within:border-focus-border focus-within:shadow-[0_0_0_2px_var(--theme-focus-ring)]"
      onClick={() => inputRef.current?.focus()}
    >
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`inline-flex items-center gap-1 text-xs font-medium pl-2 pr-1 py-1 rounded-md leading-tight border ${getChipClassName(item)}`}
          title={getChipTitle(item)}
        >
          {item}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(item);
            }}
            onMouseDown={(e) => e.preventDefault()}
            className="chip-dismiss ml-0.5 w-4 h-4 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 transition-opacity cursor-pointer"
            aria-label={`Remove ${subtestLabel} ${list} item ${item}`}
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={items.length === 0 ? placeholder : ''}
        aria-label={`${subtestLabel} ${list} items`}
        className="flex-1 min-w-[40px] border-none outline-none bg-transparent text-sm font-sans text-text-strong placeholder:text-text-placeholder p-0"
      />
    </div>
  );
};

export default ChipInput;
