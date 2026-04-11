import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders app shell branding', () => {
    render(<App />);
    expect(screen.getAllByText(/slp/).length).toBeGreaterThan(0);
    expect(screen.getByText('v0.2')).toBeInTheDocument();
  });

  it('renders assessment tabs', () => {
    render(<App />);
    expect(screen.getByText('DAYC-2')).toBeInTheDocument();
    expect(screen.getByText('OWLS-2')).toBeInTheDocument();
    expect(screen.getByText('CASL-2')).toBeInTheDocument();
    expect(screen.getByText('SSI-5')).toBeInTheDocument();
    expect(screen.getByText('CELF-5')).toBeInTheDocument();
  });

  it('renders version badge', () => {
    render(<App />);
    expect(screen.getByText('v0.2')).toBeInTheDocument();
  });
});
