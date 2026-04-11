import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillsSection from './SkillsSection';

const defaultProps = {
  subtest: 'receptiveLanguage' as const,
  input: { able: '', unable: '' },
  onItemsChange: vi.fn(),
};

describe('SkillsSection', () => {
  it('renders able and unable columns', () => {
    render(<SkillsSection {...defaultProps} />);
    expect(screen.getByText('✓ Able to')).toBeInTheDocument();
    expect(screen.getByText('✗ Unable to')).toBeInTheDocument();
  });

  it('renders text inputs for both lists', () => {
    render(<SkillsSection {...defaultProps} />);
    expect(screen.getByLabelText('receptiveLanguage able items')).toBeInTheDocument();
    expect(screen.getByLabelText('receptiveLanguage unable items')).toBeInTheDocument();
  });

  it('shows empty hint when no items entered', () => {
    render(<SkillsSection {...defaultProps} />);
    const hints = screen.getAllByText('Enter item numbers');
    expect(hints.length).toBe(2);
  });

  it('calls onItemsChange when able input changes', () => {
    const onItemsChange = vi.fn();
    render(<SkillsSection {...defaultProps} onItemsChange={onItemsChange} />);
    fireEvent.change(screen.getByLabelText('receptiveLanguage able items'), {
      target: { value: '12, 14' },
    });
    expect(onItemsChange).toHaveBeenCalledWith('receptiveLanguage', 'able', '12, 14');
  });

  it('calls onItemsChange when unable input changes', () => {
    const onItemsChange = vi.fn();
    render(<SkillsSection {...defaultProps} onItemsChange={onItemsChange} />);
    fireEvent.change(screen.getByLabelText('receptiveLanguage unable items'), {
      target: { value: '16' },
    });
    expect(onItemsChange).toHaveBeenCalledWith('receptiveLanguage', 'unable', '16');
  });

  it('renders item chips when items are entered', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: '12, 14', unable: '16' }}
      />
    );
    expect(screen.getByText('Item 12')).toBeInTheDocument();
    expect(screen.getByText('Item 14')).toBeInTheDocument();
    expect(screen.getByText('Item 16')).toBeInTheDocument();
  });

  it('disables copy button when no items', () => {
    render(<SkillsSection {...defaultProps} />);
    const copyButtons = screen.getAllByText('📋 Copy');
    for (const btn of copyButtons) {
      expect(btn.closest('button')).toBeDisabled();
    }
  });

  it('enables copy button when items exist and no conflicts', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: '12, 14', unable: '' }}
      />
    );
    const copyButtons = screen.getAllByRole('button', { name: /Copy/ });
    // The able column copy button should be enabled
    expect(copyButtons[0]).not.toBeDisabled();
  });

  it('disables copy when conflicts exist', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: '12, 14', unable: '14, 18' }}
      />
    );
    const copyButtons = screen.getAllByRole('button', { name: /Copy/ });
    for (const btn of copyButtons) {
      expect(btn).toBeDisabled();
    }
  });

  it('shows conflict warning when same item in both lists', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: '12, 14', unable: '14, 18' }}
      />
    );
    expect(screen.getAllByText(/Conflict: items 14 in both lists/).length).toBeGreaterThan(0);
  });

  it('highlights conflicting chips with warning style', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: '12, 14', unable: '14, 18' }}
      />
    );
    const warningChips = screen.getAllByText(/⚠/);
    expect(warningChips.length).toBeGreaterThan(0);
  });
});
