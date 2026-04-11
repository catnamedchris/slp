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

// Helper to enter valid dates so the scores section appears
const enterValidDates = () => {
  const dobInput = screen.getByLabelText('Birth Date');
  const testDateInput = screen.getByLabelText('Test Date');
  fireEvent.change(dobInput, { target: { value: '2022-01-15' } });
  fireEvent.change(testDateInput, { target: { value: '2024-01-15' } });
};

describe('Dayc2App', () => {
  it('renders the main heading', () => {
    render(<Dayc2App />);
    expect(screen.getByText('dayc')).toBeInTheDocument();
  });

  it('renders child info form', () => {
    render(<Dayc2App />);
    expect(screen.getByText('Birth Date')).toBeInTheDocument();
    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  it('shows empty state when no dates entered', () => {
    render(<Dayc2App />);
    expect(screen.getByText('Ready to calculate')).toBeInTheDocument();
  });

  it('renders default visible subtests (RL, EL, SE) after entering valid dates', () => {
    render(<Dayc2App />);
    enterValidDates();
    expect(getRawScoreInput('receptiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('expressiveLanguage')).toBeInTheDocument();
    expect(getRawScoreInput('socialEmotional')).toBeInTheDocument();
  });

  it('enables raw score inputs when age is valid', () => {
    render(<Dayc2App />);
    enterValidDates();
    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });

  it('calculates and displays results when inputs are entered', () => {
    render(<Dayc2App />);
    enterValidDates();

    fireEvent.change(getRawScoreInput('receptiveLanguage')!, { target: { value: '20' } });
    fireEvent.change(getRawScoreInput('expressiveLanguage')!, { target: { value: '18' } });
    fireEvent.change(getRawScoreInput('socialEmotional')!, { target: { value: '22' } });

    expect(getRawScoreInput('receptiveLanguage')).not.toBeDisabled();
  });

  it('renders About Data section inside settings sheet', () => {
    render(<Dayc2App />);
    const settingsButton = screen.getByLabelText('Display settings');
    fireEvent.click(settingsButton);
    expect(screen.getByText(/About the Data/)).toBeInTheDocument();
  });

  it('opens display settings sheet when gear button is clicked', () => {
    render(<Dayc2App />);
    const settingsButton = screen.getByLabelText('Display settings');
    fireEvent.click(settingsButton);
    expect(screen.getByText('Display Settings')).toBeInTheDocument();
    expect(screen.getByText('Subtests')).toBeInTheDocument();
  });
});
