import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProvenancePanel, { AboutData } from './ProvenancePanel';
import type { ProvenanceStep, SourceMeta } from '@/shared/lib/types';

const mockSource: SourceMeta = {
  tableId: 'B17',
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

  it('renders lookup path header', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    expect(screen.getByText('Lookup Path')).toBeInTheDocument();
  });

  it('renders all provenance steps', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    expect(screen.getByText('Table B17, Row 25')).toBeInTheDocument();
    expect(screen.getByText('Table C1, Row 50')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    expect(screen.getByText('raw 20 → SS 100')).toBeInTheDocument();
    expect(screen.getByText('SS 100 → 50th percentile')).toBeInTheDocument();
  });

  it('renders source filenames', () => {
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={() => {}} />);
    expect(screen.getByText('Table-B17-Raw-Scores.csv')).toBeInTheDocument();
    expect(screen.getByText('Table-C1-Percentiles.csv')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ProvenancePanel selectedSteps={mockSteps} onClose={onClose} />);
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalled();
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
