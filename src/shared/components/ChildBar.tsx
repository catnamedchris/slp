// ChildBar: Compact child info bar with date inputs, age display, and clear

import { calculateAgeInfo } from '@/dayc2/lib/age';
import { handleEnterAdvance } from '@/shared/lib/keyboard';

interface ChildBarProps {
  dob: string;
  testDate: string;
  onDobChange: (dob: string) => void;
  onTestDateChange: (testDate: string) => void;
  onClear: () => void;
}

const formatAge = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return `${years}y ${remainder}m`;
};

const ChildBar = ({ dob, testDate, onDobChange, onTestDateChange, onClear }: ChildBarProps) => {
  const ageInfo = calculateAgeInfo(dob, testDate);

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-[10px]">
      <div className="bg-white rounded-xl shadow-card p-[10px] px-4 flex items-center gap-[14px]">
        {/* Birth Date */}
        <div className="flex flex-col gap-[1px]">
          <label htmlFor="dob" className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Birth Date
          </label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => onDobChange(e.target.value)}
            onKeyDown={handleEnterAdvance}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-[7px] text-[13px] w-[130px] font-sans text-slate-800 focus:border-primary-300 focus:shadow-[0_0_0_3px_#eef2ff] focus:bg-white"
          />
        </div>

        {/* Test Date */}
        <div className="flex flex-col gap-[1px]">
          <label htmlFor="testDate" className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Test Date
          </label>
          <input
            type="date"
            id="testDate"
            value={testDate}
            onChange={(e) => onTestDateChange(e.target.value)}
            onKeyDown={handleEnterAdvance}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-[7px] text-[13px] w-[130px] font-sans text-slate-800 focus:border-primary-300 focus:shadow-[0_0_0_3px_#eef2ff] focus:bg-white"
          />
        </div>

        {/* Age display */}
        {ageInfo && !ageInfo.error && (
          <div className="flex items-baseline gap-[5px]">
            <span className="text-xl font-extrabold text-primary-600">
              {formatAge(ageInfo.ageMonths)}
            </span>
            <span className="text-xs text-slate-500">
              ({ageInfo.ageMonths} months)
            </span>
            {ageInfo.ageBandLabel && (
              <span className="text-[10px] text-slate-400 bg-slate-50 px-[7px] py-[2px] rounded-[5px]">
                {ageInfo.ageBandLabel}
              </span>
            )}
          </div>
        )}

        {/* Error display */}
        {ageInfo?.error && (
          <span className="text-xs text-amber-700">{ageInfo.error}</span>
        )}

        {/* Clear button */}
        <button
          onClick={onClear}
          className="ml-auto px-3 py-[5px] text-[11px] font-semibold text-slate-400 border border-slate-200 rounded-[7px] bg-transparent cursor-pointer hover:text-slate-500 hover:border-slate-300 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ChildBar;
