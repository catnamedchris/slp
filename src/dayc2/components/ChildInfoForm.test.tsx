import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChildInfoForm, { calculateAgeInfo } from './ChildInfoForm';

describe('calculateAgeInfo', () => {
  it('returns null when dob is empty', () => {
    expect(calculateAgeInfo('', '2024-01-15')).toBeNull();
  });

  it('returns null when testDate is empty', () => {
    expect(calculateAgeInfo('2023-01-15', '')).toBeNull();
  });

  it('calculates age in months correctly', () => {
    const result = calculateAgeInfo('2022-01-15', '2024-01-15');
    expect(result?.ageMonths).toBe(24);
  });

  it('returns error when test date is before DOB', () => {
    const result = calculateAgeInfo('2024-01-15', '2023-01-15');
    expect(result?.ageMonths).toBe(-12);
    expect(result?.error).toBe('Test date cannot be before date of birth');
  });

  it('returns error when age is below minimum (12 months)', () => {
    const result = calculateAgeInfo('2024-01-15', '2024-06-15');
    expect(result?.ageMonths).toBe(5);
    expect(result?.error).toContain('below DAYC-2 minimum');
  });

  it('returns error when age is above maximum (71 months)', () => {
    const result = calculateAgeInfo('2018-01-15', '2024-01-15');
    expect(result?.ageMonths).toBe(72);
    expect(result?.error).toContain('above DAYC-2 maximum');
  });

  it('returns valid age band label for valid age', () => {
    const result = calculateAgeInfo('2022-01-15', '2024-01-15');
    expect(result?.ageMonths).toBe(24);
    expect(result?.ageBandLabel).toBeTruthy();
    expect(result?.error).toBeNull();
  });

  it('allows age exactly at DAYC2_MIN_AGE (12 months) without error', () => {
    const result = calculateAgeInfo('2023-01-15', '2024-01-15');
    expect(result?.ageMonths).toBe(12);
    expect(result?.error).toBeNull();
  });

  it('allows age exactly at DAYC2_MAX_AGE (71 months) without error', () => {
    const result = calculateAgeInfo('2018-02-15', '2024-01-15');
    expect(result?.ageMonths).toBe(71);
    expect(result?.error).toBeNull();
  });
});

describe('ChildInfoForm component', () => {
  const defaultProps = {
    dob: '',
    testDate: '',
    onDobChange: () => {},
    onTestDateChange: () => {},
    useAgeOverride: false,
    ageOverride: null,
    onUseAgeOverrideChange: () => {},
    onAgeOverrideChange: () => {},
  };

  it('renders date inputs with labels', () => {
    render(<ChildInfoForm {...defaultProps} />);
    expect(screen.getByLabelText('Birth Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
  });

  it('calls onDobChange when DOB input changes', () => {
    const onDobChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} onDobChange={onDobChange} />);
    const dobInput = screen.getByLabelText('Birth Date');
    fireEvent.change(dobInput, { target: { value: '2022-01-15' } });
    expect(onDobChange).toHaveBeenCalledWith('2022-01-15');
  });

  it('calls onTestDateChange when test date input changes', () => {
    const onTestDateChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} onTestDateChange={onTestDateChange} />);
    const testDateInput = screen.getByLabelText('Test Date');
    fireEvent.change(testDateInput, { target: { value: '2024-01-15' } });
    expect(onTestDateChange).toHaveBeenCalledWith('2024-01-15');
  });

  it('displays age when both dates are entered', () => {
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('months')).toBeInTheDocument();
  });

  it('displays error when age is out of range', () => {
    render(<ChildInfoForm {...defaultProps} dob="2024-01-15" testDate="2024-06-15" />);
    expect(screen.getByText(/below DAYC-2 minimum/)).toBeInTheDocument();
  });

  it('displays selected dates in the inputs', () => {
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
    const dobInput = screen.getByLabelText('Birth Date') as HTMLInputElement;
    const testDateInput = screen.getByLabelText('Test Date') as HTMLInputElement;
    expect(dobInput.value).toBe('2022-01-15');
    expect(testDateInput.value).toBe('2024-01-15');
  });

  it('shows age override checkbox', () => {
    render(<ChildInfoForm {...defaultProps} />);
    expect(screen.getByText('Enter age directly')).toBeInTheDocument();
  });

  it('shows age input when useAgeOverride is true', () => {
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={24} />);
    expect(screen.getByLabelText('Age (months)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Birth Date')).not.toBeInTheDocument();
  });

  it('displays age from ageOverride', () => {
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={36} />);
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('months')).toBeInTheDocument();
  });

  it('calls onAgeOverrideChange when age input changes', () => {
    const onAgeOverrideChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={24} onAgeOverrideChange={onAgeOverrideChange} />);
    const ageInput = screen.getByLabelText('Age (months)');
    fireEvent.change(ageInput, { target: { value: '30' } });
    expect(onAgeOverrideChange).toHaveBeenCalledWith(30);
  });

  it('toggles to age override mode when switch clicked', () => {
    const onUseAgeOverrideChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" testDate="2024-01-15" onUseAgeOverrideChange={onUseAgeOverrideChange} />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onUseAgeOverrideChange).toHaveBeenCalledWith(true);
  });

  it('toggles back to date mode when switch clicked again', () => {
    const onUseAgeOverrideChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={24} onUseAgeOverrideChange={onUseAgeOverrideChange} />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onUseAgeOverrideChange).toHaveBeenCalledWith(false);
  });

  it('shows empty age input when useAgeOverride is true but ageOverride is null', () => {
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={null} />);
    const ageInput = screen.getByLabelText('Age (months)') as HTMLInputElement;
    expect(ageInput.value).toBe('');
    expect(screen.queryByText('months')).not.toBeInTheDocument();
  });

  it('does not display age info when only dob is set', () => {
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" />);
    expect(screen.queryByText(/months/)).not.toBeInTheDocument();
  });

  it('does not display age info when only testDate is set', () => {
    render(<ChildInfoForm {...defaultProps} testDate="2024-01-15" />);
    expect(screen.queryByText(/months/)).not.toBeInTheDocument();
  });

  it('renders the age band label when available', () => {
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
    expect(screen.getByText(/Age Band:/)).toBeInTheDocument();
  });

  it('shows below-min error in override mode', () => {
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={5} />);
    expect(screen.getByText(/below DAYC-2 minimum/)).toBeInTheDocument();
  });

  it('shows above-max error in override mode', () => {
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={80} />);
    expect(screen.getByText(/above DAYC-2 maximum/)).toBeInTheDocument();
  });

  it('sets ageOverride to null when age input is cleared', () => {
    const onAgeOverrideChange = vi.fn();
    render(
      <ChildInfoForm
        {...defaultProps}
        useAgeOverride={true}
        ageOverride={24}
        onAgeOverrideChange={onAgeOverrideChange}
      />
    );
    const ageInput = screen.getByLabelText('Age (months)');
    fireEvent.change(ageInput, { target: { value: '' } });
    expect(onAgeOverrideChange).toHaveBeenCalledWith(null);
  });

  it('treats non-numeric input as clearing the field (browser behavior for type=number)', () => {
    const onAgeOverrideChange = vi.fn();
    render(
      <ChildInfoForm
        {...defaultProps}
        useAgeOverride={true}
        ageOverride={24}
        onAgeOverrideChange={onAgeOverrideChange}
      />
    );
    const ageInput = screen.getByLabelText('Age (months)');
    fireEvent.change(ageInput, { target: { value: 'abc' } });
    expect(onAgeOverrideChange).toHaveBeenCalledWith(null);
  });

  it('displays negative-age error when test date is before DOB', () => {
    render(<ChildInfoForm {...defaultProps} dob="2024-01-15" testDate="2023-01-15" />);
    expect(screen.getByText(/Test date cannot be before date of birth/)).toBeInTheDocument();
  });
});
