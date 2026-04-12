import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders app shell branding', () => {
    render(<App />);
    expect(screen.getAllByText(/slp/).length).toBeGreaterThan(0);
    expect(screen.getByText('v1.0.0-test')).toBeInTheDocument();
  });

  it('renders version badge', () => {
    render(<App />);
    expect(screen.getByText('v1.0.0-test')).toBeInTheDocument();
  });
});
