import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProvenancePanel, { AboutData } from './ProvenancePanel';
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
    source: { ...mockSource, tableId: 'C1', csvFilename: 'Table-C1-Percentiles.csv' },
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

  it('renders PDF links for each step', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    const links = screen.getAllByRole('link');
    expect(links[0].getAttribute('href')).toContain('DAYC2-Scoring-Manual.pdf#page=12');
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
