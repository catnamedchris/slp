import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultsTable from './ResultsTable';
import type { CalculationResult } from '../lib/calculate';
import type { SourceMeta } from '@/shared/lib/types';

const mockSource: SourceMeta = {
  tableId: 'B13',
  csvFilename: 'test.csv',
  csvSha256: 'test-sha',
  generatedAt: '2025-01-01T00:00:00Z',
  generatorVersion: 'test@1.0.0',
};

const mockResult: CalculationResult = {
  ageMonths: 24,
  subtests: {
    cognitive: {
      rawScore: 25,
      standardScore: { value: { value: 100 }, steps: [{ tableId: 'B17', csvRow: 10, source: mockSource }] },
      percentile: { value: { value: 50 }, steps: [{ tableId: 'C1', csvRow: 20, source: mockSource }] },
      ageEquivalent: { value: { value: 24 }, steps: [{ tableId: 'A1', csvRow: 5, source: mockSource }] },
    },
    receptiveLanguage: {
      rawScore: 20,
      standardScore: { value: { value: 95 }, steps: [] },
      percentile: { value: { value: 37 }, steps: [] },
      ageEquivalent: { value: { value: 22 }, steps: [] },
    },
    expressiveLanguage: {
      rawScore: 18,
      standardScore: { value: { value: 90 }, steps: [] },
      percentile: { value: { value: 25 }, steps: [] },
      ageEquivalent: { value: { value: 21 }, steps: [] },
    },
    socialEmotional: {
      rawScore: 22,
      standardScore: { value: { value: 105 }, steps: [] },
      percentile: { value: { value: 63 }, steps: [] },
      ageEquivalent: { value: { value: 25 }, steps: [] },
    },
    grossMotor: {
      rawScore: 30,
      standardScore: { value: { value: 110 }, steps: [] },
      percentile: { value: { value: 75 }, steps: [] },
      ageEquivalent: { value: { value: 26 }, steps: [] },
    },
    fineMotor: {
      rawScore: 28,
      standardScore: { value: { value: 108 }, steps: [] },
      percentile: { value: { value: 70 }, steps: [] },
      ageEquivalent: { value: { value: 25 }, steps: [] },
    },
    adaptiveBehavior: {
      rawScore: 24,
      standardScore: { value: { value: 98 }, steps: [] },
      percentile: { value: { value: 45 }, steps: [] },
      ageEquivalent: { value: { value: 23 }, steps: [] },
    },
  },
  domains: {
    communication: {
      sum: 185,
      standardScore: { value: { value: 92 }, steps: [] },
      percentile: { value: { value: 30 }, steps: [] },
    },
    physical: {
      sum: 218,
      standardScore: { value: { value: 109 }, steps: [] },
      percentile: { value: { value: 73 }, steps: [] },
    },
  },
};

describe('ResultsTable component', () => {
  it('shows placeholder when no result', () => {
    render(<ResultsTable result={null} />);
    expect(screen.getByText(/Enter child information/)).toBeInTheDocument();
  });

  it('renders all 7 subtest rows', () => {
    render(<ResultsTable result={mockResult} />);
    expect(screen.getByText('Cognitive')).toBeInTheDocument();
    expect(screen.getByText('Receptive Language')).toBeInTheDocument();
    expect(screen.getByText('Expressive Language')).toBeInTheDocument();
    expect(screen.getByText('Social-Emotional')).toBeInTheDocument();
    expect(screen.getByText('Gross Motor')).toBeInTheDocument();
    expect(screen.getByText('Fine Motor')).toBeInTheDocument();
    expect(screen.getByText('Adaptive Behavior')).toBeInTheDocument();
  });

  it('renders domain composite rows', () => {
    render(<ResultsTable result={mockResult} />);
    expect(screen.getByText('Communication (RL+EL)')).toBeInTheDocument();
    expect(screen.getByText('Physical (GM+FM)')).toBeInTheDocument();
  });

  it('displays raw scores', () => {
    render(<ResultsTable result={mockResult} />);
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
  });

  it('displays standard scores', () => {
    render(<ResultsTable result={mockResult} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays percentiles', () => {
    render(<ResultsTable result={mockResult} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('displays age equivalents', () => {
    render(<ResultsTable result={mockResult} />);
    expect(screen.getAllByText('24').length).toBeGreaterThan(0);
  });

  it('displays domain sum', () => {
    render(<ResultsTable result={mockResult} />);
    expect(screen.getByText('185')).toBeInTheDocument(); // communication sum
  });

  it('calls onProvenanceClick when cell with provenance is clicked', () => {
    const onProvenanceClick = vi.fn();
    render(<ResultsTable result={mockResult} onProvenanceClick={onProvenanceClick} />);
    
    const clickableCells = document.querySelectorAll('.clickable');
    expect(clickableCells.length).toBeGreaterThan(0);
    
    fireEvent.click(clickableCells[0]);
    expect(onProvenanceClick).toHaveBeenCalled();
  });
});

describe('ResultsTable score coloring', () => {
  it('applies score-low class for scores below 85', () => {
    const lowScoreResult: CalculationResult = {
      ...mockResult,
      subtests: {
        ...mockResult.subtests,
        cognitive: {
          ...mockResult.subtests.cognitive,
          standardScore: { value: { value: 70 }, steps: [] },
        },
      },
    };
    render(<ResultsTable result={lowScoreResult} />);
    expect(document.querySelector('.score-low')).toBeInTheDocument();
  });

  it('applies score-high class for scores above 115', () => {
    const highScoreResult: CalculationResult = {
      ...mockResult,
      subtests: {
        ...mockResult.subtests,
        cognitive: {
          ...mockResult.subtests.cognitive,
          standardScore: { value: { value: 130 }, steps: [] },
        },
      },
    };
    render(<ResultsTable result={highScoreResult} />);
    expect(document.querySelector('.score-high')).toBeInTheDocument();
  });
});
