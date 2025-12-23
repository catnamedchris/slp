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
});

describe('ChildInfoForm component', () => {
  it('renders date inputs', () => {
    render(
      <ChildInfoForm
        dob=""
        testDate=""
        onDobChange={() => {}}
        onTestDateChange={() => {}}
      />
    );
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
  });

  it('calls onDobChange when DOB input changes', () => {
    const onDobChange = vi.fn();
    render(
      <ChildInfoForm
        dob=""
        testDate=""
        onDobChange={onDobChange}
        onTestDateChange={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2022-01-15' },
    });
    expect(onDobChange).toHaveBeenCalledWith('2022-01-15');
  });

  it('calls onTestDateChange when test date input changes', () => {
    const onTestDateChange = vi.fn();
    render(
      <ChildInfoForm
        dob=""
        testDate=""
        onDobChange={() => {}}
        onTestDateChange={onTestDateChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Test Date'), {
      target: { value: '2024-01-15' },
    });
    expect(onTestDateChange).toHaveBeenCalledWith('2024-01-15');
  });

  it('displays age when both dates are entered', () => {
    render(
      <ChildInfoForm
        dob="2022-01-15"
        testDate="2024-01-15"
        onDobChange={() => {}}
        onTestDateChange={() => {}}
      />
    );
    expect(screen.getByText('24 months')).toBeInTheDocument();
  });

  it('displays error when age is out of range', () => {
    render(
      <ChildInfoForm
        dob="2024-01-15"
        testDate="2024-06-15"
        onDobChange={() => {}}
        onTestDateChange={() => {}}
      />
    );
    expect(screen.getByText(/below DAYC-2 minimum/)).toBeInTheDocument();
  });
});
