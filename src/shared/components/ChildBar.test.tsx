import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChildBar from './ChildBar';

const defaultProps = {
  dob: '',
  testDate: '',
  onDobChange: vi.fn(),
  onTestDateChange: vi.fn(),
  onClear: vi.fn(),
};

describe('ChildBar', () => {
  it('renders birth date and test date inputs', () => {
    render(<ChildBar {...defaultProps} />);
    expect(screen.getByLabelText('Birth Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
  });

  it('calls onDobChange when birth date changes', () => {
    const onDobChange = vi.fn();
    render(<ChildBar {...defaultProps} onDobChange={onDobChange} />);
    fireEvent.change(screen.getByLabelText('Birth Date'), { target: { value: '2022-01-15' } });
    expect(onDobChange).toHaveBeenCalledWith('2022-01-15');
  });

  it('calls onTestDateChange when test date changes', () => {
    const onTestDateChange = vi.fn();
    render(<ChildBar {...defaultProps} onTestDateChange={onTestDateChange} />);
    fireEvent.change(screen.getByLabelText('Test Date'), { target: { value: '2024-01-15' } });
    expect(onTestDateChange).toHaveBeenCalledWith('2024-01-15');
  });

  it('displays age when both dates are set', () => {
    render(<ChildBar {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
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
    render(<ChildBar {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
    // 24 months falls within a valid age band
    expect(screen.getByText(/\d+-\d+ months/)).toBeInTheDocument();
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
