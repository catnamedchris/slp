/**
 * E2E Tests for Targets (Reverse Lookup)
 *
 * Tests target percentile input and viewing required raw scores
 */

import { test, expect, Page } from '@playwright/test';

// Helper to set age via localStorage (DOB + test date)
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
    [fmt(dob), fmt(testDate)]
  );
  await page.reload();
};

test.describe('Targets / Reverse Lookup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('shows Targets section when age is valid', async ({ page }) => {
    await setAge(page, 24);

    await expect(page.getByText('Targets')).toBeVisible();
    await expect(page.locator('#targetPercentile')).toBeVisible();
  });

  test('hides Targets section when no valid age', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('#targetPercentile')).not.toBeVisible();
  });

  test('default target percentile is 6', async ({ page }) => {
    await setAge(page, 24);

    await expect(page.locator('#targetPercentile')).toHaveValue('6');
  });

  test('changing percentile updates target values', async ({ page }) => {
    await setAge(page, 24);

    // Get initial target value from the first subtest cell
    const targetsSection = page.locator('#targetPercentile').locator('..').locator('..').locator('..');
    const initialText = await targetsSection.textContent();

    // Change percentile to 50
    await page.locator('#targetPercentile').fill('50');

    const updatedText = await targetsSection.textContent();
    expect(updatedText).not.toBe(initialText);
  });

  test('target cells are clickable with provenance', async ({ page }) => {
    await setAge(page, 24);

    const cell = page.locator('[title="Click to view calculation details"]').first();
    await cell.click();

    await expect(page.getByText('How was this calculated?')).toBeVisible();
  });

  test('percentile input has min/max attributes', async ({ page }) => {
    await setAge(page, 24);

    const input = page.locator('#targetPercentile');
    await expect(input).toHaveAttribute('min', '1');
    await expect(input).toHaveAttribute('max', '99');
  });

  test('shows all three subtest abbreviations', async ({ page }) => {
    await setAge(page, 24);

    const targetsSection = page.locator('#targetPercentile').locator('..').locator('..').locator('..');
    await expect(targetsSection.getByText('RL')).toBeVisible();
    await expect(targetsSection.getByText('EL')).toBeVisible();
    await expect(targetsSection.getByText('SE')).toBeVisible();
  });
});

test.describe('Targets Sticky Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('shows sticky bar when scrolled', async ({ page }) => {
    await setAge(page, 24);

    // Enter raw scores to ensure page has enough content to scroll
    const rawInputs = page.getByRole('spinbutton');
    const count = await rawInputs.count();
    for (let i = 0; i < count; i++) {
      const input = rawInputs.nth(i);
      if (await input.isVisible()) {
        await input.fill('10');
      }
    }

    // Scroll down past the sentinel
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Verify the sticky bar shows age display and Targets label with percentile input
    const stickyPercentile = page.locator('#targetPercentile');
    await expect(stickyPercentile).toBeVisible();
    await expect(page.getByText('24 mo', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Targets')).toBeVisible();
  });
});
