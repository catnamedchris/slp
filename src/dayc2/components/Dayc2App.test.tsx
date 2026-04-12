import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dayc2App from './Dayc2App';

// Helper to find raw score input by subtest in mobile layout (cards) or desktop (table row)
const getRawScoreInput = (subtest: string) => {
  // Mobile uses raw-mobile-{key}, desktop uses raw-{key}
  const mobileInput = document.getElementById(`raw-mobile-${subtest}`);
  const desktopInput = document.getElementById(`raw-${subtest}`);
  return mobileInput || desktopInput;
};

// Pre-seed persisted state so Dayc2App renders with valid dates
// DOB 2022-01-15, Test Date 2024-01-15 → age 24 months (B17 table)
const enterValidDates = () => {
  localStorage.setItem('slp:dayc2:dob', JSON.stringify('2022-01-15'));
  localStorage.setItem('slp:dayc2:testDate', JSON.stringify('2024-01-15'));
};

describe('Dayc2App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders child info inputs', () => {
    render(<Dayc2App />);
    expect(screen.getByLabelText('Birth Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
  });

  it('shows no scores and no empty state when only test date is defaulted', () => {
    render(<Dayc2App />);
    // Test date defaults to today, but no DOB yet — no scores should render
    expect(screen.queryByText('Ready to calculate')).not.toBeInTheDocument();
    expect(screen.queryByText('Targets')).not.toBeInTheDocument();
  });

  it('renders default visible subtests (RL, EL, SE) after entering valid dates', () => {
    enterValidDates();
    render(<Dayc2App />);
    expect(getRawScoreInput('receptiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('expressiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('socialEmotional')).toBeInTheDocument();
  });

  it('enables raw score inputs when age is valid', () => {
    enterValidDates();
    render(<Dayc2App />);
    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });

  it('shows Targets section with default 6th percentile chips', () => {
    enterValidDates();
    render(<Dayc2App />);

    // Targets section renders with default target percentile = 6
    expect(screen.getByText('Targets')).toBeInTheDocument();
    expect(document.getElementById('targetPercentile')).toHaveValue(6);

    // Target raw scores for 6th %ile (SS 77) at age 24 months:
    //   RL: raw 12 (SS 75, highest ≤ 77)
    //   EL: raw 11 (SS 77, exact match)
    //   SE: raw 19 (SS 76, highest ≤ 77)
    const targetsSection = screen.getByText('Targets').closest('div.bg-surface')!;
    const chipValues = targetsSection.querySelectorAll('div.text-xl.font-bold');
    const chips = Array.from(chipValues).map((el) => el.textContent);
    expect(chips).toEqual(['12', '11', '19']);
  });

  it('calculates and displays correct scores for a 24-month-old', () => {
    enterValidDates();
    render(<Dayc2App />);

    fireEvent.change(getRawScoreInput('receptiveLanguage')!, { target: { value: '20' } });
    fireEvent.change(getRawScoreInput('expressiveLanguage')!, { target: { value: '18' } });
    fireEvent.change(getRawScoreInput('socialEmotional')!, { target: { value: '22' } });

    // Subtest standard scores (from B17 table)
    expect(screen.getByText('104')).toBeInTheDocument();  // RL SS
    expect(screen.getByText('99')).toBeInTheDocument();   // EL SS
    expect(screen.getByText('82')).toBeInTheDocument();   // SE SS

    // Subtest percentiles (from C1 table)
    expect(screen.getByText('61%')).toBeInTheDocument();  // RL %ile
    expect(screen.getByText('47%')).toBeInTheDocument();  // EL %ile
    expect(screen.getByText('12%')).toBeInTheDocument();  // SE %ile

    // Subtest age equivalents (from A1 table)
    expect(screen.getByText('25 mo')).toBeInTheDocument(); // RL AE
    expect(screen.getByText('23 mo')).toBeInTheDocument(); // EL AE
    expect(screen.getByText('12 mo')).toBeInTheDocument(); // SE AE

    // Communication composite (RL+EL): sum 203, SS 103, 58th %ile
    expect(screen.getByText('203')).toBeInTheDocument();  // sum
    expect(screen.getByText('103')).toBeInTheDocument();  // composite SS
    expect(screen.getByText('58%')).toBeInTheDocument();  // composite %ile
  });
});
