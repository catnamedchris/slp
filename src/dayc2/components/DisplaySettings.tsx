// DisplaySettings: Visibility controls for subtests and domains

import { useState } from 'react';
import type { SubtestKey } from '../types';
import {
  SUBTEST_LABELS,
  SUBTESTS,
  DOMAIN_LABELS,
  DOMAINS,
  type DomainKey,
} from '../lib/scoresDisplay';

interface DisplaySettingsProps {
  visibleSubtests: Set<SubtestKey>;
  visibleDomains: Set<DomainKey>;
  onSubtestToggle: (subtest: SubtestKey) => void;
  onDomainToggle: (domain: DomainKey) => void;
}

const DisplaySettings = ({
  visibleSubtests,
  visibleDomains,
  onSubtestToggle,
  onDomainToggle,
}: DisplaySettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white rounded-2xl shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-lg">Display Settings</span>
            <span className="text-slate-400 text-sm ml-3 hidden sm:inline">
              {visibleSubtests.size} subtests, {visibleDomains.size} domains
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs sm:hidden">
            {visibleSubtests.size + visibleDomains.size} selected
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-5 section-content">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Subtests</div>
            <div className="flex flex-wrap gap-2">
              {SUBTESTS.map((subtest) => (
                <label
                  key={subtest}
                  className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                    visibleSubtests.has(subtest)
                      ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={visibleSubtests.has(subtest)}
                    onChange={() => onSubtestToggle(subtest)}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    visibleSubtests.has(subtest)
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white border-slate-300'
                  }`}>
                    {visibleSubtests.has(subtest) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {SUBTEST_LABELS[subtest]}
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Composite Domains</div>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((domain) => (
                <label
                  key={domain}
                  className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                    visibleDomains.has(domain)
                      ? 'bg-accent-50 border-accent-300 text-accent-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={visibleDomains.has(domain)}
                    onChange={() => onDomainToggle(domain)}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    visibleDomains.has(domain)
                      ? 'bg-accent-500 border-accent-500'
                      : 'bg-white border-slate-300'
                  }`}>
                    {visibleDomains.has(domain) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {DOMAIN_LABELS[domain]}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DisplaySettings;
