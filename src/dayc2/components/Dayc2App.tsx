// Dayc2App: Main DAYC-2 calculator component

import ChildBar from '@/shared/components/ChildBar';
import ScoresTable from './ScoresTable';
import ProvenancePanel from './ProvenancePanel';
import ReverseLookup from './ReverseLookup';
import EmptyState from './EmptyState';
import { useDayc2App } from '../hooks/useDayc2App';

const Dayc2App = () => {
  const {
    dob,
    setDob,
    testDate,
    setTestDate,
    handleClear,
    rawScores,
    skillItems,
    result,
    ageInfo,
    ageMonths,
    targetPercentile,
    setTargetPercentile,
    selectedProvenance,
    provenanceAnchor,
    provenanceTitle,
    handleRawScoreChange,
    handleSkillItemsChange,
    handleProvenanceClick,
    handleProvenanceClose,
  } = useDayc2App();

  const hasValidAge = ageMonths !== null;
  const hasDatesEntered = dob !== '' || testDate !== '';

  return (
    <div>
      <ChildBar
        dob={dob}
        testDate={testDate}
        ageInfo={ageInfo}
        onDobChange={setDob}
        onTestDateChange={setTestDate}
        onClear={handleClear}
      />

      <main className="max-w-(--container-max) mx-auto px-4 pt-4 pb-10 space-y-3">
        {hasValidAge ? (
          <div className="sections-enter space-y-3">
            <ReverseLookup
              ageMonths={ageMonths}
              targetPercentile={targetPercentile}
              onTargetPercentileChange={setTargetPercentile}
              onProvenanceClick={handleProvenanceClick}
            />

            <ScoresTable
              ageMonths={ageMonths}
              rawScores={rawScores}
              skillItems={skillItems}
              result={result}
              onRawScoreChange={handleRawScoreChange}
              onSkillItemsChange={handleSkillItemsChange}
              onProvenanceClick={handleProvenanceClick}
            />
          </div>
        ) : (
          !hasDatesEntered && <EmptyState />
        )}
      </main>

      <ProvenancePanel
        title={provenanceTitle}
        selectedSteps={selectedProvenance}
        anchorElement={provenanceAnchor}
        onClose={handleProvenanceClose}
      />
    </div>
  );
};

export default Dayc2App;
