import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoresTable from './ScoresTable';
import { createEmptyRawScores } from './RawScoresForm';
import type { CalculationResult } from '../lib/calculate';

const mockResult: CalculationResult = {
  ageMonths: 24,
  subtests: {
    cognitive: {
      rawScore: 25,
      standardScore: { value: { type: 'exact', value: 100 }, steps: [] },
      percentile: { value: { type: 'exact', value: 50 }, steps: [] },
      ageEquivalent: { value: { type: 'exact', value: 24 }, steps: [] },
    },
    receptiveLanguage: {
      rawScore: 20,
      standardScore: { value: { type: 'exact', value: 95 }, steps: [] },
      percentile: { value: { type: 'exact', value: 37 }, steps: [] },
      ageEquivalent: { value: { type: 'exact', value: 22 }, steps: [] },
    },
    expressiveLanguage: {
      rawScore: 18,
      standardScore: { value: { type: 'exact', value: 90 }, steps: [] },
      percentile: { value: { type: 'exact', value: 25 }, steps: [] },
      ageEquivalent: { value: { type: 'exact', value: 20 }, steps: [] },
    },
    socialEmotional: {
      rawScore: 22,
      standardScore: { value: { type: 'exact', value: 105 }, steps: [] },
      percentile: { value: { type: 'exact', value: 63 }, steps: [] },
      ageEquivalent: { value: { type: 'exact', value: 26 }, steps: [] },
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
      sum: 185,
      standardScore: { value: { type: 'exact', value: 92 }, steps: [] },
      percentile: { value: { type: 'exact', value: 30 }, steps: [] },
    },
    physical: {
      sum: null,
      standardScore: { value: null, steps: [] },
      percentile: { value: null, steps: [] },
    },
  },
};

const getInput = (id: string) => document.getElementById(id) as HTMLInputElement | null;

describe('ScoresTable', () => {
  it('renders the Scores heading', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
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
        onRawScoreChange={() => {}}
      />
    );
    expect(getInput('raw-receptiveLanguage')).toBeInTheDocument();
    expect(getInput('raw-expressiveLanguage')).toBeInTheDocument();
    expect(getInput('raw-socialEmotional')).toBeInTheDocument();
    expect(getInput('raw-cognitive')).not.toBeInTheDocument();
    expect(getInput('raw-grossMotor')).not.toBeInTheDocument();
    expect(getInput('raw-fineMotor')).not.toBeInTheDocument();
    expect(getInput('raw-adaptiveBehavior')).not.toBeInTheDocument();
  });

  it('renders toggle checkboxes for all subtests and domains', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={() => {}}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(9); // 7 subtests + 2 domains
  });

  it('hides Communication domain row by default', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        onRawScoreChange={() => {}}
      />
    );
    const compositeRows = document.querySelectorAll('.composite-row');
    const commRow = Array.from(compositeRows).find((row) =>
      row.textContent?.includes('Communication')
    );
    expect(commRow).toBeFalsy();
  });

  it('hides Physical domain row by default', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        onRawScoreChange={() => {}}
      />
    );
    const compositeRows = document.querySelectorAll('.composite-row');
    const physRow = Array.from(compositeRows).find((row) =>
      row.textContent?.includes('Physical')
    );
    expect(physRow).toBeFalsy();
  });

  it('shows Physical domain row when toggled on', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        onRawScoreChange={() => {}}
      />
    );
    expect(
      Array.from(document.querySelectorAll('.composite-row')).find((row) =>
        row.textContent?.includes('Physical')
      )
    ).toBeFalsy();

    const physicalCheckbox = screen.getByRole('checkbox', { name: /Physical \(GM\+FM\)/i });
    fireEvent.click(physicalCheckbox);

    expect(
      Array.from(document.querySelectorAll('.composite-row')).find((row) =>
        row.textContent?.includes('Physical')
      )
    ).toBeTruthy();
  });

  it('shows Communication domain row when toggled on', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={mockResult}
        onRawScoreChange={() => {}}
      />
    );
    expect(
      Array.from(document.querySelectorAll('.composite-row')).find((row) =>
        row.textContent?.includes('Communication')
      )
    ).toBeFalsy();

    const commCheckbox = screen.getByRole('checkbox', { name: /Communication \(RL\+EL\)/i });
    fireEvent.click(commCheckbox);

    expect(
      Array.from(document.querySelectorAll('.composite-row')).find((row) =>
        row.textContent?.includes('Communication')
      )
    ).toBeTruthy();
  });

  it('shows Cognitive row when toggled on', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={() => {}}
      />
    );
    expect(getInput('raw-cognitive')).not.toBeInTheDocument();

    const cognitiveCheckbox = screen.getByRole('checkbox', { name: /Cognitive/i });
    fireEvent.click(cognitiveCheckbox);

    expect(getInput('raw-cognitive')).toBeInTheDocument();
  });

  it('hides subtest row when toggled off', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={() => {}}
      />
    );
    expect(getInput('raw-receptiveLanguage')).toBeInTheDocument();

    const rlCheckbox = screen.getByRole('checkbox', { name: /Receptive Language/i });
    fireEvent.click(rlCheckbox);

    expect(getInput('raw-receptiveLanguage')).not.toBeInTheDocument();
  });

  it('disables inputs when ageMonths is null', () => {
    render(
      <ScoresTable
        ageMonths={null}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={() => {}}
      />
    );
    expect(getInput('raw-receptiveLanguage')).toBeDisabled();
  });

  it('enables inputs when ageMonths is valid', () => {
    render(
      <ScoresTable
        ageMonths={24}
        rawScores={createEmptyRawScores()}
        result={null}
        onRawScoreChange={() => {}}
      />
    );
    expect(getInput('raw-receptiveLanguage')).not.toBeDisabled();
  });

  it('shows hint when age is invalid', () => {
    render(
      <ScoresTable
        ageMonths={null}
        rawScores={createEmptyRawScores()}
        result={null}
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
        onRawScoreChange={onRawScoreChange}
      />
    );
    const input = getInput('raw-receptiveLanguage');
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
      />
    );
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
  });
});
