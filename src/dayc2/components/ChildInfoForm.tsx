// ChildInfoForm: Date of birth and test date inputs with age calculation

import { format, subYears } from 'date-fns';
import { calcAgeMonths, findAgeBand } from '../lib/age';
import { createLookupContext } from '../data/context';
import { DAYC2_MIN_AGE_MONTHS, DAYC2_MAX_AGE_MONTHS } from '../constants';

interface ChildInfoFormProps {
  dob: string;
  testDate: string;
  onDobChange: (dob: string) => void;
  onTestDateChange: (testDate: string) => void;
  useAgeOverride: boolean;
  ageOverride: number | null;
  onUseAgeOverrideChange: (use: boolean) => void;
  onAgeOverrideChange: (age: number | null) => void;
}

export interface AgeInfo {
  ageMonths: number;
  ageBandLabel: string | null;
  error: string | null;
}

export const calculateAgeInfo = (dob: string, testDate: string): AgeInfo | null => {
  if (!dob || !testDate) return null;

  const ageMonths = calcAgeMonths(dob, testDate);
  const ctx = createLookupContext();
  const bTable = findAgeBand(ageMonths, ctx);

  let error: string | null = null;
  if (ageMonths < 0) {
    error = 'Test date cannot be before date of birth';
  } else if (ageMonths < DAYC2_MIN_AGE_MONTHS) {
    error = `Age ${ageMonths} months is below DAYC-2 minimum (${DAYC2_MIN_AGE_MONTHS} months)`;
  } else if (ageMonths > DAYC2_MAX_AGE_MONTHS) {
    error = `Age ${ageMonths} months is above DAYC-2 maximum (${DAYC2_MAX_AGE_MONTHS} months)`;
  }

  return {
    ageMonths,
    ageBandLabel: bTable?.source.ageBand.label ?? null,
    error,
  };
};

const ChildInfoForm = ({
  dob,
  testDate,
  onDobChange,
  onTestDateChange,
  useAgeOverride,
  ageOverride,
  onUseAgeOverrideChange,
  onAgeOverrideChange,
}: ChildInfoFormProps) => {
  const ageInfo = useAgeOverride ? null : calculateAgeInfo(dob, testDate);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Calculate max DOB (6 years before test date or today)
  const maxDob = testDate || today;
  const minDob = testDate ? format(subYears(new Date(testDate), 6), 'yyyy-MM-dd') : undefined;

  const handleToggleMode = () => {
    onUseAgeOverrideChange(!useAgeOverride);
  };

  const handleAgeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onAgeOverrideChange(null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        onAgeOverrideChange(num);
      }
    }
  };

  const overrideAgeInfo = useAgeOverride && ageOverride !== null ? (() => {
    const ctx = createLookupContext();
    const bTable = findAgeBand(ageOverride, ctx);
    let error: string | null = null;
    if (ageOverride < DAYC2_MIN_AGE_MONTHS) {
      error = `Age ${ageOverride} months is below DAYC-2 minimum (${DAYC2_MIN_AGE_MONTHS} months)`;
    } else if (ageOverride > DAYC2_MAX_AGE_MONTHS) {
      error = `Age ${ageOverride} months is above DAYC-2 maximum (${DAYC2_MAX_AGE_MONTHS} months)`;
    }
    return {
      ageMonths: ageOverride,
      ageBandLabel: bTable?.source.ageBand.label ?? null,
      error,
    };
  })() : null;

  const displayAgeInfo = useAgeOverride ? overrideAgeInfo : ageInfo;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/50">
        <h2 className="text-slate-800 font-semibold text-lg m-0">Child Information</h2>
      </div>
      <div className="p-5 overflow-hidden">
      <div className="flex flex-col gap-1 mb-4 sm:grid sm:grid-cols-[28%_1fr] sm:gap-2.5 sm:items-center">
        <label className="font-medium text-gray-600">Input Mode</label>
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <button
            type="button"
            role="switch"
            aria-checked={useAgeOverride}
            onClick={handleToggleMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              useAgeOverride ? 'bg-teal-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                useAgeOverride ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-gray-600">Enter age directly</span>
        </label>
      </div>

      {useAgeOverride ? (
        <div className="flex flex-col gap-1 mb-4 sm:grid sm:grid-cols-[28%_1fr] sm:gap-2.5 sm:items-center">
          <label htmlFor="ageOverride" className="font-medium text-gray-600">Age (months)</label>
          <input
            type="number"
            id="ageOverride"
            value={ageOverride ?? ''}
            onChange={handleAgeInputChange}
            min={DAYC2_MIN_AGE_MONTHS}
            max={DAYC2_MAX_AGE_MONTHS}
            className="px-3 py-2.5 border border-slate-300 rounded-lg text-lg sm:py-2 sm:text-sm w-full sm:max-w-[200px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 mb-4 sm:grid sm:grid-cols-[28%_1fr] sm:gap-2.5 sm:items-center">
            <label htmlFor="dob" className="font-medium text-gray-600">Birth Date</label>
            <input
              type="date"
              id="dob"
              value={dob}
              onChange={(e) => onDobChange(e.target.value)}
              max={maxDob}
              min={minDob}
              style={{ maxWidth: 'calc(100vw - 60px)' }}
              className="px-3 py-2.5 border border-slate-300 rounded-lg text-lg sm:py-2 sm:text-sm sm:w-[200px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex flex-col gap-1 mb-4 sm:grid sm:grid-cols-[28%_1fr] sm:gap-2.5 sm:items-center">
            <label htmlFor="testDate" className="font-medium text-gray-600">Test Date</label>
            <input
              type="date"
              id="testDate"
              value={testDate}
              onChange={(e) => onTestDateChange(e.target.value)}
              max={today}
              min={dob || undefined}
              style={{ maxWidth: 'calc(100vw - 60px)' }}
              className="px-3 py-2.5 border border-slate-300 rounded-lg text-lg sm:py-2 sm:text-sm sm:w-[200px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </>
      )}

      {displayAgeInfo && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg mt-4 border border-teal-100">
          <div className="text-2xl font-bold text-teal-600">{displayAgeInfo.ageMonths} months</div>
          {displayAgeInfo.ageBandLabel && (
            <div className="text-slate-600 mt-1 text-sm">Age Band: <span className="font-medium">{displayAgeInfo.ageBandLabel}</span></div>
          )}
          {displayAgeInfo.error && <div className="text-red-500 text-sm mt-1">{displayAgeInfo.error}</div>}
        </div>
      )}
      </div>
    </div>
  );
};

export default ChildInfoForm;
