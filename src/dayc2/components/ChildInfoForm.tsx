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
    <section className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-in">
      <header className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h2 className="text-slate-800 font-semibold text-lg m-0">Child Information</h2>
      </header>
      
      <div className="p-5 space-y-4">
        {/* Input Mode Toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="font-medium text-slate-600 text-sm sm:w-32">
            Enter age directly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={useAgeOverride}
            onClick={handleToggleMode}
            className={`toggle-switch relative inline-flex h-7 w-12 shrink-0 items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              useAgeOverride ? 'bg-primary-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`toggle-knob inline-block h-5 w-5 transform rounded-full bg-white shadow-md ${
                useAgeOverride ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {useAgeOverride ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="ageOverride" className="font-medium text-slate-600 text-sm sm:w-32">
              Age (months)
            </label>
            <input
              type="number"
              id="ageOverride"
              value={ageOverride ?? ''}
              onChange={handleAgeInputChange}
              min={DAYC2_MIN_AGE_MONTHS}
              max={DAYC2_MAX_AGE_MONTHS}
              placeholder="Enter age"
              className="w-full sm:w-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label htmlFor="dob" className="font-medium text-slate-600 text-sm sm:w-32">
                Birth Date
              </label>
              <input
                type="date"
                id="dob"
                value={dob}
                onChange={(e) => onDobChange(e.target.value)}
                max={maxDob}
                min={minDob}
                className="w-full sm:w-52 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label htmlFor="testDate" className="font-medium text-slate-600 text-sm sm:w-32">
                Test Date
              </label>
              <input
                type="date"
                id="testDate"
                value={testDate}
                onChange={(e) => onTestDateChange(e.target.value)}
                max={today}
                min={dob || undefined}
                className="w-full sm:w-52 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </>
        )}

        {/* Age Result Display */}
        {displayAgeInfo && (
          <div className={`alert-info mt-4 animate-scale-in ${displayAgeInfo.error ? 'alert-warning' : ''}`}>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary-600">{displayAgeInfo.ageMonths}</span>
              <span className="text-lg text-slate-600">months</span>
            </div>
            {displayAgeInfo.ageBandLabel && (
              <p className="text-sm text-slate-600 mt-1">
                Age Band: <span className="font-semibold text-slate-700">{displayAgeInfo.ageBandLabel}</span>
              </p>
            )}
            {displayAgeInfo.error && (
              <p className="text-sm text-amber-700 mt-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {displayAgeInfo.error}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ChildInfoForm;
