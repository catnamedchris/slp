import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dayc2App from './Dayc2App';

describe('Dayc2App', () => {
  it('renders the main heading', () => {
    render(<Dayc2App />);
    expect(screen.getByText('DAYC-2 Score Calculator')).toBeInTheDocument();
  });

  it('renders child info form', () => {
    render(<Dayc2App />);
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
  });

  it('renders raw scores form', () => {
    render(<Dayc2App />);
    expect(screen.getByLabelText('Cognitive')).toBeInTheDocument();
    expect(screen.getByLabelText('Receptive Language')).toBeInTheDocument();
  });

  it('disables raw score inputs when age is out of range', () => {
    render(<Dayc2App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2024-01-15' },
    });
    fireEvent.change(screen.getByLabelText('Test Date'), {
      target: { value: '2024-06-15' },
    });
    expect(screen.getByLabelText('Cognitive')).toBeDisabled();
  });

  it('enables raw score inputs when age is valid', () => {
    render(<Dayc2App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2022-01-15' },
    });
    fireEvent.change(screen.getByLabelText('Test Date'), {
      target: { value: '2024-01-15' },
    });
    expect(screen.getByLabelText('Cognitive')).not.toBeDisabled();
  });

  it('shows results placeholder when not all scores are entered', () => {
    render(<Dayc2App />);
    expect(screen.getByText(/Enter child information/)).toBeInTheDocument();
  });

  it('calculates and displays results when all inputs are valid', () => {
    render(<Dayc2App />);
    
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2022-01-15' },
    });
    fireEvent.change(screen.getByLabelText('Test Date'), {
      target: { value: '2024-01-15' },
    });
    
    const scores = [
      { label: 'Cognitive', value: '25' },
      { label: 'Receptive Language', value: '20' },
      { label: 'Expressive Language', value: '18' },
      { label: 'Social-Emotional', value: '22' },
      { label: 'Gross Motor', value: '30' },
      { label: 'Fine Motor', value: '28' },
      { label: 'Adaptive Behavior', value: '24' },
    ];

    for (const { label, value } of scores) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }

    expect(screen.queryByText(/Enter child information/)).not.toBeInTheDocument();
    expect(screen.getByText('Communication (RL+EL)')).toBeInTheDocument();
    expect(screen.getByText('Physical (GM+FM)')).toBeInTheDocument();
  });

  it('renders About Data section', () => {
    render(<Dayc2App />);
    expect(screen.getByText(/About the Data/)).toBeInTheDocument();
  });
});
