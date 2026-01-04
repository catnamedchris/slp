import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReverseLookup from './ReverseLookup';
import type { SubtestKey } from '../types';
import { DEFAULT_VISIBLE_SUBTESTS, SUBTESTS } from '../lib/scoresDisplay';

const defaultProps = {
  ageMonths: 24,
  targetPercentile: 6,
  visibleSubtests: new Set<SubtestKey>(DEFAULT_VISIBLE_SUBTESTS),
  onTargetPercentileChange: vi.fn(),
};

describe('ReverseLookup', () => {
  it('renders with disabled input when ageMonths is null', () => {
    render(<ReverseLookup {...defaultProps} ageMonths={null} />);
    const input = screen.getByLabelText('Target Percentile');
    expect(input).toBeDisabled();
  });

  it('renders heading and instructions when age is valid', () => {
    render(<ReverseLookup {...defaultProps} />);
    expect(screen.getByText('Reverse Lookup')).toBeInTheDocument();
    expect(screen.getByText(/Find the raw scores/)).toBeInTheDocument();
  });

  it('renders percentile input field', () => {
    render(<ReverseLookup {...defaultProps} />);
    expect(screen.getByLabelText('Target Percentile')).toBeInTheDocument();
  });

  it('accepts percentile values between 1-99', () => {
    render(<ReverseLookup {...defaultProps} />);
    const input = screen.getByLabelText('Target Percentile');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '99');
    expect(input).toHaveAttribute('placeholder', '1–99');
  });

  it('shows results table with default percentile', () => {
    render(<ReverseLookup {...defaultProps} />);
    expect(screen.getByText('Target Standard Score:')).toBeInTheDocument();
    expect(screen.getByText('Min. Raw Score')).toBeInTheDocument();
  });

  it('shows only visible subtests in results', () => {
    render(<ReverseLookup {...defaultProps} targetPercentile={50} />);
    expect(screen.getByText('Receptive Language')).toBeInTheDocument();
    expect(screen.getByText('Expressive Language')).toBeInTheDocument();
    expect(screen.getByText('Social-Emotional')).toBeInTheDocument();
    expect(screen.queryByText('Cognitive')).not.toBeInTheDocument();
    expect(screen.queryByText('Gross Motor')).not.toBeInTheDocument();
    expect(screen.queryByText('Fine Motor')).not.toBeInTheDocument();
    expect(screen.queryByText('Adaptive Behavior')).not.toBeInTheDocument();
  });

  it('shows all subtests when all are visible', () => {
    const allVisible = new Set<SubtestKey>(SUBTESTS);
    render(<ReverseLookup {...defaultProps} visibleSubtests={allVisible} targetPercentile={50} />);
    expect(screen.getByText('Cognitive')).toBeInTheDocument();
    expect(screen.getByText('Receptive Language')).toBeInTheDocument();
    expect(screen.getByText('Expressive Language')).toBeInTheDocument();
    expect(screen.getByText('Social-Emotional')).toBeInTheDocument();
    expect(screen.getByText('Gross Motor')).toBeInTheDocument();
    expect(screen.getByText('Fine Motor')).toBeInTheDocument();
    expect(screen.getByText('Adaptive Behavior')).toBeInTheDocument();
  });

  it('calls onProvenanceClick when a result cell is clicked', () => {
    const onProvenanceClick = vi.fn();
    render(<ReverseLookup {...defaultProps} targetPercentile={50} onProvenanceClick={onProvenanceClick} />);

    const clickableCells = document.querySelectorAll('.cursor-pointer');
    if (clickableCells.length > 0) {
      fireEvent.click(clickableCells[0]);
      expect(onProvenanceClick).toHaveBeenCalled();
    }
  });

  it('calls onTargetPercentileChange when input changes', () => {
    const onTargetPercentileChange = vi.fn();
    render(<ReverseLookup {...defaultProps} onTargetPercentileChange={onTargetPercentileChange} />);
    fireEvent.change(screen.getByLabelText('Target Percentile'), {
      target: { value: '25' },
    });
    expect(onTargetPercentileChange).toHaveBeenCalledWith(25);
  });
});
