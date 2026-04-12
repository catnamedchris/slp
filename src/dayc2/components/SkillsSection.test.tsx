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
    expect(screen.getByLabelText('receptiveLanguage able items')).toBeInTheDocument();
    expect(screen.getByLabelText('receptiveLanguage unable items')).toBeInTheDocument();
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
    expect(screen.getByLabelText('Remove item 12')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove item 14')).toBeInTheDocument();
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
    await userEvent.click(screen.getByLabelText('Remove item 12'));
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
    const input = screen.getByLabelText('receptiveLanguage able items');
    await userEvent.type(input, '8{Enter}');
    expect(onItemsChange).toHaveBeenCalledWith('receptiveLanguage', 'able', [8]);
  });

  it('hides copy icon when no items', () => {
    render(<SkillsSection {...defaultProps} />);
    expect(screen.queryByLabelText('Copy able items')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Copy unable items')).not.toBeInTheDocument();
  });

  it('shows copy icon when items exist and no errors', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [] }}
      />,
    );
    expect(screen.getByLabelText('Copy able items')).toBeInTheDocument();
  });

  it('hides copy icon when conflicts exist', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [12, 14], unable: [14, 18] }}
      />,
    );
    expect(screen.queryByLabelText('Copy able items')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Copy unable items')).not.toBeInTheDocument();
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

  it('renders out-of-range chips with dashed border style', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [35], unable: [] }}
      />,
    );
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('hides copy icon when out-of-range items exist', () => {
    render(
      <SkillsSection
        {...defaultProps}
        input={{ able: [10, 35], unable: [20] }}
      />,
    );
    expect(screen.queryByLabelText('Copy able items')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Copy unable items')).not.toBeInTheDocument();
  });
});
