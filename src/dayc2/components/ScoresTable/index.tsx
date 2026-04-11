import type { CalculationResult } from '../../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import type { RawScores } from '../../lib/rawScores';
import type { ActiveSubtestKey } from '../../lib/scoresDisplay';
import type { AllSkillItems } from '../../lib/skills';
import { isDayc2AgeInRange } from '../../constants';
import SubtestRow from '../SubtestRow';
import CompositeFooter from '../CompositeFooter';

interface ScoresTableProps {
  ageMonths: number | null;
  rawScores: RawScores;
  skillItems: AllSkillItems;
  result: CalculationResult | null;
  thresholds?: Record<ActiveSubtestKey, number | null>;
  onRawScoreChange: (subtest: ActiveSubtestKey, value: number | null) => void;
  onSkillItemsChange: (subtest: ActiveSubtestKey, list: 'able' | 'unable', value: string) => void;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const ScoresTable = ({
  ageMonths,
  rawScores,
  skillItems,
  result,
  thresholds,
  onRawScoreChange,
  onSkillItemsChange,
  onProvenanceClick,
}: ScoresTableProps) => {
  const isDisabled = !isDayc2AgeInRange(ageMonths);

  return (
    <>
      {/* Communication Group: RL + EL + Composite */}
      <div className="bg-white rounded-[14px] shadow-card overflow-hidden mb-[10px]">
        <SubtestRow
          subtest="receptiveLanguage"
          rawScore={rawScores.receptiveLanguage}
          subtestResult={result?.subtests.receptiveLanguage ?? null}
          disabled={isDisabled}
          thresholdRawScore={thresholds?.receptiveLanguage ?? null}
          skillItemsInput={skillItems.receptiveLanguage}
          onRawScoreChange={onRawScoreChange}
          onSkillItemsChange={onSkillItemsChange}
          onProvenanceClick={onProvenanceClick}
        />
        <SubtestRow
          subtest="expressiveLanguage"
          rawScore={rawScores.expressiveLanguage}
          subtestResult={result?.subtests.expressiveLanguage ?? null}
          disabled={isDisabled}
          thresholdRawScore={thresholds?.expressiveLanguage ?? null}
          skillItemsInput={skillItems.expressiveLanguage}
          onRawScoreChange={onRawScoreChange}
          onSkillItemsChange={onSkillItemsChange}
          onProvenanceClick={onProvenanceClick}
        />
        <CompositeFooter
          result={result?.domains.communication ?? null}
          onProvenanceClick={onProvenanceClick}
        />
      </div>

      {/* SE standalone */}
      <div className="bg-white rounded-[14px] shadow-card overflow-hidden mb-[10px]">
        <SubtestRow
          subtest="socialEmotional"
          rawScore={rawScores.socialEmotional}
          subtestResult={result?.subtests.socialEmotional ?? null}
          disabled={isDisabled}
          thresholdRawScore={thresholds?.socialEmotional ?? null}
          skillItemsInput={skillItems.socialEmotional}
          onRawScoreChange={onRawScoreChange}
          onSkillItemsChange={onSkillItemsChange}
          onProvenanceClick={onProvenanceClick}
        />
      </div>
    </>
  );
};

export default ScoresTable;
