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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div>
          <span className="font-semibold text-slate-800 text-lg">Display Settings</span>
          <span className="text-slate-400 text-sm ml-3">
            {visibleSubtests.size} subtests, {visibleDomains.size} domains
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Subtests</div>
            <div className="flex flex-wrap gap-2">
              {SUBTESTS.map((subtest) => (
                <label
                  key={subtest}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    visibleSubtests.has(subtest)
                      ? 'bg-teal-50 border-teal-200 text-teal-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={visibleSubtests.has(subtest)}
                    onChange={() => onSubtestToggle(subtest)}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                    visibleSubtests.has(subtest)
                      ? 'bg-teal-500 border-teal-500'
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
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Composite Domains</div>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((domain) => (
                <label
                  key={domain}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    visibleDomains.has(domain)
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={visibleDomains.has(domain)}
                    onChange={() => onDomainToggle(domain)}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                    visibleDomains.has(domain)
                      ? 'bg-amber-500 border-amber-500'
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
    </div>
  );
};

export default DisplaySettings;
