/**
 * E2E Tests for SkillsSection / ChipInput functionality
 *
 * Covers chip add/remove, validation warnings (duplicate, conflict, out-of-range),
 * copy feedback, and localStorage persistence.
 */

import { test, expect, Page } from '@playwright/test';

// Helper to seed fixed DOB and test date via localStorage and reload
const seedDates = async (page: Page, dob: string, testDate: string) => {
  await page.evaluate(
    ([dobIso, testIso]) => {
      localStorage.setItem('slp:dayc2:dob', JSON.stringify(dobIso));
      localStorage.setItem('slp:dayc2:testDate', JSON.stringify(testIso));
    },
    [dob, testDate],
  );
  await page.reload();
};

// Helper to locate the chip input for a given subtest and list
const getChipInput = (page: Page, subtestLabel: string, list: 'able' | 'unable') => {
  return page.getByRole('textbox', { name: `${subtestLabel} ${list} items` });
};

// Helper to add a chip by typing a value and pressing Enter
const addChip = async (page: Page, subtestLabel: string, list: 'able' | 'unable', value: string) => {
  const input = getChipInput(page, subtestLabel, list);
  await input.click();
  await input.fill(value);
  await input.press('Enter');
};

// Helper to find a chip span by exact number text within a container
const chipLocator = (page: Page, subtestLabel: string, list: 'able' | 'unable', value: string) => {
  const container = getChipInput(page, subtestLabel, list).locator('..');
  return container.locator('span').filter({ has: page.locator(`text="${value}"`) }).filter({ has: page.locator('button') });
};

test.describe('Skills / Chip Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
    await seedDates(page, '2023-06-15', '2025-06-15');
  });

  test('adds chips via Enter key', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '5');

    await expect(chipLocator(page, 'Receptive Language', 'able', '5')).toBeVisible();
  });

  test('adds chips via comma key', async ({ page }) => {
    const input = getChipInput(page, 'Receptive Language', 'able');
    await input.click();
    await input.pressSequentially('8');
    await input.press(',');

    await expect(chipLocator(page, 'Receptive Language', 'able', '8')).toBeVisible();
  });

  test('removes chip via remove button', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '5');

    const removeBtn = page.getByLabel('Remove Receptive Language able item 5');
    await removeBtn.click();

    await expect(chipLocator(page, 'Receptive Language', 'able', '5')).not.toBeVisible();
  });

  test('removes last chip via Backspace', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '5');
    await addChip(page, 'Receptive Language', 'able', '10');

    const input = getChipInput(page, 'Receptive Language', 'able');
    await input.click();
    await input.press('Backspace');

    await expect(chipLocator(page, 'Receptive Language', 'able', '5')).toBeVisible();
    await expect(chipLocator(page, 'Receptive Language', 'able', '10')).not.toBeVisible();
  });

  test('shows duplicate warning', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '5');
    await addChip(page, 'Receptive Language', 'able', '5');

    await expect(page.getByRole('alert').filter({ hasText: /Duplicate.*5.*more than once/ })).toBeVisible();
  });

  test('shows conflict warning', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '5');
    await addChip(page, 'Receptive Language', 'unable', '5');

    await expect(page.getByRole('alert').filter({ hasText: /Conflict.*5.*both lists/ })).toBeVisible();
  });

  test('shows out-of-range warning', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '35');

    await expect(page.getByRole('alert').filter({ hasText: /Invalid.*35.*max.*34/ })).toBeVisible();
  });

  test('duplicate warning clears after removing duplicate', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '5');
    await addChip(page, 'Receptive Language', 'able', '5');

    await expect(page.getByRole('alert').filter({ hasText: /Duplicate/ })).toBeVisible();

    // Remove one of the duplicates
    const removeBtn = page.getByLabel('Remove Receptive Language able item 5').first();
    await removeBtn.click();

    await expect(page.getByRole('alert').filter({ hasText: /Duplicate/ })).not.toBeVisible();
  });

  test('copy button disabled when items have errors', async ({ page }) => {
    // Add an out-of-range item (max for RL is 34)
    await addChip(page, 'Receptive Language', 'able', '35');

    const copyBtn = page.getByLabel('Copy Receptive Language able items');
    await expect(copyBtn).toBeDisabled();
  });

  test('copy button shows feedback', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await addChip(page, 'Receptive Language', 'able', '5');

    const copyBtn = page.getByLabel('Copy Receptive Language able items');
    await copyBtn.click();

    await expect(page.getByText('Copied!')).toBeVisible();
  });

  test('copy button copies correct text to clipboard', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await addChip(page, 'Receptive Language', 'able', '5');
    await addChip(page, 'Receptive Language', 'able', '10');

    const copyBtn = page.getByLabel('Copy Receptive Language able items');
    await copyBtn.click();

    await expect(page.getByText('Copied!')).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('5, 10');
  });
});

test.describe('Skills Persistence', () => {
  test('skill items persist across reload', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
    await seedDates(page, '2023-06-15', '2025-06-15');

    // Add chips through the UI
    await addChip(page, 'Receptive Language', 'able', '5');
    await addChip(page, 'Receptive Language', 'able', '10');

    await expect(chipLocator(page, 'Receptive Language', 'able', '5')).toBeVisible();
    await expect(chipLocator(page, 'Receptive Language', 'able', '10')).toBeVisible();

    // Reload and verify persistence
    await page.reload();

    await expect(chipLocator(page, 'Receptive Language', 'able', '5')).toBeVisible();
    await expect(chipLocator(page, 'Receptive Language', 'able', '10')).toBeVisible();
  });
});
