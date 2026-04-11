import type { DomainResult } from '../../lib/calculate';
import type { ProvenanceStep } from '@/shared/lib/types';
import { getDomainDisplay } from '../../lib/scoresDisplay';
import { DomainSumBadge, ScoreChips, DomainNoteParagraph } from './ScoreHelpers';

interface DomainCardProps {
  label: string;
  result: DomainResult | null;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

const DomainCard = ({ label, result, onProvenanceClick }: DomainCardProps) => {
  const display = getDomainDisplay(result);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card animate-slide-up">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-800">{label}<span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">Composite</span></h3>
        <DomainSumBadge sum={display.sum} note={display.note} showNote={display.showNote} />
      </header>

      <div className="flex gap-2">
        <ScoreChips scores={display.scores} title={label} onProvenanceClick={onProvenanceClick} />
      </div>
      {display.showNote && display.note && <DomainNoteParagraph note={display.note} />}
    </article>
  );
};

export default DomainCard;
