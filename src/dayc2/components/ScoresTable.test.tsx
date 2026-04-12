import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoresTable from './ScoresTable';
import { createEmptyRawScores } from '../lib/rawScores';
import { createEmptySkillItems } from '../lib/skills';
import type { CalculationResult } from '../lib/calculate';
const getRawScoreInput = (subtest: string) =>
  document.getElementById(`raw-${subtest}`);

const defaultSkillProps = {
  skillItems: createEmptySkillItems(),
  onSkillItemsChange: () => {},
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
  },
};

describe('ScoresTable', () => {
  it('shows all active subtests (RL, EL, SE)', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
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

  it('shows Communication domain composite', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
      />
    );
    expect(screen.getByText('Communication (RL+EL)')).toBeInTheDocument();
  });

  it('disables inputs when ageMonths is null', () => {
    render(
      <ScoresTable
        ageMonths={null}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
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
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
      />
    );
    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });

  it('calls onRawScoreChange when input value changes', () => {
    const onRawScoreChange = vi.fn();
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={onRawScoreChange}
        {...defaultSkillProps}
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
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
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
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
      />
    );
    expect(screen.getByText(/Raw score 50 exceeds table max/)).toBeInTheDocument();
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
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
      />
    );
    expect(screen.getByText('<145')).toBeInTheDocument();
    expect(screen.getByText('<41')).toBeInTheDocument();
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
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
      />
    );
    expect(screen.getByText('>300')).toBeInTheDocument();
    expect(screen.getByText('>159')).toBeInTheDocument();
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
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
      />
    );

    const scoreCells = screen.getAllByText('95');
    fireEvent.click(scoreCells[0]);

    expect(onProvenanceClick).toHaveBeenCalledTimes(1);
    expect(onProvenanceClick.mock.calls[0][0]).toHaveLength(1);
    expect(onProvenanceClick.mock.calls[0][0][0].tableId).toBe('B13');
  });

  it('does not call onProvenanceClick when dash cell with steps is clicked', () => {
    const onProvenanceClick = vi.fn();
    const mockStep = {
      tableId: 'B13',
      csvRow: null,
      source: {
        tableId: 'B13',
        tableTitle: 'Table B.13',
        manualPage: 4,
        csvFilename: 'test.csv',
        csvSha256: 'abc123',
        generatedAt: '2025-01-01',
        generatorVersion: 'test',
      },
      description: 'Raw Score 15 not found in table',
    };
    const resultWithDashSteps: CalculationResult = {
      ...mockResult,
      subtests: {
        ...mockResult.subtests,
        receptiveLanguage: {
          rawScore: 15,
          standardScore: {
            value: null,
            steps: [mockStep],
          },
          percentile: {
            value: null,
            steps: [mockStep],
          },
          ageEquivalent: {
            value: null,
            steps: [mockStep],
          },
        },
      },
    };
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={{ ...createEmptyRawScores(), receptiveLanguage: 15 }}
        result={resultWithDashSteps}
        onProvenanceClick={onProvenanceClick}
        onRawScoreChange={() => {}}
        {...defaultSkillProps}
      />
    );

    // Click all dash cells in the RL row — none should trigger provenance
    const dashCells = screen.getAllByText('—');
    dashCells.forEach((cell) => fireEvent.click(cell));

    expect(onProvenanceClick).not.toHaveBeenCalled();
  });
});
