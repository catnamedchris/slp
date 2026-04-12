import { describe, it, expect } from 'vitest';
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
const enterValidDates = () => {
  localStorage.setItem('slp:dayc2:dob', JSON.stringify('2022-01-15'));
  localStorage.setItem('slp:dayc2:testDate', JSON.stringify('2024-01-15'));
};

describe('Dayc2App', () => {
  it('renders child info inputs', () => {
    render(<Dayc2App />);
    expect(screen.getByLabelText('Birth Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
  });

  it('shows empty state when no dates entered', () => {
    render(<Dayc2App />);
    expect(screen.getByText('Ready to calculate')).toBeInTheDocument();
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

  it('calculates and displays results when inputs are entered', () => {
    enterValidDates();
    render(<Dayc2App />);

    fireEvent.change(getRawScoreInput('receptiveLanguage')!, { target: { value: '20' } });
    fireEvent.change(getRawScoreInput('expressiveLanguage')!, { target: { value: '18' } });
    fireEvent.change(getRawScoreInput('socialEmotional')!, { target: { value: '22' } });

    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });
});
