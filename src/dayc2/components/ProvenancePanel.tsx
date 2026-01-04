// ProvenancePanel: Displays lookup provenance for transparency

import { useState, useEffect } from 'react';
import type { ProvenanceStep, SourceMeta } from '@/shared/lib/types';

interface ProvenancePanelProps {
  title?: string | null;
  selectedSteps: ProvenanceStep[] | null;
  anchorElement?: HTMLElement | null;
  onClose: () => void;
}

interface AboutDataProps {
  sources: SourceMeta[];
}

export const AboutData = ({ sources }: AboutDataProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) return null;

  const uniqueSources = sources.filter(
    (s, i, arr) => arr.findIndex((x) => x.csvFilename === s.csvFilename) === i
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-700">About the Data</span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            All scores are calculated using direct table lookups from the DAYC-2
            Examiner's Manual. No interpolation or modeling is used.
          </p>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wide border-b-2 border-teal-100 bg-slate-50 text-slate-500">Table</th>
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wide border-b-2 border-teal-100 bg-slate-50 text-slate-500">CSV File</th>
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wide border-b-2 border-teal-100 bg-slate-50 text-slate-500">SHA-256</th>
                </tr>
              </thead>
              <tbody>
                {uniqueSources.map((source) => (
                  <tr key={source.csvFilename} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 border-b border-gray-100 text-slate-700">{source.tableId}</td>
                    <td className="p-2.5 border-b border-gray-100 text-slate-600 text-xs">{source.csvFilename}</td>
                    <td className="p-2.5 border-b border-gray-100 font-mono text-xs text-slate-400" title={source.csvSha256}>
                      {source.csvSha256.substring(0, 12)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {uniqueSources.length > 0 && (
            <p className="text-xs text-slate-400 mt-3">
              Generated: {uniqueSources[0].generatorVersion}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const HIGHLIGHT_CLASS = 'bg-teal-50 shadow-[inset_0_0_0_2px_rgb(20,184,166)]';

const ProvenancePanel = ({ title, selectedSteps, anchorElement, onClose }: ProvenancePanelProps) => {
  // Add highlight class directly to anchor element - no position tracking needed
  useEffect(() => {
    if (anchorElement) {
      anchorElement.classList.add(...HIGHLIGHT_CLASS.split(' '));
      return () => {
        anchorElement.classList.remove(...HIGHLIGHT_CLASS.split(' '));
      };
    }
  }, [anchorElement]);

  if (!selectedSteps || selectedSteps.length === 0) return null;

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 bg-black/20 z-[999]"
        onClick={onClose}
      />
      {/* Panel: bottom sheet on mobile/tablet, side panel on large desktop */}
      <div className="fixed z-[1000] bg-white shadow-2xl overflow-y-auto
        bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl
        lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:w-[400px] lg:max-h-none lg:rounded-none lg:shadow-[-4px_0_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white sticky top-0">
          <div>
            {title && <h3 className="m-0 text-base font-semibold">{title}</h3>}
            <p className={`m-0 text-teal-200 ${title ? 'text-xs' : 'text-sm font-semibold text-white'}`}>How was this calculated?</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 border-none text-lg cursor-pointer text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors leading-none">
            ✕
          </button>
        </div>
        {/* Drag handle indicator for mobile/tablet */}
        <div className="lg:hidden flex justify-center py-2 -mt-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="p-5">
          {selectedSteps.map((step, index) => (
            <div key={index} className="flex gap-4 mb-5 last:mb-0">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {index + 1}
                </div>
                {index < selectedSteps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-teal-100 mt-2 rounded-full" />
                )}
              </div>
              <div className="flex-1 pb-2">
                {step.description && (
                  <div className="text-slate-800 font-medium text-sm lg:text-base">
                    {(() => {
                      const colonIndex = step.description.indexOf(':');
                      // Only split if colon exists and prefix is short (likely a label like "Cognitive")
                      if (colonIndex > 0 && colonIndex <= 25) {
                        const label = step.description.slice(0, colonIndex);
                        const rest = step.description.slice(colonIndex + 1).trim();
                        return (
                          <>
                            <span className="text-teal-600 font-semibold">{label}:</span>{' '}
                            <span className="text-slate-700">{rest}</span>
                          </>
                        );
                      }
                      return step.description;
                    })()}
                  </div>
                )}
                <div className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Table {step.tableId}</span>
                  <span className="text-slate-400">Row {step.csvRow}</span>
                </div>
                <div className="text-slate-400 text-xs mt-1 break-all">
                  {step.source.csvFilename}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProvenancePanel;
