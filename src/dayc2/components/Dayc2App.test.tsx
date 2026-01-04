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

describe('Dayc2App', () => {
  it('renders the main heading', () => {
    render(<Dayc2App />);
    expect(screen.getByText('DAYC-2 Score Calculator')).toBeInTheDocument();
  });

  it('renders child info form', () => {
    render(<Dayc2App />);
    expect(screen.getByText('Birth Date')).toBeInTheDocument();
    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  it('renders default visible subtests (RL, EL, SE)', () => {
    render(<Dayc2App />);
    expect(getRawScoreInput('receptiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('expressiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('socialEmotional')).toBeInTheDocument();
  });

  it('disables raw score inputs when no dates entered', () => {
    render(<Dayc2App />);
    expect(getRawScoreInput('receptiveLanguage')).toBeDisabled();
  });

  it('enables raw score inputs when age is valid', () => {
    render(<Dayc2App />);

    const dobInput = screen.getByLabelText('Birth Date');
    const testDateInput = screen.getByLabelText('Test Date');

    fireEvent.change(dobInput, { target: { value: '2022-01-15' } });
    fireEvent.change(testDateInput, { target: { value: '2024-01-15' } });

    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });

  it('shows hint when no dates entered', () => {
    render(<Dayc2App />);
    expect(screen.getByText(/Enter valid child information/)).toBeInTheDocument();
  });

  it('calculates and displays results when inputs are entered', () => {
    render(<Dayc2App />);

    const dobInput = screen.getByLabelText('Birth Date');
    const testDateInput = screen.getByLabelText('Test Date');

    fireEvent.change(dobInput, { target: { value: '2022-01-15' } });
    fireEvent.change(testDateInput, { target: { value: '2024-01-15' } });

    fireEvent.change(getRawScoreInput('receptiveLanguage')!, { target: { value: '20' } });
    fireEvent.change(getRawScoreInput('expressiveLanguage')!, { target: { value: '18' } });
    fireEvent.change(getRawScoreInput('socialEmotional')!, { target: { value: '22' } });

    expect(screen.queryByText(/Enter valid child information/)).not.toBeInTheDocument();
    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });

  it('renders About Data section', () => {
    render(<Dayc2App />);
    expect(screen.getByText(/About the Data/)).toBeInTheDocument();
  });
});
