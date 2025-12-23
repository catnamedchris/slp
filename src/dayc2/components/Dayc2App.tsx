// Dayc2App: Main DAYC-2 calculator component

import { useState, useCallback } from 'react';
import ChildInfoForm, { calculateAgeInfo } from './ChildInfoForm';
import RawScoresForm, { createEmptyRawScores } from './RawScoresForm';
import type { RawScores } from './RawScoresForm';
import ResultsTable from './ResultsTable';
import ProvenancePanel, { AboutData } from './ProvenancePanel';
import GoalPlanner from './GoalPlanner';
import { useCalculation } from '../hooks/useCalculation';
import type { SubtestKey } from '../types';
import type { ProvenanceStep, SourceMeta } from '@/shared/lib/types';
import { A1, C1, D1, BTables } from '../data';

const getAllSources = (): SourceMeta[] => {
  const sources: SourceMeta[] = [A1.source, C1.source, D1.source];
  for (const tableId of Object.keys(BTables) as Array<keyof typeof BTables>) {
    sources.push(BTables[tableId].source);
  }
  return sources;
};

const Dayc2App = () => {
  const [dob, setDob] = useState('');
  const [testDate, setTestDate] = useState('');
  const [rawScores, setRawScores] = useState<RawScores>(createEmptyRawScores);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceStep[] | null>(null);

  const ageInfo = calculateAgeInfo(dob, testDate);
  const ageMonths = ageInfo?.error ? null : ageInfo?.ageMonths ?? null;

  const { result } = useCalculation({ ageMonths, rawScores });

  const handleRawScoreChange = useCallback((subtest: SubtestKey, value: number | null) => {
    setRawScores((prev) => ({ ...prev, [subtest]: value }));
  }, []);

  const handleProvenanceClick = useCallback((steps: ProvenanceStep[]) => {
    setSelectedProvenance(steps);
  }, []);

  const handleProvenanceClose = useCallback(() => {
    setSelectedProvenance(null);
  }, []);

  const isInputDisabled = !ageInfo || !!ageInfo.error;

  return (
    <div className="dayc2-app">
      <h1>DAYC-2 Score Calculator</h1>
      <p className="subtitle">Developmental Assessment of Young Children, Second Edition</p>

      <ChildInfoForm
        dob={dob}
        testDate={testDate}
        onDobChange={setDob}
        onTestDateChange={setTestDate}
      />

      <RawScoresForm
        rawScores={rawScores}
        onRawScoreChange={handleRawScoreChange}
        disabled={isInputDisabled}
      />

      <ResultsTable result={result} onProvenanceClick={handleProvenanceClick} />

      <GoalPlanner ageMonths={ageMonths} onProvenanceClick={handleProvenanceClick} />

      <ProvenancePanel
        selectedSteps={selectedProvenance}
        onClose={handleProvenanceClose}
      />

      <AboutData sources={getAllSources()} />
    </div>
  );
};

export default Dayc2App;
