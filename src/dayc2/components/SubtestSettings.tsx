// SubtestSettings: Shared visibility controls for subtests and domains

import type { SubtestKey } from '../types';
import {
  SUBTEST_LABELS,
  SUBTESTS,
  DOMAIN_LABELS,
  DOMAINS,
  type DomainKey,
} from './scoresDisplay';

interface SubtestSettingsProps {
  visibleSubtests: Set<SubtestKey>;
  visibleDomains: Set<DomainKey>;
  onSubtestToggle: (subtest: SubtestKey) => void;
  onDomainToggle: (domain: DomainKey) => void;
}

const SubtestSettings = ({
  visibleSubtests,
  visibleDomains,
  onSubtestToggle,
  onDomainToggle,
}: SubtestSettingsProps) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <details className="text-sm group">
      <summary className="cursor-pointer text-slate-700 hover:text-slate-900 select-none inline-flex items-center gap-1 font-medium">
        <span className="group-open:rotate-90 transition-transform">▶</span>
        Display Settings
        <span className="text-slate-400 font-normal ml-2">
          ({visibleSubtests.size} subtests, {visibleDomains.size} domains)
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Subtests</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {SUBTESTS.map((subtest) => (
              <label key={subtest} className="flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={visibleSubtests.has(subtest)}
                  onChange={() => onSubtestToggle(subtest)}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-xs">{SUBTEST_LABELS[subtest]}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Composite Domains</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {DOMAINS.map((domain) => (
              <label key={domain} className="flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={visibleDomains.has(domain)}
                  onChange={() => onDomainToggle(domain)}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-xs">{DOMAIN_LABELS[domain]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </details>
  </div>
);

export default SubtestSettings;
