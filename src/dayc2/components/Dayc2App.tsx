// Dayc2App: Main DAYC-2 calculator component

import { useState } from 'react';
import ChildInfoForm from './ChildInfoForm';
import ScoresTable from './ScoresTable';
import DisplaySettingsSheet from './DisplaySettingsSheet';
import ProvenancePanel from './ProvenancePanel';
import ReverseLookup from './ReverseLookup';
import EmptyState from './EmptyState';
import { useDayc2App } from '../hooks/useDayc2App';
import type { SourceMeta } from '@/shared/lib/types';
import { A1, C1, D1, BTables } from '../data';
import { isDayc2AgeInRange } from '../constants';

const getAllSources = (): SourceMeta[] => {
  const sources: SourceMeta[] = [A1.source, C1.source, D1.source];
  for (const tableId of Object.keys(BTables) as Array<keyof typeof BTables>) {
    sources.push(BTables[tableId].source);
  }
  return sources;
};

const Dayc2App = () => {
  const {
    dob,
    setDob,
    testDate,
    setTestDate,
    rawScores,
    result,
    ageMonths,
    visibleSubtests,
    visibleDomains,
    targetPercentile,
    setTargetPercentile,
    selectedProvenance,
    provenanceAnchor,
    provenanceTitle,
    isPanelOpen,
    handleRawScoreChange,
    handleSubtestToggle,
    handleDomainToggle,
    handleProvenanceClick,
    handleProvenanceClose,
  } = useDayc2App();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasValidAge = isDayc2AgeInRange(ageMonths);

  return (
    <div className={`font-sans min-h-screen bg-gradient-to-b from-slate-50 to-white transition-[margin] duration-300 ease-out ${isPanelOpen ? 'lg:mr-[420px]' : ''}`}>
      {/* Header — minimal logotype */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium tracking-[0.12em] uppercase text-primary-700 m-0">dayc</h1>
            <p className="text-[10px] text-slate-400 -mt-0.5 leading-tight">DAYC-2 Score Calculator</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Settings gear */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Display settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center">{visibleSubtests.size + visibleDomains.size}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-5 pt-4 pb-10 space-y-4">
        <ChildInfoForm
          dob={dob}
          testDate={testDate}
          onDobChange={setDob}
          onTestDateChange={setTestDate}
        />

        {hasValidAge ? (
          <div className="sections-enter space-y-4">
            <ReverseLookup
              ageMonths={ageMonths}
              targetPercentile={targetPercentile}
              visibleSubtests={visibleSubtests}
              onTargetPercentileChange={setTargetPercentile}
              onProvenanceClick={handleProvenanceClick}
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
          </div>
        ) : (
          <EmptyState />
        )}

      </main>

      <footer className="max-w-4xl mx-auto px-5 pb-8 text-center">
        <p className="text-xs text-slate-400">dayc v{APP_VERSION}</p>
      </footer>

      <DisplaySettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        visibleSubtests={visibleSubtests}
        visibleDomains={visibleDomains}
        onSubtestToggle={handleSubtestToggle}
        onDomainToggle={handleDomainToggle}
        sources={getAllSources()}
      />

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
