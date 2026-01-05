import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoresTable from './ScoresTable';
import { createEmptyRawScores } from './RawScoresForm';
import type { CalculationResult } from '../lib/calculate';
import type { SubtestKey } from '../types';
import { DEFAULT_VISIBLE_SUBTESTS, DEFAULT_VISIBLE_DOMAINS, type DomainKey } from '../lib/scoresDisplay';

const defaultVisibleSubtests = new Set<SubtestKey>(DEFAULT_VISIBLE_SUBTESTS);
const defaultVisibleDomains = new Set<DomainKey>(DEFAULT_VISIBLE_DOMAINS);

// Helper to find raw score input by subtest (mobile uses raw-mobile-{key}, desktop uses raw-{key})
const getRawScoreInput = (subtest: string) => {
  const mobileInput = document.getElementById(`raw-mobile-${subtest}`);
  const desktopInput = document.getElementById(`raw-${subtest}`);
  return mobileInput || desktopInput;
};

const mockResult: CalculationResult = {
  ageMonths: 24,
  subtests: {
    cognitive: {
      rawScore: 25,
      standardScore: { value: { value: 100 }, steps: [] },
      percentile: { value: { value: 50 }, steps: [] },
      ageEquivalent: { value: { value: 24 }, steps: [] },
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
      ageEquivalent: { value: { value: 20 }, steps: [] },
    },
    socialEmotional: {
      rawScore: 22,
      standardScore: { value: { value: 105 }, steps: [] },
      percentile: { value: { value: 63 }, steps: [] },
      ageEquivalent: { value: { value: 26 }, steps: [] },
    },
    grossMotor: {
      rawScore: null,
      standardScore: { value: null, steps: [] },
      percentile: { value: null, steps: [] },
      ageEquivalent: { value: null, steps: [] },
    },
    fineMotor: {
      rawScore: null,
      standardScore: { value: null, steps: [] },
      percentile: { value: null, steps: [] },
      ageEquivalent: { value: null, steps: [] },
    },
    adaptiveBehavior: {
      rawScore: null,
      standardScore: { value: null, steps: [] },
      percentile: { value: null, steps: [] },
      ageEquivalent: { value: null, steps: [] },
    },
  },
  domains: {
    communication: {
      sum: { type: 'exact', value: 185 },
      standardScore: { value: { value: 92 }, steps: [] },
      percentile: { value: { value: 30 }, steps: [] },
    },
    physical: {
      sum: null,
      standardScore: { value: null, steps: [] },
      percentile: { value: null, steps: [] },
    },
  },
};

describe('ScoresTable', () => {
  it('renders the Scores heading', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );
    expect(screen.getByText('Scores')).toBeInTheDocument();
  });

  it('shows only default subtests (RL, EL, SE) initially', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );
    expect(getRawScoreInput('receptiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('expressiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('socialEmotional')).toBeInTheDocument();
    expect(getRawScoreInput('cognitive')).not.toBeInTheDocument();
    expect(getRawScoreInput('grossMotor')).not.toBeInTheDocument();
    expect(getRawScoreInput('fineMotor')).not.toBeInTheDocument();
    expect(getRawScoreInput('adaptiveBehavior')).not.toBeInTheDocument();
  });

  it('hides domain rows when not in visibleDomains', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={new Set()}
        onRawScoreChange={() => {}}
      />
    );
    expect(screen.queryAllByText('Communication (RL+EL)')).toHaveLength(0);
    expect(screen.queryAllByText('Physical (GM+FM)')).toHaveLength(0);
  });

  it('shows Physical domain row when in visibleDomains', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={new Set<DomainKey>(['physical'])}
        onRawScoreChange={() => {}}
      />
    );
    // May appear in both mobile (h3) and desktop (td) layouts
    expect(screen.getAllByText('Physical (GM+FM)').length).toBeGreaterThan(0);
  });

  it('shows Communication domain row when in visibleDomains', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={new Set<DomainKey>(['communication'])}
        onRawScoreChange={() => {}}
      />
    );
    // May appear in both mobile (h3) and desktop (td) layouts
    expect(screen.getAllByText('Communication (RL+EL)').length).toBeGreaterThan(0);
  });

  it('disables inputs when ageMonths is null', () => {
    render(
      <ScoresTable
        ageMonths={null}
        rawScores={createEmptyRawScores()}
        result={null}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );
    expect(getRawScoreInput('receptiveLanguage')).toBeDisabled();
  });

  it('enables inputs when ageMonths is valid', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );
    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });

  it('shows hint when age is invalid', () => {
    render(
      <ScoresTable
        ageMonths={null}
        rawScores={createEmptyRawScores()}
        result={null}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );
    expect(screen.getByText(/Enter valid child information/)).toBeInTheDocument();
  });

  it('calls onRawScoreChange when input value changes', () => {
    const onRawScoreChange = vi.fn();
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={onRawScoreChange}
      />
    );
    const input = getRawScoreInput('receptiveLanguage');
    fireEvent.change(input!, { target: { value: '20' } });
    expect(onRawScoreChange).toHaveBeenCalledWith('receptiveLanguage', 20);
  });

  it('displays results for visible scores', () => {
    const rawScores = {
      ...createEmptyRawScores(),
      receptiveLanguage: 20,
      expressiveLanguage: 18,
      socialEmotional: 22,
    };
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={rawScores}
        result={mockResult}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );
    expect(screen.getAllByText('95').length).toBeGreaterThan(0);
    expect(screen.getAllByText('37%').length).toBeGreaterThan(0);
  });

  it('displays warning icon when subtest has a note', () => {
    const resultWithNote: CalculationResult = {
      ...mockResult,
      subtests: {
        ...mockResult.subtests,
        receptiveLanguage: {
          ...mockResult.subtests.receptiveLanguage,
          standardScore: {
            value: { value: 120 },
            steps: [],
            note: 'Raw score 50 exceeds table max (30). Using 30 instead.',
          },
        },
      },
    };
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={resultWithNote}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );
    // Warning message should be visible (mobile and desktop show full note text)
    expect(screen.getAllByText(/Raw score 50 exceeds table max/).length).toBeGreaterThan(0);
  });

  it('displays bounded sum with < prefix', () => {
    const resultWithBoundedSum: CalculationResult = {
      ...mockResult,
      domains: {
        ...mockResult.domains,
        communication: {
          sum: { type: 'lt', value: 145 },
          standardScore: { value: { bound: 'lt', value: 41 }, steps: [] },
          percentile: { value: null, steps: [] },
        },
      },
    };
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={resultWithBoundedSum}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={new Set<DomainKey>(['communication'])}
        onRawScoreChange={() => {}}
      />
    );

    expect(screen.getAllByText('<145').length).toBeGreaterThan(0);
    expect(screen.getAllByText('<41').length).toBeGreaterThan(0);
  });

  it('displays bounded sum with > prefix', () => {
    const resultWithBoundedSum: CalculationResult = {
      ...mockResult,
      domains: {
        ...mockResult.domains,
        communication: {
          sum: { type: 'gt', value: 300 },
          standardScore: { value: { bound: 'gt', value: 159 }, steps: [] },
          percentile: { value: null, steps: [] },
        },
      },
    };
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={resultWithBoundedSum}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={new Set<DomainKey>(['communication'])}
        onRawScoreChange={() => {}}
      />
    );

    expect(screen.getAllByText('>300').length).toBeGreaterThan(0);
    expect(screen.getAllByText('>159').length).toBeGreaterThan(0);
  });

  it('calls onProvenanceClick when score cell with steps is clicked', () => {
    const onProvenanceClick = vi.fn();
    const mockStep = {
      tableId: 'B13',
      csvRow: 12,
      source: {
        tableId: 'B13',
        tableTitle: 'Table B.13',
        manualPage: 4,
        csvFilename: 'test.csv',
        csvSha256: 'abc123',
        generatedAt: '2025-01-01',
        generatorVersion: 'test',
      },
      description: 'Receptive Language: Raw Score 20 → Standard Score 95',
    };
    const resultWithSteps: CalculationResult = {
      ...mockResult,
      subtests: {
        ...mockResult.subtests,
        receptiveLanguage: {
          ...mockResult.subtests.receptiveLanguage,
          standardScore: {
            value: { value: 95 },
            steps: [mockStep],
          },
        },
      },
    };
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={resultWithSteps}
        onProvenanceClick={onProvenanceClick}
        visibleSubtests={defaultVisibleSubtests}
        visibleDomains={defaultVisibleDomains}
        onRawScoreChange={() => {}}
      />
    );

    // Click on the standard score cell (95)
    const scoreCells = screen.getAllByText('95');
    fireEvent.click(scoreCells[0]);

    expect(onProvenanceClick).toHaveBeenCalledTimes(1);
    expect(onProvenanceClick.mock.calls[0][0]).toHaveLength(1);
    expect(onProvenanceClick.mock.calls[0][0][0].tableId).toBe('B13');
  });
});
