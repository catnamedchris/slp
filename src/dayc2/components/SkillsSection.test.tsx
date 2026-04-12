import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillsSection from './SkillsSection';

const defaultProps = {
  subtest: 'receptiveLanguage' as const,
  input: { able: [] as number[], unable: [] as number[] },
  onItemsChange: vi.fn(),
};

describe('SkillsSection', () => {
  it('renders able and unable labels', () => {
    render(<SkillsSection {...defaultProps} />);
    expect(screen.getByText('Able')).toBeInTheDocument();
    expect(screen.getByText('Unable')).toBeInTheDocument();
  });

  it('renders chip inputs for both lists', () => {
    render(<SkillsSection {...defaultProps} />);
    expect(screen.getByLabelText('Receptive Language able items')).toBeInTheDocument();
    expect(screen.getByLabelText('Receptive Language unable items')).toBeInTheDocument();
  });

  it('shows placeholder when no items', () => {
    render(<SkillsSection {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. 8, 11, 14')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 16, 18')).toBeInTheDocument();
  });

  it('renders chips for items', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [16] }}
      />,
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('renders dismiss buttons on chips', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [] }}
      />,
    );
    expect(screen.getByLabelText('Remove Receptive Language able item 12')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Receptive Language able item 14')).toBeInTheDocument();
  });

  it('calls onItemsChange when chip is dismissed', async () => {
    const onItemsChange = vi.fn();
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [] }}
        onItemsChange={onItemsChange}
      />,
    );
    await userEvent.click(screen.getByLabelText('Remove Receptive Language able item 12'));
    expect(onItemsChange).toHaveBeenCalledWith('receptiveLanguage', 'able', [14]);
  });

  it('adds items on Enter', async () => {
    const onItemsChange = vi.fn();
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [], unable: [] }}
        onItemsChange={onItemsChange}
      />,
    );
    const input = screen.getByLabelText('Receptive Language able items');
    await userEvent.type(input, '8{Enter}');
    expect(onItemsChange).toHaveBeenCalledWith('receptiveLanguage', 'able', [8]);
  });

  it('hides copy button when no items', () => {
    render(<SkillsSection {...defaultProps} />);
    expect(screen.queryByLabelText('Copy Receptive Language able items')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Copy Receptive Language unable items')).not.toBeInTheDocument();
  });

  it('shows enabled copy button when items exist and no errors', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [] }}
      />,
    );
    const copyBtn = screen.getByLabelText('Copy Receptive Language able items');
    expect(copyBtn).toBeInTheDocument();
    expect(copyBtn).not.toBeDisabled();
  });

  it('shows disabled copy button when conflicts exist', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [14, 18] }}
      />,
    );
    const copyAble = screen.getByLabelText('Copy Receptive Language able items');
    const copyUnable = screen.getByLabelText('Copy Receptive Language unable items');
    expect(copyAble).toBeDisabled();
    expect(copyUnable).toBeDisabled();
  });

  it('shows conflict warning when same item in both lists', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [14, 18] }}
      />,
    );
    expect(screen.getByText(/Conflict: items 14 in both lists/)).toBeInTheDocument();
  });

  it('conflict warning has role="alert"', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [14, 18] }}
      />,
    );
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.includes('Conflict'))).toBe(true);
  });

  it('highlights conflicting chips with warning style', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [14, 18] }}
      />,
    );
    const chips = screen.getAllByTitle('Conflict: item appears in both lists');
    expect(chips.length).toBeGreaterThan(0);
  });

  it('shows out-of-range warning for invalid items', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [10, 35], unable: [] }}
      />,
    );
    expect(screen.getByText(/Invalid: items 35 exceed max/)).toBeInTheDocument();
  });

  it('out-of-range warning has role="alert"', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [10, 35], unable: [] }}
      />,
    );
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.includes('Invalid'))).toBe(true);
  });

  it('renders out-of-range chips with title', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [35], unable: [] }}
      />,
    );
    expect(screen.getByTitle('Invalid: item number does not exist for this subtest')).toBeInTheDocument();
  });

  it('disables copy button when out-of-range items exist in that list', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [10, 35], unable: [20] }}
      />,
    );
    const copyAble = screen.getByLabelText('Copy Receptive Language able items');
    expect(copyAble).toBeDisabled();
  });

  it('allows copy of clean list when other list has out-of-range', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [10, 12], unable: [36] }}
      />,
    );
    const copyAble = screen.getByLabelText('Copy Receptive Language able items');
    expect(copyAble).not.toBeDisabled();
    const copyUnable = screen.getByLabelText('Copy Receptive Language unable items');
    expect(copyUnable).toBeDisabled();
  });

  // Duplicate tests
  it('allows duplicate entry and shows both chips', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [8, 8, 12], unable: [] }}
      />,
    );
    const chips8 = screen.getAllByText('8');
    expect(chips8).toHaveLength(2);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows duplicate warning', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [8, 8], unable: [] }}
      />,
    );
    expect(screen.getByText(/Duplicate: items 8 entered more than once/)).toBeInTheDocument();
  });

  it('duplicate warning has role="alert"', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [8, 8], unable: [] }}
      />,
    );
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.includes('Duplicate'))).toBe(true);
  });

  it('highlights duplicate chips with warning style', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [8, 8], unable: [] }}
      />,
    );
    const chips = screen.getAllByTitle('Duplicate: item entered more than once');
    expect(chips).toHaveLength(2);
  });

  it('disables copy when duplicates exist in that list', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [8, 8], unable: [16] }}
      />,
    );
    const copyAble = screen.getByLabelText('Copy Receptive Language able items');
    expect(copyAble).toBeDisabled();
    const copyUnable = screen.getByLabelText('Copy Receptive Language unable items');
    expect(copyUnable).not.toBeDisabled();
  });

  it('removing one duplicate leaves a valid single item', async () => {
    const onItemsChange = vi.fn();
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [8, 8], unable: [] }}
        onItemsChange={onItemsChange}
      />,
    );
    const removeButtons = screen.getAllByLabelText('Remove Receptive Language able item 8');
    await userEvent.click(removeButtons[0]);
    expect(onItemsChange).toHaveBeenCalledWith('receptiveLanguage', 'able', [8]);
  });
});
