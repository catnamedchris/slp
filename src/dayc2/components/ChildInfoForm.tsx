// ChildInfoForm: Date of birth and test date inputs with age calculation

import { calcAgeMonths, findAgeBand } from '../lib/age';
import { createLookupContext } from '../data/context';

interface ChildInfoFormProps {
  dob: string;
  testDate: string;
  onDobChange: (dob: string) => void;
  onTestDateChange: (testDate: string) => void;
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

const ChildInfoForm = ({
  dob,
  testDate,
  onDobChange,
  onTestDateChange,
}: ChildInfoFormProps) => {
  const ageInfo = calculateAgeInfo(dob, testDate);

  return (
    <div className="card">
      <h2>Child Information</h2>
      <div className="form-row">
        <label htmlFor="dob">Date of Birth</label>
        <input
          type="date"
          id="dob"
          value={dob}
          onChange={(e) => onDobChange(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="testDate">Test Date</label>
        <input
          type="date"
          id="testDate"
          value={testDate}
          onChange={(e) => onTestDateChange(e.target.value)}
        />
      </div>

      {ageInfo && (
        <div className="age-display">
          <div className="age-months">{ageInfo.ageMonths} months</div>
          {ageInfo.ageBandLabel && (
            <div className="age-band">Age Band: {ageInfo.ageBandLabel}</div>
          )}
          {ageInfo.error && <div className="error">{ageInfo.error}</div>}
        </div>
      )}
    </div>
  );
};

export default ChildInfoForm;
