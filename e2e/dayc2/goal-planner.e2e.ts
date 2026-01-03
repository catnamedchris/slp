/**
 * E2E Tests for Goal Planner (Reverse Lookup)
 *
 * Tests entering a target percentile and viewing required raw scores
 */

import { test, expect, Page } from '@playwright/test';

// Helper to enable age override mode and set age
const setAgeOverride = async (page: Page, ageMonths: number) => {
  await page.getByLabel('Enter age directly').check();
  await page.getByLabel('Age (months)').fill(ageMonths.toString());
};

// Helper to toggle display settings
const openDisplaySettings = async (page: Page) => {
  await page.locator('details summary:has-text("Display Settings")').click();
};

// Helper to enable a subtest in display settings
const enableSubtest = async (page: Page, subtestName: string) => {
  await openDisplaySettings(page);
  // Use checkbox role to avoid ambiguity with raw score inputs
  await page.getByRole('checkbox', { name: subtestName }).check();
  await openDisplaySettings(page); // close
};

// Helper to disable a subtest in display settings
const disableSubtest = async (page: Page, subtestName: string) => {
  await openDisplaySettings(page);
  // Use checkbox role to avoid ambiguity with raw score inputs
  await page.getByRole('checkbox', { name: subtestName }).uncheck();
  await openDisplaySettings(page); // close
};

test.describe('Goal Planner / Reverse Lookup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('displays reverse lookup section when age is valid', async ({ page }) => {
    await setAgeOverride(page, 24);

    await expect(page.getByText('Reverse Lookup')).toBeVisible();
    await expect(page.getByText('Find the raw scores needed to reach a target percentile')).toBeVisible();
  });

  test('hides reverse lookup section when no valid age', async ({ page }) => {
    // Without setting age, the section should not appear
    await expect(page.getByText('Reverse Lookup')).not.toBeVisible();
  });

  test('shows target standard score for selected percentile', async ({ page }) => {
    await setAgeOverride(page, 24);

    // Default percentile is 6
    await expect(page.getByText(/Target Standard Score:/)).toBeVisible();
    await expect(page.locator('strong.text-indigo-600')).toBeVisible();
  });

  test('changes results when target percentile is adjusted', async ({ page }) => {
    await setAgeOverride(page, 24);

    // Get initial standard score
    const initialSS = await page.locator('strong.text-indigo-600').textContent();

    // Change percentile to 50
    await page.getByLabel('Target Percentile').fill('50');

    // Standard score should change
    const newSS = await page.locator('strong.text-indigo-600').textContent();
    expect(newSS).not.toBe(initialSS);
  });

  test('displays required raw scores table', async ({ page }) => {
    await setAgeOverride(page, 24);

    // Table should have subtest rows
    const tableRows = page.locator('table tbody tr');
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);

    // Should show Min. Raw Score column header
    await expect(page.getByText('Min. Raw Score')).toBeVisible();
  });

  test('shows raw scores for each subtest', async ({ page }) => {
    await setAgeOverride(page, 24);
    await page.getByLabel('Target Percentile').fill('25');

    // Check that visible subtests are listed (RL, EL, SE are visible by default)
    const goalTable = page.locator('table').filter({ has: page.getByText('Min. Raw Score') });
    await expect(goalTable.locator('tr').filter({ hasText: 'Receptive Language' })).toBeVisible();
    await expect(goalTable.locator('tr').filter({ hasText: 'Expressive Language' })).toBeVisible();
  });

  test('raw score cells have provenance click handler', async ({ page }) => {
    await setAgeOverride(page, 24);

    // Click on a raw score cell in goal planner table
    const table = page.locator('table').filter({ has: page.getByText('Min. Raw Score') });
    const firstRow = table.locator('tbody tr').first();
    const scoreCell = firstRow.locator('td').nth(1);

    // Should have cursor pointer and underline for clickable cells
    await expect(scoreCell).toHaveClass(/cursor-pointer/);

    await scoreCell.click();

    // Provenance panel should open
    await expect(page.getByText('How was this calculated?')).toBeVisible();
  });

  test('validates percentile input range (1-99)', async ({ page }) => {
    await setAgeOverride(page, 24);

    const input = page.getByLabel('Target Percentile');

    // Input should have min/max attributes
    await expect(input).toHaveAttribute('min', '1');
    await expect(input).toHaveAttribute('max', '99');
  });

  test('respects display settings for visible subtests', async ({ page }) => {
    await setAgeOverride(page, 24);

    // Enable Cognitive first, then disable it
    await enableSubtest(page, 'Cognitive');

    // Verify Cognitive is now visible
    const goalTable = page.locator('table').filter({ has: page.getByText('Min. Raw Score') });
    await expect(goalTable.locator('tr').filter({ hasText: 'Cognitive' })).toBeVisible();

    // Disable Cognitive
    await disableSubtest(page, 'Cognitive');

    // Goal planner table should no longer show Cognitive
    await expect(goalTable.locator('tr').filter({ hasText: 'Cognitive' })).not.toBeVisible();
  });
});
