import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProvenancePanel, { AboutData, resolveManualPage } from './ProvenancePanel';
import type { ProvenanceStep, SourceMeta } from '@/shared/lib/types';

const mockSource: SourceMeta = {
  tableId: 'B17',
  tableTitle: 'Table B.17 Raw Scores to Standard Scores: Ages 22–24 Months',
  manualPage: 12,
  csvFilename: 'Table-B17-Raw-Scores.csv',
  csvSha256: 'abc123def456789012345678901234567890123456789012345678901234',
  generatedAt: '2025-01-01T00:00:00Z',
  generatorVersion: 'csvToJson@1.0.0',
};

const mockSteps: ProvenanceStep[] = [
  {
    tableId: 'B17',
    csvRow: 25,
    source: mockSource,
    description: 'raw 20 → SS 100',
  },
  {
    tableId: 'C1',
    csvRow: 50,
    source: { ...mockSource, tableId: 'C1', manualPage: 38, csvFilename: 'Table-C1-Percentiles.csv' },
    description: 'SS 100 → 50th percentile',
  },
];

describe('ProvenancePanel', () => {
  it('returns null when selectedSteps is null', () => {
    const { container } = render(
      <ProvenancePanel selectedSteps={null} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when selectedSteps is empty', () => {
    const { container } = render(
      <ProvenancePanel selectedSteps={[]} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders panel header', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    expect(screen.getByText('How was this calculated?')).toBeInTheDocument();
  });

  it('renders all provenance steps with table titles and page numbers', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    const titles = screen.getAllByText('Table B.17 Raw Scores to Standard Scores: Ages 22–24 Months');
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Page 12').length).toBeGreaterThanOrEqual(1);
  });

  it('renders step descriptions', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    expect(screen.getByText('raw 20 → SS 100')).toBeInTheDocument();
    expect(screen.getByText('SS 100 → 50th percentile')).toBeInTheDocument();
  });

  it('renders PDF links with correct page for each step', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    const links = screen.getAllByRole('link');
    expect(links[0].getAttribute('href')).toContain('DAYC2-Scoring-Manual.pdf#page=12');
    expect(links[1].getAttribute('href')).toContain('DAYC2-Scoring-Manual.pdf#page=38');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={onClose} />);
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  describe('resize handling', () => {
    let originalInnerWidth: number;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
      vi.useFakeTimers();
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true,
      });
      vi.useRealTimers();
    });

    it('updates windowWidth on resize', async () => {
      const mockAnchor = document.createElement('div');
      mockAnchor.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        left: 50,
        right: 150,
        bottom: 120,
        width: 100,
        height: 20,
        x: 50,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

      render(
        <ProvenancePanel
          selectedSteps={mockSteps}
          anchorElement={mockAnchor}
          onClose={() => {}}
        />
      );

      act(() => {
        vi.advanceTimersByTime(300);
      });

      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(screen.queryByRole('img', { hidden: true })).toBeNull();
    });
  });
});

describe('AboutData', () => {
  it('returns null when sources is empty', () => {
    const { container } = render(<AboutData sources={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders collapsed by default', () => {
    render(<AboutData sources={[mockSource]} />);
    expect(screen.getByText(/About the Data/)).toBeInTheDocument();
    expect(screen.queryByText(/direct table lookups/)).not.toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    render(<AboutData sources={[mockSource]} />);
    fireEvent.click(screen.getByText(/About the Data/));
    expect(screen.getByText(/direct table lookups/)).toBeInTheDocument();
  });

  it('shows source table information when expanded', () => {
    render(<AboutData sources={[mockSource]} />);
    fireEvent.click(screen.getByText(/About the Data/));
    expect(screen.getByText('B17')).toBeInTheDocument();
    expect(screen.getByText('Table-B17-Raw-Scores.csv')).toBeInTheDocument();
  });

  it('shows truncated SHA-256', () => {
    render(<AboutData sources={[mockSource]} />);
    fireEvent.click(screen.getByText(/About the Data/));
    expect(screen.getByText('abc123def456…')).toBeInTheDocument();
  });

  it('shows generator version', () => {
    render(<AboutData sources={[mockSource]} />);
    fireEvent.click(screen.getByText(/About the Data/));
    expect(screen.getByText(/csvToJson@1.0.0/)).toBeInTheDocument();
  });

  it('deduplicates sources by filename', () => {
    const sources = [mockSource, mockSource, mockSource];
    render(<AboutData sources={sources} />);
    fireEvent.click(screen.getByText(/About the Data/));
    const rows = screen.getAllByText('Table-B17-Raw-Scores.csv');
    expect(rows.length).toBe(1);
  });
});

describe('resolveManualPage', () => {
  const makeStep = (tableId: string, csvRow: number | null, manualPage: number): ProvenanceStep => ({
    tableId,
    csvRow,
    source: { ...mockSource, tableId, manualPage },
  });

  it('returns first page for B17 row on page 1 (rawScore 36 → csvRow 38)', () => {
    expect(resolveManualPage(makeStep('B17', 38, 12))).toBe(12);
  });

  it('returns second page for B17 row on page 2 (rawScore 37 → csvRow 39)', () => {
    expect(resolveManualPage(makeStep('B17', 39, 12))).toBe(13);
  });

  it('returns first page for A1 row on page 1 (ageMonths 25 → csvRow 27)', () => {
    expect(resolveManualPage(makeStep('A1', 27, 1))).toBe(1);
  });

  it('returns second page for A1 row on page 2 (ageMonths 26 → csvRow 28)', () => {
    expect(resolveManualPage(makeStep('A1', 28, 1))).toBe(2);
  });

  it('returns third page for A1 row on page 3 (ageMonths 52 → csvRow 54)', () => {
    expect(resolveManualPage(makeStep('A1', 54, 1))).toBe(3);
  });

  it('falls back to source.manualPage for single-page tables (C1)', () => {
    expect(resolveManualPage(makeStep('C1', 10, 38))).toBe(38);
  });

  it('falls back to source.manualPage when csvRow is null', () => {
    expect(resolveManualPage(makeStep('B17', null, 12))).toBe(12);
  });

  it('resolves correctly for B29 page 2 (rawScore 59 → csvRow 61)', () => {
    expect(resolveManualPage(makeStep('B29', 61, 36))).toBe(37);
  });

  // Exhaustive boundary test: last row on page 1 and first row on page 2 for every B table
  const bTableBoundaries: Array<{ tableId: string; startPage: number; lastCsvRowPage1: number }> = [
    { tableId: 'B13', startPage: 4,  lastCsvRowPage1: 37 },
    { tableId: 'B14', startPage: 6,  lastCsvRowPage1: 37 },
    { tableId: 'B15', startPage: 8,  lastCsvRowPage1: 37 },
    { tableId: 'B16', startPage: 10, lastCsvRowPage1: 37 },
    { tableId: 'B17', startPage: 12, lastCsvRowPage1: 38 },
    { tableId: 'B18', startPage: 14, lastCsvRowPage1: 40 },
    { tableId: 'B19', startPage: 16, lastCsvRowPage1: 40 },
    { tableId: 'B20', startPage: 18, lastCsvRowPage1: 42 },
    { tableId: 'B21', startPage: 20, lastCsvRowPage1: 43 },
    { tableId: 'B22', startPage: 22, lastCsvRowPage1: 47 },
    { tableId: 'B23', startPage: 24, lastCsvRowPage1: 50 },
    { tableId: 'B24', startPage: 26, lastCsvRowPage1: 51 },
    { tableId: 'B25', startPage: 28, lastCsvRowPage1: 54 },
    { tableId: 'B26', startPage: 30, lastCsvRowPage1: 55 },
    { tableId: 'B27', startPage: 32, lastCsvRowPage1: 58 },
    { tableId: 'B28', startPage: 34, lastCsvRowPage1: 59 },
    { tableId: 'B29', startPage: 36, lastCsvRowPage1: 60 },
  ];

  it.each(bTableBoundaries)(
    '$tableId: last row on page 1 (csvRow $lastCsvRowPage1) → page $startPage',
    ({ tableId, startPage, lastCsvRowPage1 }) => {
      expect(resolveManualPage(makeStep(tableId, lastCsvRowPage1, startPage))).toBe(startPage);
    }
  );

  it.each(bTableBoundaries)(
    '$tableId: first row on page 2 (csvRow $lastCsvRowPage1+1) → page $startPage+1',
    ({ tableId, startPage, lastCsvRowPage1 }) => {
      expect(resolveManualPage(makeStep(tableId, lastCsvRowPage1 + 1, startPage))).toBe(startPage + 1);
    }
  );
});
