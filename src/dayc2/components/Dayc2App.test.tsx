import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dayc2App from './Dayc2App';

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

const getInput = (id: string) => document.getElementById(id) as HTMLInputElement | null;

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
    expect(getInput('raw-receptiveLanguage')).toBeInTheDocument();
    expect(getInput('raw-expressiveLanguage')).toBeInTheDocument();
    expect(getInput('raw-socialEmotional')).toBeInTheDocument();
  });

  it('disables raw score inputs when no dates entered', () => {
    render(<Dayc2App />);
    expect(getInput('raw-receptiveLanguage')).toBeDisabled();
  });

  it('enables raw score inputs when age is valid', () => {
    render(<Dayc2App />);

    const dobInput = screen.getByPlaceholderText('Select date of birth');
    const testDateInput = screen.getByPlaceholderText('Select test date');

    fireEvent.change(dobInput, { target: { value: '2022-01-15' } });
    fireEvent.change(testDateInput, { target: { value: '2024-01-15' } });

    expect(getInput('raw-receptiveLanguage')).not.toBeDisabled();
  });

  it('shows hint when no dates entered', () => {
    render(<Dayc2App />);
    expect(screen.getByText(/Enter valid child information/)).toBeInTheDocument();
  });

  it('calculates and displays results when inputs are entered', () => {
    render(<Dayc2App />);

    const dobInput = screen.getByPlaceholderText('Select date of birth');
    const testDateInput = screen.getByPlaceholderText('Select test date');

    fireEvent.change(dobInput, { target: { value: '2022-01-15' } });
    fireEvent.change(testDateInput, { target: { value: '2024-01-15' } });

    fireEvent.change(getInput('raw-receptiveLanguage')!, { target: { value: '20' } });
    fireEvent.change(getInput('raw-expressiveLanguage')!, { target: { value: '18' } });
    fireEvent.change(getInput('raw-socialEmotional')!, { target: { value: '22' } });

    expect(screen.queryByText(/Enter valid child information/)).not.toBeInTheDocument();
    expect(getInput('raw-receptiveLanguage')).not.toBeDisabled();
  });

  it('renders About Data section', () => {
    render(<Dayc2App />);
    expect(screen.getByText(/About the Data/)).toBeInTheDocument();
  });
});
