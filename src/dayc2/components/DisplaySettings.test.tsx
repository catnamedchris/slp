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

const expandSettings = () => {
  fireEvent.click(screen.getByText('Display Settings'));
};

describe('DisplaySettings', () => {
  it('renders Display Settings summary', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByText('Display Settings')).toBeInTheDocument();
  });

  it('shows count of visible subtests and domains', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByText('2 subtests, 1 domains')).toBeInTheDocument();
  });

  it('renders all subtest checkboxes', () => {
    render(<DisplaySettings {...defaultProps} />);
    expandSettings();
    expect(screen.getByText('Cognitive')).toBeInTheDocument();
    expect(screen.getByText('Receptive Language')).toBeInTheDocument();
    expect(screen.getByText('Expressive Language')).toBeInTheDocument();
    expect(screen.getByText('Social-Emotional')).toBeInTheDocument();
    expect(screen.getByText('Gross Motor')).toBeInTheDocument();
    expect(screen.getByText('Fine Motor')).toBeInTheDocument();
    expect(screen.getByText('Adaptive Behavior')).toBeInTheDocument();
  });

  it('renders all domain checkboxes', () => {
    render(<DisplaySettings {...defaultProps} />);
    expandSettings();
    expect(screen.getByText('Communication (RL+EL)')).toBeInTheDocument();
    expect(screen.getByText('Physical (GM+FM)')).toBeInTheDocument();
  });

  it('checks visible subtests', () => {
    render(<DisplaySettings {...defaultProps} />);
    expandSettings();
    const rlCheckbox = screen.getByRole('checkbox', { name: /Receptive Language/i });
    const elCheckbox = screen.getByRole('checkbox', { name: /Expressive Language/i });
    const cogCheckbox = screen.getByRole('checkbox', { name: /Cognitive/i });
    const seCheckbox = screen.getByRole('checkbox', { name: /Social-Emotional/i });
    expect(rlCheckbox).toBeChecked();
    expect(elCheckbox).toBeChecked();
    expect(cogCheckbox).not.toBeChecked();
    expect(seCheckbox).not.toBeChecked();
  });

  it('checks visible domains', () => {
    render(<DisplaySettings {...defaultProps} />);
    expandSettings();
    const commCheckbox = screen.getByRole('checkbox', { name: /Communication/i });
    const physCheckbox = screen.getByRole('checkbox', { name: /Physical/i });
    expect(commCheckbox).toBeChecked();
    expect(physCheckbox).not.toBeChecked();
  });

  it('calls onSubtestToggle when subtest checkbox is clicked', () => {
    const onSubtestToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onSubtestToggle={onSubtestToggle} />);
    expandSettings();

    fireEvent.click(screen.getByRole('checkbox', { name: /Cognitive/i }));

    expect(onSubtestToggle).toHaveBeenCalledWith('cognitive');
    expect(onSubtestToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onDomainToggle when domain checkbox is clicked', () => {
    const onDomainToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onDomainToggle={onDomainToggle} />);
    expandSettings();

    fireEvent.click(screen.getByRole('checkbox', { name: /Physical/i }));

    expect(onDomainToggle).toHaveBeenCalledWith('physical');
    expect(onDomainToggle).toHaveBeenCalledTimes(1);
  });

  it('unchecks subtest when toggling visible subtest', () => {
    const onSubtestToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onSubtestToggle={onSubtestToggle} />);
    expandSettings();

    fireEvent.click(screen.getByRole('checkbox', { name: /Receptive Language/i }));

    expect(onSubtestToggle).toHaveBeenCalledWith('receptiveLanguage');
  });

  it('unchecks domain when toggling visible domain', () => {
    const onDomainToggle = vi.fn();
    render(<DisplaySettings {...defaultProps} onDomainToggle={onDomainToggle} />);
    expandSettings();

    fireEvent.click(screen.getByRole('checkbox', { name: /Communication/i }));

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
    expect(screen.getByText('0 subtests, 0 domains')).toBeInTheDocument();
    expandSettings();
    expect(screen.getByRole('checkbox', { name: /Cognitive/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Communication/i })).not.toBeChecked();
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
    expect(screen.getByText('7 subtests, 1 domains')).toBeInTheDocument();
    expandSettings();
    expect(screen.getByRole('checkbox', { name: /Cognitive/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Adaptive Behavior/i })).toBeChecked();
  });

  it('handles all domains visible', () => {
    const allDomains = new Set<DomainKey>(['communication', 'physical']);
    render(
      <DisplaySettings
        {...defaultProps}
        visibleDomains={allDomains}
      />
    );
    expect(screen.getByText('2 subtests, 2 domains')).toBeInTheDocument();
    expandSettings();
    expect(screen.getByRole('checkbox', { name: /Communication/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Physical/i })).toBeChecked();
  });
});
