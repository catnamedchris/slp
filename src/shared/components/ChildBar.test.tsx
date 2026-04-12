import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChildBar from './ChildBar';
import type { AgeInfo } from '@/dayc2/lib/age';

const defaultProps = {
  dob: '',
  testDate: '',
  ageInfo: null as AgeInfo | null,
  onDobChange: vi.fn(),
  onTestDateChange: vi.fn(),
  onClear: vi.fn(),
};

const validAgeInfo: AgeInfo = {
  ageMonths: 24,
  ageBandLabel: '22-24 months',
  error: null,
};

describe('ChildBar', () => {
  it('renders birth date and test date inputs', () => {
    render(<ChildBar {...defaultProps} />);
    expect(screen.getByLabelText('Birth Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
  });

  it('calls onDobChange when a day is selected in the picker', () => {
    const onDobChange = vi.fn();
    render(<ChildBar {...defaultProps} onDobChange={onDobChange} />);
    fireEvent.click(screen.getByLabelText('Birth Date'));
    // Click the first day button in the calendar
    const dayButton = document.querySelector('.rdp-day button');
    expect(dayButton).toBeTruthy();
    fireEvent.click(dayButton!);
    expect(onDobChange).toHaveBeenCalledOnce();
  });

  it('calls onTestDateChange when a day is selected in the picker', () => {
    const onTestDateChange = vi.fn();
    render(<ChildBar {...defaultProps} onTestDateChange={onTestDateChange} />);
    fireEvent.click(screen.getByLabelText('Test Date'));
    const dayButton = document.querySelector('.rdp-day button');
    expect(dayButton).toBeTruthy();
    fireEvent.click(dayButton!);
    expect(onTestDateChange).toHaveBeenCalledOnce();
  });

  it('displays age when both dates are set', () => {
    render(<ChildBar {...defaultProps} dob="2022-01-15" testDate="2024-01-15" ageInfo={validAgeInfo} />);
    expect(screen.getByText('24 mo')).toBeInTheDocument();
    expect(screen.getByText('(2yr 0mo)')).toBeInTheDocument();
  });

  it('shows Clear button', () => {
    render(<ChildBar {...defaultProps} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('enters confirm state when Clear is clicked (does not call onClear directly)', () => {
    const onClear = vi.fn();
    render(<ChildBar {...defaultProps} onClear={onClear} />);
    fireEvent.click(screen.getByText('Clear'));
    expect(onClear).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm?' })).toBeInTheDocument();
  });

  it('displays age band label when available', () => {
    render(<ChildBar {...defaultProps} dob="2022-01-15" testDate="2024-01-15" ageInfo={validAgeInfo} />);
    expect(screen.getByText('22-24 months')).toBeInTheDocument();
  });

  it('Clear button shows confirm state on click', () => {
    render(<ChildBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.getByRole('button', { name: 'Confirm?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('Confirm button calls onClear', () => {
    const onClear = vi.fn();
    render(<ChildBar {...defaultProps} onClear={onClear} />);
    fireEvent.click(screen.getByText('Clear'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm?' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('Cancel button returns to normal state', () => {
    render(<ChildBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Clear'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('Confirm state auto-resets after timeout', () => {
    vi.useFakeTimers();
    render(<ChildBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.getByRole('button', { name: 'Confirm?' })).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3001); });
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm?' })).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
