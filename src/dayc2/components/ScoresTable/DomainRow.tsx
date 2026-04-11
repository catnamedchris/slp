import type { DomainResult } from '../../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import { getDomainDisplay } from '../../lib/scoresDisplay';
import { ScoreCells, DomainNoteRow } from './ScoreHelpers';

interface DomainRowProps {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const DomainRow = ({ label, result, onProvenanceClick }: DomainRowProps) => {
  const display = getDomainDisplay(result);

  return (
    <>
      <tr className="table-row-animate bg-accent-50/50 hover:bg-accent-100/50">
        <td className="text-left text-sm font-semibold text-slate-700 py-4 px-3 border-b border-slate-100 border-r border-slate-200">
          {label}
        </td>
        <td className="py-4 px-3 text-center text-sm text-slate-700 border-b border-slate-100" title={display.note ?? undefined}>
          <span className="font-semibold">{display.sum}</span>
          {display.showNote && (
            <span className="ml-1 text-amber-600">⚠</span>
          )}
        </td>
        <ScoreCells scores={display.scores} title={label} onProvenanceClick={onProvenanceClick} />
        <td className="py-4 px-3 text-center text-sm text-slate-400 border-b border-slate-100">N/A</td>
      </tr>
      {display.showNote && display.note && <DomainNoteRow note={display.note} />}
    </>
  );
};

export default DomainRow;
