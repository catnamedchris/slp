// Dayc2App: Main DAYC-2 calculator component

import { useMemo } from 'react';
import ChildBar from '@/shared/components/ChildBar';
import ScoresTable from './ScoresTable';
import ProvenancePanel from './ProvenancePanel';
import ReverseLookup, { computeReverseLookup } from './ReverseLookup';
import EmptyState from './EmptyState';
import { useDayc2App } from '../hooks/useDayc2App';
import { isDayc2AgeInRange } from '../constants';
import type { ActiveSubtestKey } from '../lib/metadata';

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
    ageMonths,
    targetPercentile,
    setTargetPercentile,
    selectedProvenance,
    provenanceAnchor,
    provenanceTitle,
    isPanelOpen,
    handleRawScoreChange,
    handleSkillItemsChange,
    handleProvenanceClick,
    handleProvenanceClose,
  } = useDayc2App();

  const hasValidAge = isDayc2AgeInRange(ageMonths);

  const thresholds = useMemo(() => {
    const lookupResults = computeReverseLookup(ageMonths, targetPercentile);
    const map: Record<string, number | null> = {};
    if (lookupResults?.subtests) {
      for (const r of lookupResults.subtests) {
        map[r.subtest] = r.rawScore;
      }
    }
    return map as Record<ActiveSubtestKey, number | null>;
  }, [ageMonths, targetPercentile]);

  return (
    <div className={`transition-[margin] duration-300 ease-out ${isPanelOpen ? 'lg:mr-[420px]' : ''}`}>
      <ChildBar
        dob={dob}
        testDate={testDate}
        onDobChange={setDob}
        onTestDateChange={setTestDate}
        onClear={handleClear}
      />

      <main className="max-w-[1200px] mx-auto px-6 pt-[10px] pb-10 space-y-[10px]">
        {hasValidAge ? (
          <div className="sections-enter space-y-[10px]">
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
              thresholds={thresholds}
              onRawScoreChange={handleRawScoreChange}
              onSkillItemsChange={handleSkillItemsChange}
              onProvenanceClick={handleProvenanceClick}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      <footer className="text-center py-4">
        <p className="text-[11px] text-[#cbd5e1]">slp.scoring v0.2.0</p>
      </footer>

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
