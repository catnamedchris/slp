import type { ProvenanceStep } from '@/shared/lib/types';
import type { SubtestScoreDisplay } from '../../lib/scoresDisplay';
import ScoreCell from './ScoreCell';
import ScoreChip from './ScoreChip';

interface DomainSumBadgeProps {
  sum: string;
  note: string | null;
  showNote: boolean;
}

export const DomainSumBadge = ({ sum, note, showNote }: DomainSumBadgeProps) => (
  <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200" title={note ?? undefined}>
    Sum: <span className="font-semibold">{sum}</span>
    {showNote && <span className="ml-1 text-amber-600">⚠</span>}
  </span>
);

interface ScoreChipsProps {
  scores: SubtestScoreDisplay[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

export const ScoreChips = ({ scores, title, onProvenanceClick }: ScoreChipsProps) => (
  <>
    {scores.map((score) => (
      <ScoreChip
        key={score.key}
        label={score.label}
        value={score.value}
        steps={score.steps}
        title={title}
        tone={score.tone}
        onProvenanceClick={onProvenanceClick}
      />
    ))}
  </>
);

interface ScoreCellsProps {
  scores: SubtestScoreDisplay[];
  title?: string;
  onProvenanceClick?: (steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => void;
}

export const ScoreCells = ({ scores, title, onProvenanceClick }: ScoreCellsProps) => (
  <>
    {scores.map((score) => (
      <ScoreCell
        key={score.key}
        value={score.value}
        steps={score.steps}
        title={title}
        tone={score.tone}
        onProvenanceClick={onProvenanceClick}
      />
    ))}
  </>
);

interface DomainNoteRowProps {
  note: string;
}

export const DomainNoteRow = ({ note }: DomainNoteRowProps) => (
  <tr className="bg-amber-50/50">
    <td colSpan={5} className="px-3 py-2 text-xs text-amber-700 border-b border-slate-100">
      <span className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {note}
      </span>
    </td>
  </tr>
);

interface DomainNoteParagraphProps {
  note: string;
}

export const DomainNoteParagraph = ({ note }: DomainNoteParagraphProps) => (
  <p className="mt-3 text-xs text-amber-700 flex items-center gap-1.5">
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    {note}
  </p>
);
