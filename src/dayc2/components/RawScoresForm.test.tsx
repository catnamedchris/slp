import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RawScoresForm, { createEmptyRawScores } from './RawScoresForm';

describe('createEmptyRawScores', () => {
  it('creates object with all subtests set to null', () => {
    const scores = createEmptyRawScores();
    expect(scores.cognitive).toBeNull();
    expect(scores.receptiveLanguage).toBeNull();
    expect(scores.expressiveLanguage).toBeNull();
    expect(scores.socialEmotional).toBeNull();
    expect(scores.grossMotor).toBeNull();
    expect(scores.fineMotor).toBeNull();
    expect(scores.adaptiveBehavior).toBeNull();
  });
});

describe('RawScoresForm component', () => {
  it('renders all 7 subtest inputs', () => {
    render(
      <RawScoresForm
        rawScores={createEmptyRawScores()}
        onRawScoreChange={() => {}}
      />
    );
    expect(screen.getByLabelText('Cognitive')).toBeInTheDocument();
    expect(screen.getByLabelText('Receptive Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Expressive Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Social-Emotional')).toBeInTheDocument();
    expect(screen.getByLabelText('Gross Motor')).toBeInTheDocument();
    expect(screen.getByLabelText('Fine Motor')).toBeInTheDocument();
    expect(screen.getByLabelText('Adaptive Behavior')).toBeInTheDocument();
  });

  it('displays current raw score values', () => {
    const scores = { ...createEmptyRawScores(), cognitive: 15, fineMotor: 22 };
    render(
      <RawScoresForm rawScores={scores} onRawScoreChange={() => {}} />
    );
    expect(screen.getByLabelText('Cognitive')).toHaveValue(15);
    expect(screen.getByLabelText('Fine Motor')).toHaveValue(22);
  });

  it('calls onRawScoreChange with parsed number when input changes', () => {
    const onChange = vi.fn();
    render(
      <RawScoresForm
        rawScores={createEmptyRawScores()}
        onRawScoreChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Cognitive'), {
      target: { value: '25' },
    });
    expect(onChange).toHaveBeenCalledWith('cognitive', 25);
  });

  it('calls onRawScoreChange with null when input is cleared', () => {
    const onChange = vi.fn();
    const scores = { ...createEmptyRawScores(), cognitive: 15 };
    render(
      <RawScoresForm rawScores={scores} onRawScoreChange={onChange} />
    );
    fireEvent.change(screen.getByLabelText('Cognitive'), {
      target: { value: '' },
    });
    expect(onChange).toHaveBeenCalledWith('cognitive', null);
  });

  it('disables all inputs when disabled prop is true', () => {
    render(
      <RawScoresForm
        rawScores={createEmptyRawScores()}
        onRawScoreChange={() => {}}
        disabled
      />
    );
    expect(screen.getByLabelText('Cognitive')).toBeDisabled();
    expect(screen.getByLabelText('Fine Motor')).toBeDisabled();
  });

  it('ignores negative numbers', () => {
    const onChange = vi.fn();
    render(
      <RawScoresForm
        rawScores={createEmptyRawScores()}
        onRawScoreChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Cognitive'), {
      target: { value: '-5' },
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
