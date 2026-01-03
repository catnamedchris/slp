import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DisplaySettings from './DisplaySettings';
import type { SubtestKey } from '../types';
import type { DomainKey } from '../lib/scoresDisplay';

const defaultProps = {
  visibleSubtests: new Set<SubtestKey>(['receptiveLanguage', 'expressiveLanguage']),
  visibleDomains: new Set<DomainKey>(['communication']),
  onSubtestToggle: () => {},
  onDomainToggle: () => {},
};

describe('DisplaySettings', () => {
  it('renders Display Settings summary', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByText('Display Settings')).toBeInTheDocument();
  });

  it('shows count of visible subtests and domains', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByText('(2 subtests, 1 domains)')).toBeInTheDocument();
  });

  it('renders all subtest checkboxes', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByLabelText('Cognitive')).toBeInTheDocument();
    expect(screen.getByLabelText('Receptive Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Expressive Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Social-Emotional')).toBeInTheDocument();
    expect(screen.getByLabelText('Gross Motor')).toBeInTheDocument();
    expect(screen.getByLabelText('Fine Motor')).toBeInTheDocument();
    expect(screen.getByLabelText('Adaptive Behavior')).toBeInTheDocument();
  });

  it('renders all domain checkboxes', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByLabelText('Communication (RL+EL)')).toBeInTheDocument();
    expect(screen.getByLabelText('Physical (GM+FM)')).toBeInTheDocument();
  });

  it('checks visible subtests', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByLabelText('Receptive Language')).toBeChecked();
    expect(screen.getByLabelText('Expressive Language')).toBeChecked();
    expect(screen.getByLabelText('Cognitive')).not.toBeChecked();
    expect(screen.getByLabelText('Social-Emotional')).not.toBeChecked();
  });

  it('checks visible domains', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByLabelText('Communication (RL+EL)')).toBeChecked();
    expect(screen.getByLabelText('Physical (GM+FM)')).not.toBeChecked();
  });

  it('calls onSubtestToggle when subtest checkbox is clicked', () => {
    const onSubtestToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onSubtestToggle={onSubtestToggle} />);

    fireEvent.click(screen.getByLabelText('Cognitive'));

    expect(onSubtestToggle).toHaveBeenCalledWith('cognitive');
    expect(onSubtestToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onDomainToggle when domain checkbox is clicked', () => {
    const onDomainToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onDomainToggle={onDomainToggle} />);

    fireEvent.click(screen.getByLabelText('Physical (GM+FM)'));

    expect(onDomainToggle).toHaveBeenCalledWith('physical');
    expect(onDomainToggle).toHaveBeenCalledTimes(1);
  });

  it('unchecks subtest when toggling visible subtest', () => {
    const onSubtestToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onSubtestToggle={onSubtestToggle} />);

    fireEvent.click(screen.getByLabelText('Receptive Language'));

    expect(onSubtestToggle).toHaveBeenCalledWith('receptiveLanguage');
  });

  it('unchecks domain when toggling visible domain', () => {
    const onDomainToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onDomainToggle={onDomainToggle} />);

    fireEvent.click(screen.getByLabelText('Communication (RL+EL)'));

    expect(onDomainToggle).toHaveBeenCalledWith('communication');
  });

  it('handles empty visible sets', () => {
    render(
      <DisplaySettings
        {...defaultProps}
        visibleSubtests={new Set()}
        visibleDomains={new Set()}
      />
    );
    expect(screen.getByText('(0 subtests, 0 domains)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cognitive')).not.toBeChecked();
    expect(screen.getByLabelText('Communication (RL+EL)')).not.toBeChecked();
  });

  it('handles all subtests visible', () => {
    const allSubtests = new Set<SubtestKey>([
      'cognitive',
      'receptiveLanguage',
      'expressiveLanguage',
      'socialEmotional',
      'grossMotor',
      'fineMotor',
      'adaptiveBehavior',
    ]);
    render(
      <DisplaySettings
        {...defaultProps}
        visibleSubtests={allSubtests}
      />
    );
    expect(screen.getByText('(7 subtests, 1 domains)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cognitive')).toBeChecked();
    expect(screen.getByLabelText('Adaptive Behavior')).toBeChecked();
  });

  it('handles all domains visible', () => {
    const allDomains = new Set<DomainKey>(['communication', 'physical']);
    render(
      <DisplaySettings
        {...defaultProps}
        visibleDomains={allDomains}
      />
    );
    expect(screen.getByText('(2 subtests, 2 domains)')).toBeInTheDocument();
    expect(screen.getByLabelText('Communication (RL+EL)')).toBeChecked();
    expect(screen.getByLabelText('Physical (GM+FM)')).toBeChecked();
  });
});
