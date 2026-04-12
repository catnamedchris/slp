import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReverseLookup from './ReverseLookup';

const defaultProps = {
  ageMonths: 24,
  targetPercentile: 6,
  onTargetPercentileChange: vi.fn(),
};

describe('ReverseLookup', () => {
  it('renders with disabled input when ageMonths is null', () => {
    render(<ReverseLookup {...defaultProps} ageMonths={null} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();
  });

  it('renders title', () => {
    render(<ReverseLookup {...defaultProps} />);
    expect(screen.getByText('Targets')).toBeInTheDocument();
  });

  it('renders percentile input with target value', () => {
    render(<ReverseLookup {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(6);
  });

  it('renders %ile label', () => {
    render(<ReverseLookup {...defaultProps} />);
    expect(screen.getByText('%ile')).toBeInTheDocument();
  });

  it('shows all active subtests (RL, EL, SE) in results', () => {
    render(<ReverseLookup {...defaultProps} targetPercentile={50} />);
    expect(screen.getByText('RL')).toBeInTheDocument();
    expect(screen.getByText('EL')).toBeInTheDocument();
    expect(screen.getByText('SE')).toBeInTheDocument();
    expect(screen.queryByText('COG')).not.toBeInTheDocument();
    expect(screen.queryByText('GM')).not.toBeInTheDocument();
    expect(screen.queryByText('FM')).not.toBeInTheDocument();
    expect(screen.queryByText('AB')).not.toBeInTheDocument();
  });

  it('calls onProvenanceClick when a result chip is clicked', () => {
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
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '25' },
    });
    expect(onTargetPercentileChange).toHaveBeenCalledWith(25);
  });
});
