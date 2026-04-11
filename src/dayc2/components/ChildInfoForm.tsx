// ChildInfoForm: Date of birth and test date inputs with age calculation

import { format, subYears } from 'date-fns';
import { calculateAgeInfo } from '../lib/age';

interface ChildInfoFormProps {
  dob: string;
  testDate: string;
  onDobChange: (dob: string) => void;
  onTestDateChange: (testDate: string) => void;
}

const ChildInfoForm = ({
  dob,
  testDate,
  onDobChange,
  onTestDateChange,
}: ChildInfoFormProps) => {
  const ageInfo = calculateAgeInfo(dob, testDate);
  const today = format(new Date(), 'yyyy-MM-dd');

  const maxDob = testDate || today;
  const minDob = testDate ? format(subYears(new Date(testDate), 6), 'yyyy-MM-dd') : undefined;

  return (
    <section className="bg-white rounded-2xl shadow-card p-4 animate-fade-in">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label htmlFor="dob" className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Birth Date
          </label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => onDobChange(e.target.value)}
            max={maxDob}
            min={minDob}
            className="w-full px-3 py-2.5 bg-slate-100 border-0 rounded-xl text-base text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="testDate" className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Test Date
          </label>
          <input
            type="date"
            id="testDate"
            value={testDate}
            onChange={(e) => onTestDateChange(e.target.value)}
            max={today}
            min={dob || undefined}
            className="w-full px-3 py-2.5 bg-slate-100 border-0 rounded-xl text-base text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Age Result Display */}
      {ageInfo && (
        <div className={`mt-3 flex items-baseline gap-2 px-1 ${ageInfo.error ? 'alert-warning' : ''}`}>
          <span className="text-2xl font-bold text-primary-600">{ageInfo.ageMonths}</span>
          <span className="text-sm text-slate-500">months</span>
          {ageInfo.ageBandLabel && (
            <span className="text-sm text-slate-400">· {ageInfo.ageBandLabel}</span>
          )}
          {ageInfo.error && (
            <p className="text-sm text-amber-700 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {ageInfo.error}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default ChildInfoForm;
