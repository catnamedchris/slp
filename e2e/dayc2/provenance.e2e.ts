/**
 * E2E Tests for Provenance Panel
 *
 * Tests the provenance drill-down feature that shows lookup steps
 */

import { test, expect, Page } from '@playwright/test';

// Helper to enable age override mode and set age
const setAgeOverride = async (page: Page, ageMonths: number) => {
  await page.getByLabel('Enter age directly').check();
  await page.getByLabel('Age (months)').fill(ageMonths.toString());
};

// Helper to enter a raw score for a subtest
const enterRawScore = async (page: Page, subtestName: string, score: number) => {
  const input = page.getByRole('spinbutton', { name: subtestName });
  await input.fill(score.toString());
};

// Helper to click a score cell in the desktop table view
const clickScoreCell = async (page: Page, subtestLabel: string, columnIndex: number) => {
  const row = page.locator('tr').filter({ has: page.locator(`label:has-text("${subtestLabel}")`) });
  const cell = row.locator('td').nth(columnIndex);
  await cell.click();
};

test.describe('Provenance Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('opens provenance panel when clicking a score', async ({ page }) => {
    await setAgeOverride(page, 12);
    await enterRawScore(page, 'Receptive Language', 10);

    // Click standard score cell (column 2)
    await clickScoreCell(page, 'Receptive Language', 2);

    // Provenance panel should appear
    await expect(page.getByText('How was this calculated?')).toBeVisible();
  });

  test('displays lookup steps in provenance panel', async ({ page }) => {
    await setAgeOverride(page, 12);
    await enterRawScore(page, 'Receptive Language', 10);

    // Click standard score
    await clickScoreCell(page, 'Receptive Language', 2);

    // Should show table reference
    await expect(page.getByText(/Table B13/)).toBeVisible();

    // Should show CSV filename
    await expect(page.getByText(/\.csv/)).toBeVisible();
  });

  test('closes provenance panel when clicking backdrop', async ({ page }) => {
    await setAgeOverride(page, 12);
    await enterRawScore(page, 'Receptive Language', 10);

    await clickScoreCell(page, 'Receptive Language', 2);
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    // Click backdrop to close
    await page.locator('.fixed.inset-0').first().click();

    await expect(page.getByText('How was this calculated?')).not.toBeVisible();
  });

  test('closes provenance panel when clicking close button', async ({ page }) => {
    await setAgeOverride(page, 12);
    await enterRawScore(page, 'Receptive Language', 10);

    await clickScoreCell(page, 'Receptive Language', 2);
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    // Click close button
    await page.getByRole('button', { name: '✕' }).click();

    await expect(page.getByText('How was this calculated?')).not.toBeVisible();
  });

  test('highlights the clicked cell while panel is open', async ({ page }) => {
    await setAgeOverride(page, 12);
    await enterRawScore(page, 'Receptive Language', 10);

    const row = page.locator('tr').filter({ has: page.locator('label:has-text("Receptive Language")') });
    const cell = row.locator('td').nth(2);

    await cell.click();

    // Cell should have highlight styling (indigo shadow)
    await expect(cell).toHaveClass(/bg-indigo-50/);
  });

  test('percentile lookup shows multi-step provenance', async ({ page }) => {
    await setAgeOverride(page, 12);
    await enterRawScore(page, 'Receptive Language', 10);

    // Click percentile cell (column 3)
    await clickScoreCell(page, 'Receptive Language', 3);

    // Percentile lookup involves multiple steps:
    // 1. Raw → Standard Score (B table)
    // 2. Standard Score → Percentile (C1 table)
    const steps = page.locator('[class*="flex gap-4 mb-5"]');
    const stepCount = await steps.count();
    expect(stepCount).toBeGreaterThanOrEqual(2);
  });

  test('shows About Data section with source info', async ({ page }) => {
    // Click to expand About Data section
    await page.getByRole('button', { name: /About the Data/ }).click();

    // Should show table info
    await expect(page.getByText('All scores are calculated using direct table lookups')).toBeVisible();

    // Should show SHA-256 column
    await expect(page.getByText('SHA-256')).toBeVisible();

    // Should show generator version
    await expect(page.getByText(/Generated:/)).toBeVisible();
  });

  test('About Data shows unique source files', async ({ page }) => {
    await page.getByRole('button', { name: /About the Data/ }).click();

    // Should list CSV files
    const csvCells = page.locator('td:has-text(".csv")');
    const count = await csvCells.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Provenance on Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('opens provenance as bottom sheet on mobile', async ({ page }) => {
    await setAgeOverride(page, 12);

    // Find and interact with mobile card
    const rlCard = page.locator('section').filter({ hasText: 'Receptive Language' }).first();
    await rlCard.getByRole('spinbutton').fill('10');

    // Click a score chip button
    const standardChip = rlCard.getByRole('button').filter({ hasText: /Standard/ });
    await standardChip.click();

    // Panel should appear as bottom sheet
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    // Should have drag handle indicator
    await expect(page.locator('.lg\\:hidden .bg-gray-300')).toBeVisible();
  });
});
