// ChildInfoForm: Date of birth and test date inputs with age calculation

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse, subYears } from 'date-fns';
import { calcAgeMonths, findAgeBand } from '../lib/age';
import { createLookupContext } from '../data/context';

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

const DAYC2_MIN_AGE = 12;
const DAYC2_MAX_AGE = 71;

export const calculateAgeInfo = (dob: string, testDate: string): AgeInfo | null => {
  if (!dob || !testDate) return null;

  const ageMonths = calcAgeMonths(dob, testDate);
  const ctx = createLookupContext();
  const bTable = findAgeBand(ageMonths, ctx);

  let error: string | null = null;
  if (ageMonths < 0) {
    error = 'Test date cannot be before date of birth';
  } else if (ageMonths < DAYC2_MIN_AGE) {
    error = `Age ${ageMonths} months is below DAYC-2 minimum (${DAYC2_MIN_AGE} months)`;
  } else if (ageMonths > DAYC2_MAX_AGE) {
    error = `Age ${ageMonths} months is above DAYC-2 maximum (${DAYC2_MAX_AGE} months)`;
  }

  return {
    ageMonths,
    ageBandLabel: bTable?.source.ageBand.label ?? null,
    error,
  };
};

const parseISODate = (isoString: string): Date | null => {
  if (!isoString) return null;
  try {
    return parse(isoString, 'yyyy-MM-dd', new Date());
  } catch {
    return null;
  }
};

const formatToISO = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
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
  const today = new Date();

  const dobDate = parseISODate(dob);
  const testDateDate = parseISODate(testDate);

  const handleDobChange = (date: Date | null) => {
    onDobChange(formatToISO(date));
  };

  const handleTestDateChange = (date: Date | null) => {
    onTestDateChange(formatToISO(date));
  };

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
    if (ageOverride < DAYC2_MIN_AGE) {
      error = `Age ${ageOverride} months is below DAYC-2 minimum (${DAYC2_MIN_AGE} months)`;
    } else if (ageOverride > DAYC2_MAX_AGE) {
      error = `Age ${ageOverride} months is above DAYC-2 maximum (${DAYC2_MAX_AGE} months)`;
    }
    return {
      ageMonths: ageOverride,
      ageBandLabel: bTable?.source.ageBand.label ?? null,
      error,
    };
  })() : null;

  const displayAgeInfo = useAgeOverride ? overrideAgeInfo : ageInfo;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h2 className="mt-0 mb-5 text-slate-800 font-semibold text-lg flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        Child Information
      </h2>
      
      <div className="grid grid-cols-[180px_1fr] gap-2.5 mb-3 items-center">
        <label className="font-medium text-gray-600">Input Mode</label>
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={useAgeOverride}
            onChange={handleToggleMode}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-gray-600">Enter age directly</span>
        </label>
      </div>

      {useAgeOverride ? (
        <div className="grid grid-cols-[180px_1fr] gap-2.5 mb-3 items-center">
          <label htmlFor="ageOverride" className="font-medium text-gray-600">Age (months)</label>
          <input
            type="number"
            id="ageOverride"
            value={ageOverride ?? ''}
            onChange={handleAgeInputChange}
            min={DAYC2_MIN_AGE}
            max={DAYC2_MAX_AGE}
            className="px-3 py-2 border border-gray-300 rounded text-base w-full max-w-[200px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[180px_1fr] gap-2.5 mb-3 items-center">
            <label htmlFor="dob" className="font-medium text-gray-600">Birth Date</label>
            <DatePicker
              id="dob"
              selected={dobDate}
              onChange={handleDobChange}
              dateFormat="MM/dd/yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              maxDate={testDateDate ?? undefined}
              minDate={testDateDate ? subYears(testDateDate, 6) : undefined}
              placeholderText="Select date of birth"
              className="px-3 py-2 border border-gray-300 rounded text-base w-full max-w-[200px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-2.5 mb-3 items-center">
            <label htmlFor="testDate" className="font-medium text-gray-600">Test Date</label>
            <DatePicker
              id="testDate"
              selected={testDateDate}
              onChange={handleTestDateChange}
              dateFormat="MM/dd/yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              maxDate={today}
              minDate={dobDate ?? undefined}
              placeholderText="Select test date"
              className="px-3 py-2 border border-gray-300 rounded text-base w-full max-w-[200px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </>
      )}

      {displayAgeInfo && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg mt-5 border border-indigo-100">
          <div className="text-2xl font-bold text-indigo-600">{displayAgeInfo.ageMonths} months</div>
          {displayAgeInfo.ageBandLabel && (
            <div className="text-slate-600 mt-1 text-sm">Age Band: <span className="font-medium">{displayAgeInfo.ageBandLabel}</span></div>
          )}
          {displayAgeInfo.error && <div className="text-red-500 text-sm mt-1">{displayAgeInfo.error}</div>}
        </div>
      )}
    </div>
  );
};

export default ChildInfoForm;
