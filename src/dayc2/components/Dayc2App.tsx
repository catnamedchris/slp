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
    <div className={`font-sans min-h-screen bg-slate-50 transition-[margin] duration-300 ease-out ${isPanelOpen ? 'lg:mr-[420px]' : ''}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 text-white py-6 px-5 shadow-lg mb-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-0.5">DAYC-2 Score Calculator</h1>
            <p className="text-primary-100 text-sm md:text-base opacity-90">Developmental Assessment of Young Children, Second Edition</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-5 pb-10 space-y-5">

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

      <footer className="max-w-4xl mx-auto px-5 pb-8 text-center">
        <p className="text-xs text-slate-400">DAYC-2 Score Calculator v{APP_VERSION}</p>
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
