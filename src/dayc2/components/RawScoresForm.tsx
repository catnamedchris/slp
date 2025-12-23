// RawScoresForm: Input fields for 7 DAYC-2 subtest raw scores

import type { SubtestKey } from '../types';

export type RawScores = Record<SubtestKey, number | null>;

interface RawScoresFormProps {
  rawScores: RawScores;
  onRawScoreChange: (subtest: SubtestKey, value: number | null) => void;
  disabled?: boolean;
}

const SUBTEST_LABELS: Record<SubtestKey, string> = {
  cognitive: 'Cognitive',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  socialEmotional: 'Social-Emotional',
  grossMotor: 'Gross Motor',
  fineMotor: 'Fine Motor',
  adaptiveBehavior: 'Adaptive Behavior',
};

const SUBTESTS: SubtestKey[] = [
  'cognitive',
  'receptiveLanguage',
  'expressiveLanguage',
  'socialEmotional',
  'grossMotor',
  'fineMotor',
  'adaptiveBehavior',
];

export const createEmptyRawScores = (): RawScores => ({
  cognitive: null,
  receptiveLanguage: null,
  expressiveLanguage: null,
  socialEmotional: null,
  grossMotor: null,
  fineMotor: null,
  adaptiveBehavior: null,
});

const RawScoresForm = ({
  rawScores,
  onRawScoreChange,
  disabled = false,
}: RawScoresFormProps) => {
  const handleInputChange = (subtest: SubtestKey, value: string) => {
    if (value === '') {
      onRawScoreChange(subtest, null);
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        onRawScoreChange(subtest, parsed);
      }
    }
  };

  return (
    <div className="card">
      <h2>Raw Scores</h2>
      <div className="raw-scores">
        {SUBTESTS.map((subtest) => (
          <div key={subtest} className="raw-score-item">
            <label htmlFor={`raw-${subtest}`}>{SUBTEST_LABELS[subtest]}</label>
            <input
              type="number"
              id={`raw-${subtest}`}
              min="0"
              value={rawScores[subtest] ?? ''}
              onChange={(e) => handleInputChange(subtest, e.target.value)}
              disabled={disabled}
              placeholder="—"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RawScoresForm;
