// DisplaySettingsSheet: Bottom sheet version of display settings

import type { SubtestKey } from '../types';
import {
  SUBTEST_LABELS,
  SUBTESTS,
  DOMAIN_LABELS,
  DOMAINS,
  type DomainKey,
} from '../lib/scoresDisplay';
import { AboutData } from './ProvenancePanel';
import type { SourceMeta } from '@/shared/lib/types';

interface DisplaySettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  visibleSubtests: Set<SubtestKey>;
  visibleDomains: Set<DomainKey>;
  onSubtestToggle: (subtest: SubtestKey) => void;
  onDomainToggle: (domain: DomainKey) => void;
  sources: SourceMeta[];
}

const DisplaySettingsSheet = ({
  isOpen,
  onClose,
  visibleSubtests,
  visibleDomains,
  onSubtestToggle,
  onDomainToggle,
  sources,
}: DisplaySettingsSheetProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[999] animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="provenance-panel-enter fixed z-[1000] bg-white shadow-elevated bottom-0 left-0 right-0 max-h-[70vh] rounded-t-3xl overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-lg font-semibold text-slate-800 m-0">Display Settings</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-5">
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

          {sources.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <AboutData sources={sources} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DisplaySettingsSheet;
