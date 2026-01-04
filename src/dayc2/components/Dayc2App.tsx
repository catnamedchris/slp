// Dayc2App: Main DAYC-2 calculator component

import { useState, useCallback } from 'react';
import ChildInfoForm, { calculateAgeInfo } from './ChildInfoForm';
import { createEmptyRawScores } from './RawScoresForm';
import type { RawScores } from './RawScoresForm';
import ScoresTable from './ScoresTable';
import DisplaySettings from './DisplaySettings';
import ProvenancePanel, { AboutData } from './ProvenancePanel';
import ReverseLookup from './ReverseLookup';
import { useCalculation } from '../hooks/useCalculation';
import type { SubtestKey } from '../types';
import { DEFAULT_VISIBLE_SUBTESTS, DEFAULT_VISIBLE_DOMAINS, type DomainKey } from '../lib/scoresDisplay';
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
  const [useAgeOverride, setUseAgeOverride] = useState(false);
  const [ageOverride, setAgeOverride] = useState<number | null>(null);
  const [rawScores, setRawScores] = useState<RawScores>(createEmptyRawScores);
  const [visibleSubtests, setVisibleSubtests] = useState<Set<SubtestKey>>(
    () => new Set(DEFAULT_VISIBLE_SUBTESTS)
  );
  const [visibleDomains, setVisibleDomains] = useState<Set<DomainKey>>(
    () => new Set(DEFAULT_VISIBLE_DOMAINS)
  );
  const [targetPercentile, setTargetPercentile] = useState(6);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceStep[] | null>(null);
  const [provenanceAnchor, setProvenanceAnchor] = useState<HTMLElement | null>(null);
  const [provenanceTitle, setProvenanceTitle] = useState<string | null>(null);

  const ageInfo = useAgeOverride ? null : calculateAgeInfo(dob, testDate);
  const ageMonths = useAgeOverride ? ageOverride : (ageInfo?.error ? null : ageInfo?.ageMonths ?? null);

  const { result } = useCalculation({ ageMonths, rawScores });

  const handleRawScoreChange = useCallback((subtest: SubtestKey, value: number | null) => {
    setRawScores((prev) => ({ ...prev, [subtest]: value }));
  }, []);

  const handleSubtestToggle = useCallback((subtest: SubtestKey) => {
    setVisibleSubtests((prev) => {
      const next = new Set(prev);
      if (next.has(subtest)) {
        next.delete(subtest);
      } else {
        next.add(subtest);
      }
      return next;
    });
  }, []);

  const handleDomainToggle = useCallback((domain: DomainKey) => {
    setVisibleDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }, []);

  const handleProvenanceClick = useCallback((steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => {
    setSelectedProvenance(steps);
    setProvenanceAnchor(anchorElement);
    setProvenanceTitle(title ?? null);
  }, []);

  const handleProvenanceClose = useCallback(() => {
    setSelectedProvenance(null);
    setProvenanceAnchor(null);
    setProvenanceTitle(null);
  }, []);

  const isPanelOpen = selectedProvenance !== null && selectedProvenance.length > 0;

  return (
    <div className={`font-sans min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 transition-[margin] duration-200 ${isPanelOpen ? 'lg:mr-[420px]' : ''}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-6 px-5 shadow-lg mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">DAYC-2 Score Calculator</h1>
          <p className="text-teal-200 text-sm md:text-base">Developmental Assessment of Young Children, Second Edition</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pb-10 space-y-6">

      <ChildInfoForm
        dob={dob}
        testDate={testDate}
        onDobChange={setDob}
        onTestDateChange={setTestDate}
        useAgeOverride={useAgeOverride}
        ageOverride={ageOverride}
        onUseAgeOverrideChange={(use) => {
          setUseAgeOverride(use);
          if (!use) {
            setRawScores(createEmptyRawScores());
          }
        }}
        onAgeOverrideChange={setAgeOverride}
      />

      <DisplaySettings
        visibleSubtests={visibleSubtests}
        visibleDomains={visibleDomains}
        onSubtestToggle={handleSubtestToggle}
        onDomainToggle={handleDomainToggle}
      />

      <ScoresTable
        ageMonths={ageMonths}
        rawScores={rawScores}
        result={result}
        visibleSubtests={visibleSubtests}
        visibleDomains={visibleDomains}
        onRawScoreChange={handleRawScoreChange}
        onProvenanceClick={handleProvenanceClick}
      />

      <ReverseLookup
        ageMonths={ageMonths}
        targetPercentile={targetPercentile}
        visibleSubtests={visibleSubtests}
        onTargetPercentileChange={setTargetPercentile}
        onProvenanceClick={handleProvenanceClick}
      />

        <AboutData sources={getAllSources()} />
      </main>

      <footer className="max-w-4xl mx-auto px-5 pb-6 text-center text-xs text-slate-400">
        <p>DAYC-2 Score Calculator v{APP_VERSION}</p>
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

const APP_VERSION = __APP_VERSION__;

export default Dayc2App;
