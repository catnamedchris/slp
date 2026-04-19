/**
 * E2E Tests for SkillsSection / ChipInput functionality
 *
 * Covers chip add/remove, validation warnings (duplicate, conflict, out-of-range),
 * copy feedback, and localStorage persistence.
 */

import { test, expect, Page } from '@playwright/test';

// Helper to set age via localStorage and reload so SubtestRows render
const setAge = async (page: Page, ageMonths: number) => {
  const testDate = new Date();
  const dob = new Date(testDate);
  dob.setMonth(dob.getMonth() - ageMonths);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  await page.evaluate(
    ([dobIso, testIso]) => {
      localStorage.setItem('slp:dayc2:dob', JSON.stringify(dobIso));
      localStorage.setItem('slp:dayc2:testDate', JSON.stringify(testIso));
    },
    [fmt(dob), fmt(testDate)],
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
    await setAge(page, 24);
  });

  test('adds chips via Enter key', async ({ page }) => {
    await addChip(page, 'Receptive Language', 'able', '5');

    await expect(chipLocator(page, 'Receptive Language', 'able', '5')).toBeVisible();
  });

  test('adds chips via comma', async ({ page }) => {
    const input = getChipInput(page, 'Receptive Language', 'able');
    await input.click();
    await input.fill('8,11,14');
    await input.press('Enter');

    await expect(chipLocator(page, 'Receptive Language', 'able', '8')).toBeVisible();
    await expect(chipLocator(page, 'Receptive Language', 'able', '11')).toBeVisible();
    await expect(chipLocator(page, 'Receptive Language', 'able', '14')).toBeVisible();
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

  test('copy button shows feedback', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await addChip(page, 'Receptive Language', 'able', '5');

    const copyBtn = page.getByLabel('Copy Receptive Language able items');
    await copyBtn.click();

    await expect(page.getByText('Copied!')).toBeVisible();
  });
});

test.describe('Skills Persistence', () => {
  test('skill items persist across reload', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });

    // Seed skill items and age into localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        'slp:dayc2:skillItems',
        JSON.stringify({
          receptiveLanguage: { able: [1, 5, 10], unable: [] },
          expressiveLanguage: { able: [], unable: [] },
          socialEmotional: { able: [], unable: [] },
        }),
      );
    });
    await setAge(page, 24);

    await expect(chipLocator(page, 'Receptive Language', 'able', '1')).toBeVisible();
    await expect(chipLocator(page, 'Receptive Language', 'able', '5')).toBeVisible();
    await expect(chipLocator(page, 'Receptive Language', 'able', '10')).toBeVisible();
  });
});
