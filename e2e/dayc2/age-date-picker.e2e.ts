/**
 * E2E Tests for Age/Date Picker scenarios using Playwright
 *
 * Tests: child bar age flow, clear flow, persistence, date picker interaction
 */

import { test, expect, Page } from '@playwright/test';

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

const clearStorage = async (page: Page) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
};

const todayFormatted = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

test.describe('Child Bar / Age Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
  });

  test('shows EmptyState when no birth date entered', async ({ page }) => {
    await clearStorage(page);
    await expect(page.getByText('Ready to calculate')).toBeVisible();
  });

  test('test date defaults to today', async ({ page }) => {
    await clearStorage(page);
    const testDateButton = page.locator('button#testDate');
    await expect(testDateButton).toContainText(todayFormatted());
  });

  test('shows age and age band for valid dates', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    await expect(page.getByText('24 mo', { exact: true })).toBeVisible();
    await expect(page.getByText('(2yr 0mo)')).toBeVisible();
    const ageBandChip = page.locator('.bg-input-bg.rounded-md');
    await expect(ageBandChip).toBeVisible();
  });

  test('shows error for age below minimum', async ({ page }) => {
    await seedDates(page, '2024-07-15', '2025-06-15');
    await expect(page.getByText(/below DAYC-2 minimum/)).toBeVisible();
    await expect(page.locator('#raw-receptiveLanguage')).not.toBeVisible();
  });

  test('shows error for age above maximum', async ({ page }) => {
    await seedDates(page, '2019-06-15', '2025-06-15');
    await expect(page.getByText(/above DAYC-2 maximum/)).toBeVisible();
    await expect(page.locator('#raw-receptiveLanguage')).not.toBeVisible();
  });

  test('shows error when test date is before birth date', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('slp:dayc2:dob', JSON.stringify('2025-06-01'));
      localStorage.setItem('slp:dayc2:testDate', JSON.stringify('2025-01-01'));
    });
    await page.reload();
    await expect(page.getByText(/before date of birth/)).toBeVisible();
  });

  test('renders scoring sections for valid age', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    await expect(page.locator('#raw-receptiveLanguage')).toBeVisible();
    await expect(page.locator('#targetPercentile')).toBeVisible();
  });

  test('hides scoring sections for invalid age', async ({ page }) => {
    await seedDates(page, '2024-07-15', '2025-06-15');
    await expect(page.locator('#raw-receptiveLanguage')).not.toBeVisible();
    await expect(page.locator('#targetPercentile')).not.toBeVisible();
  });
});

test.describe('Clear Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
  });

  test('Clear button shows confirmation', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByRole('button', { name: 'Confirm?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('Cancel preserves state', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('24 mo', { exact: true })).toBeVisible();
  });

  test('Confirm resets to empty state', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('button', { name: 'Confirm?' }).click();
    await expect(page.getByText('Ready to calculate')).toBeVisible();
    await expect(page.locator('#raw-receptiveLanguage')).not.toBeVisible();
  });
});

test.describe('Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
  });

  test('DOB and test date persist across reload', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    await expect(page.getByText('24 mo', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('24 mo', { exact: true })).toBeVisible();
  });

  test('raw scores persist across reload', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    const rawScores = {
      cognitive: null,
      receptiveLanguage: 10,
      expressiveLanguage: null,
      socialEmotional: null,
      grossMotor: null,
      fineMotor: null,
      adaptiveBehavior: null,
    };
    await page.evaluate(
      (scores) => localStorage.setItem('slp:dayc2:rawScores', JSON.stringify(scores)),
      rawScores,
    );
    await page.reload();
    await expect(page.locator('#raw-receptiveLanguage')).toHaveValue('10');
  });

  test('target percentile persists across reload', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');
    await page.evaluate(() =>
      localStorage.setItem('slp:dayc2:targetPercentile', JSON.stringify(25)),
    );
    await page.reload();
    await expect(page.locator('#targetPercentile')).toHaveValue('25');
  });
});

test.describe('Date Picker Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
  });

  test('date picker opens when clicking birth date', async ({ page }) => {
    await page.locator('button#dob').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('date picker closes on Escape', async ({ page }) => {
    await page.locator('button#dob').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('date picker closes on outside click', async ({ page }) => {
    await page.locator('button#dob').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
