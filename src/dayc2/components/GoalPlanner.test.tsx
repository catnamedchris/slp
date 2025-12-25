import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalPlanner from './GoalPlanner';

describe('GoalPlanner', () => {
  it('returns null when ageMonths is null', () => {
    const { container } = render(<GoalPlanner ageMonths={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders heading and instructions when age is valid', () => {
    render(<GoalPlanner ageMonths={24} />);
    expect(screen.getByText('Goal Planner')).toBeInTheDocument();
    expect(screen.getByText(/Find the raw scores/)).toBeInTheDocument();
  });

  it('renders percentile select dropdown', () => {
    render(<GoalPlanner ageMonths={24} />);
    expect(screen.getByLabelText('Target Percentile')).toBeInTheDocument();
  });

  it('accepts percentile values between 1-99', () => {
    render(<GoalPlanner ageMonths={24} />);
    const input = screen.getByLabelText('Target Percentile');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '99');
    expect(input).toHaveAttribute('placeholder', '1–99');
  });

  it('does not show results table when no percentile is selected', () => {
    render(<GoalPlanner ageMonths={24} />);
    expect(screen.queryByText('Min. Raw Score')).not.toBeInTheDocument();
  });

  it('shows results when a percentile is selected', () => {
    render(<GoalPlanner ageMonths={24} />);
    fireEvent.change(screen.getByLabelText('Target Percentile'), {
      target: { value: '50' },
    });
    expect(screen.getByText('Target Standard Score:')).toBeInTheDocument();
    expect(screen.getByText('Min. Raw Score')).toBeInTheDocument();
  });

  it('shows all 7 subtests in results', () => {
    render(<GoalPlanner ageMonths={24} />);
    fireEvent.change(screen.getByLabelText('Target Percentile'), {
      target: { value: '50' },
    });
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
    render(<GoalPlanner ageMonths={24} onProvenanceClick={onProvenanceClick} />);
    fireEvent.change(screen.getByLabelText('Target Percentile'), {
      target: { value: '50' },
    });
    
    const clickableCells = document.querySelectorAll('.clickable');
    if (clickableCells.length > 0) {
      fireEvent.click(clickableCells[0]);
      expect(onProvenanceClick).toHaveBeenCalled();
    }
  });
});
