// ChildBar: Compact child info bar with date inputs, age display, and clear

import { useState, useEffect, useCallback } from 'react';
import type { AgeInfo } from '@/dayc2/lib/age';
import DatePickerInput from './DatePickerInput';

interface ChildBarProps {
  dob: string;
  testDate: string;
  ageInfo: AgeInfo | null;
  onDobChange: (dob: string) => void;
  onTestDateChange: (testDate: string) => void;
  onClear: () => void;
}

const formatAge = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return `${years}yr ${remainder}mo`;
};

const CONFIRM_TIMEOUT_MS = 3000;

const ChildBar = ({ dob, testDate, ageInfo, onDobChange, onTestDateChange, onClear }: ChildBarProps) => {
  const [clearPending, setClearPending] = useState(false);

  useEffect(() => {
    if (!clearPending) return;
    const timer = setTimeout(() => setClearPending(false), CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [clearPending]);

  const handleClearClick = useCallback(() => {
    setClearPending(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setClearPending(false);
    onClear();
  }, [onClear]);

  const handleCancel = useCallback(() => {
    setClearPending(false);
  }, []);

  return (
    <div className="max-w-(--container-max) mx-auto px-4 pt-4">
      <div className="bg-surface rounded-xl shadow-card p-3 px-4 flex flex-col gap-2">
        {/* Row 1: Date inputs + Clear */}
        <div className="flex items-end gap-4">
          <DatePickerInput
            id="dob"
            label="Birth Date"
            value={dob}
            onChange={onDobChange}
          />

          <DatePickerInput
            id="testDate"
            label="Test Date"
            value={testDate}
            onChange={onTestDateChange}
          />

          {/* Clear button with inline confirmation */}
          {clearPending ? (
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 text-sm font-semibold text-rose-600 border border-rose-200 rounded-lg bg-rose-50 cursor-pointer hover:bg-rose-100"
              >
                Confirm?
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-semibold text-text-faint border border-border-default rounded-lg bg-transparent cursor-pointer hover:bg-input-bg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleClearClick}
              className="ml-auto px-3 py-1.5 text-sm font-semibold text-text-faint border border-border-default rounded-lg bg-transparent cursor-pointer hover:text-text-muted hover:border-border-default hover:bg-input-bg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Row 2: Age display */}
        {ageInfo && !ageInfo.error && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-text-strong">
              {ageInfo.ageMonths} mo
            </span>
            <span className="text-sm text-text-muted">
              ({formatAge(ageInfo.ageMonths)})
            </span>
            {ageInfo.ageBandLabel && (
              <span className="text-xs text-text-faint bg-input-bg px-2 py-[2px] rounded-md">
                {ageInfo.ageBandLabel}
              </span>
            )}

          </div>
        )}

        {ageInfo?.error && (
          <span className="text-sm text-amber-700" role="alert">{ageInfo.error}</span>
        )}
      </div>
    </div>
  );
};

export default ChildBar;
