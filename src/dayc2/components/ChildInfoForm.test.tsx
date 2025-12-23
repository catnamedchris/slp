import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChildInfoForm, { calculateAgeInfo } from './ChildInfoForm';

vi.mock('react-datepicker', () => ({
  default: ({ id, selected, onChange, placeholderText, className }: {
    id: string;
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText: string;
    className?: string;
  }) => (
    <input
      type="text"
      id={id}
      value={selected ? selected.toISOString().split('T')[0] : ''}
      placeholder={placeholderText}
      className={className}
      onChange={(e) => {
        const val = e.target.value;
        if (val) {
          const [year, month, day] = val.split('-').map(Number);
          onChange(new Date(year, month - 1, day));
        } else {
          onChange(null);
        }
      }}
    />
  ),
}));

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
    expect(screen.getByText('Birth Date')).toBeInTheDocument();
    expect(screen.getByText('Test Date')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select date of birth')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select test date')).toBeInTheDocument();
  });

  it('calls onDobChange when DOB input changes', () => {
    const onDobChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} onDobChange={onDobChange} />);
    const dobInput = screen.getByPlaceholderText('Select date of birth');
    fireEvent.change(dobInput, { target: { value: '2022-01-15' } });
    expect(onDobChange).toHaveBeenCalledWith('2022-01-15');
  });

  it('calls onTestDateChange when test date input changes', () => {
    const onTestDateChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} onTestDateChange={onTestDateChange} />);
    const testDateInput = screen.getByPlaceholderText('Select test date');
    fireEvent.change(testDateInput, { target: { value: '2024-01-15' } });
    expect(onTestDateChange).toHaveBeenCalledWith('2024-01-15');
  });

  it('displays age when both dates are entered', () => {
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
    expect(screen.getByText('24 months')).toBeInTheDocument();
  });

  it('displays error when age is out of range', () => {
    render(<ChildInfoForm {...defaultProps} dob="2024-01-15" testDate="2024-06-15" />);
    expect(screen.getByText(/below DAYC-2 minimum/)).toBeInTheDocument();
  });

  it('displays selected dates in the inputs', () => {
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" testDate="2024-01-15" />);
    const dobInput = screen.getByPlaceholderText('Select date of birth') as HTMLInputElement;
    const testDateInput = screen.getByPlaceholderText('Select test date') as HTMLInputElement;
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
    expect(screen.queryByPlaceholderText('Select date of birth')).not.toBeInTheDocument();
  });

  it('displays age from ageOverride', () => {
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={36} />);
    expect(screen.getByText('36 months')).toBeInTheDocument();
  });

  it('calls onAgeOverrideChange when age input changes', () => {
    const onAgeOverrideChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={24} onAgeOverrideChange={onAgeOverrideChange} />);
    const ageInput = screen.getByLabelText('Age (months)');
    fireEvent.change(ageInput, { target: { value: '30' } });
    expect(onAgeOverrideChange).toHaveBeenCalledWith(30);
  });

  it('toggles to age override mode when checkbox clicked', () => {
    const onUseAgeOverrideChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} dob="2022-01-15" testDate="2024-01-15" onUseAgeOverrideChange={onUseAgeOverrideChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onUseAgeOverrideChange).toHaveBeenCalledWith(true);
  });

  it('toggles back to date mode when checkbox unchecked', () => {
    const onUseAgeOverrideChange = vi.fn();
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={24} onUseAgeOverrideChange={onUseAgeOverrideChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onUseAgeOverrideChange).toHaveBeenCalledWith(false);
  });

  it('shows empty age input when useAgeOverride is true but ageOverride is null', () => {
    render(<ChildInfoForm {...defaultProps} useAgeOverride={true} ageOverride={null} />);
    const ageInput = screen.getByLabelText('Age (months)') as HTMLInputElement;
    expect(ageInput.value).toBe('');
    expect(screen.queryByText('months')).not.toBeInTheDocument();
  });
});
