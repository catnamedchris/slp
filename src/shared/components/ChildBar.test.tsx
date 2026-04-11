import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('2y 0m')).toBeInTheDocument();
    expect(screen.getByText('(24 months)')).toBeInTheDocument();
  });

  it('shows Clear button', () => {
    render(<ChildBar {...defaultProps} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls onClear when Clear is clicked', () => {
    const onClear = vi.fn();
    render(<ChildBar {...defaultProps} onClear={onClear} />);
    fireEvent.click(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('displays age band label when available', () => {
    render(<ChildBar {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
    // 24 months falls within a valid age band
    expect(screen.getByText(/mo/)).toBeInTheDocument();
  });
});
