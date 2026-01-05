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
    <section className="bg-white rounded-2xl shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <span className="font-semibold text-slate-800 text-lg">About the Data</span>
        </div>
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
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 section-content">
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            All scores are calculated using direct table lookups from the DAYC-2
            Examiner's Manual. No interpolation or modeling is used.
          </p>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-200 bg-slate-50 text-slate-500">Table</th>
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-200 bg-slate-50 text-slate-500">CSV File</th>
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-200 bg-slate-50 text-slate-500">SHA-256</th>
                </tr>
              </thead>
              <tbody>
                {uniqueSources.map((source) => (
                  <tr key={source.csvFilename} className="table-row-animate hover:bg-slate-50">
                    <td className="p-2.5 border-b border-slate-100 text-slate-700 font-medium">{source.tableId}</td>
                    <td className="p-2.5 border-b border-slate-100 text-slate-500 text-xs font-mono">{source.csvFilename}</td>
                    <td className="p-2.5 border-b border-slate-100 font-mono text-xs text-slate-400" title={source.csvSha256}>
                      {source.csvSha256.substring(0, 12)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {uniqueSources.length > 0 && (
            <p className="text-xs text-slate-400 mt-4">
              Generated: {uniqueSources[0].generatorVersion}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

const HIGHLIGHT_CLASS = 'bg-primary-50 ring-2 ring-primary-400 ring-inset';
const PDF_PATH = `${import.meta.env.BASE_URL}DAYC2-Scoring-Manual.pdf`;

const getPdfLink = (page: number): string => `${PDF_PATH}#page=${page}`;

const ProvenancePanel = ({ title, selectedSteps, anchorElement, onClose }: ProvenancePanelProps) => {
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[999] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel: bottom sheet on mobile, side panel on desktop */}
      <div className="provenance-panel-enter fixed z-[1000] bg-white shadow-elevated overflow-y-auto
        bottom-0 left-0 right-0 max-h-[70vh] rounded-t-3xl
        lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:w-[420px] lg:max-h-none lg:rounded-none">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white sticky top-0 z-10">
          <div>
            {title && <h3 className="m-0 text-lg font-semibold">{title}</h3>}
            <p className={`m-0 text-primary-100 ${title ? 'text-sm' : 'text-base font-semibold text-white'}`}>
              How was this calculated?
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Drag handle for mobile */}
        <div className="lg:hidden flex justify-center py-3 -mt-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>
        
        {/* Steps */}
        <div className="p-5 pt-2">
          {selectedSteps.map((step, index) => (
            <div key={index} className="flex gap-4 mb-6 last:mb-0">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
                {index < selectedSteps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-primary-200 to-primary-100 mt-3 rounded-full" />
                )}
              </div>
              <div className="flex-1 pb-2">
                {step.description && (
                  <div className="text-slate-800 font-medium text-base leading-relaxed">
                    {(() => {
                      const colonIndex = step.description.indexOf(':');
                      if (colonIndex > 0 && colonIndex <= 25) {
                        const label = step.description.slice(0, colonIndex);
                        const rest = step.description.slice(colonIndex + 1).trim();
                        return (
                          <>
                            <span className="text-primary-600 font-semibold">{label}:</span>{' '}
                            <span className="text-slate-700">{rest}</span>
                          </>
                        );
                      }
                      return step.description;
                    })()}
                  </div>
                )}
                
                {/* Manual Reference with PDF Link */}
                <a
                  href={getPdfLink(step.source.manualPage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 group-hover:text-primary-700">
                        {step.source.tableTitle}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Page {step.source.manualPage}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProvenancePanel;
