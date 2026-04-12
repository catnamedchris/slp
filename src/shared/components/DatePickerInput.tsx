// DatePickerInput: Popover calendar with month/year dropdowns for easy date selection

import { useState, useRef, useEffect, useCallback } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import 'react-day-picker/style.css';

interface DatePickerInputProps {
  id: string;
  label: string;
  value: string; // ISO string "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  startMonth?: Date;
  endMonth?: Date;
}

const toDate = (iso: string): Date | undefined => {
  if (!iso) return undefined;
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
};

const formatDisplay = (iso: string): string => {
  const d = toDate(iso);
  return d ? format(d, 'MM/dd/yyyy') : '';
};

const DatePickerInput = ({
  id,
  label,
  value,
  onChange,
  onKeyDown,
  startMonth,
  endMonth,
}: DatePickerInputProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultClassNames = getDefaultClassNames();

  const selected = toDate(value);

  const handleSelect = useCallback(
    (day: Date | undefined) => {
      if (day) {
        onChange(format(day, 'yyyy-MM-dd'));
      }
      setOpen(false);
    },
    [onChange]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-[0.04em] text-text-faint">
        {label}
      </label>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="px-3 py-2 bg-input-bg border border-border-default rounded-lg text-base w-[155px] font-sans text-left cursor-pointer focus:border-primary-300 focus:shadow-[0_0_0_3px_var(--theme-focus-ring)] focus:bg-surface text-text-strong"
      >
        {formatDisplay(value) || <span className="text-text-placeholder">mm/dd/yyyy</span>}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 animate-[scaleIn_0.15s_ease-out]"
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()}`}
          aria-modal="true"
        >
          <div className="bg-surface rounded-xl shadow-elevated border border-border-default p-3">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={selected}
              captionLayout="dropdown"
              startMonth={startMonth ?? new Date(1900, 0)}
              endMonth={endMonth ?? new Date(2100, 11)}
              classNames={{
                root: `${defaultClassNames.root} rdp-custom`,
                today: 'rdp-custom-today',
                selected: 'rdp-custom-selected',
                chevron: `${defaultClassNames.chevron} fill-text-muted`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
