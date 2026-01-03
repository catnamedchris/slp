/**
 * E2E Tests for the full scoring flow
 *
 * Tests the complete workflow: enter child info → enter raw scores → verify results
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

// Helper to get a subtest row by label (desktop table view)
const getSubtestRow = (page: Page, subtestLabel: string) => {
  return page.locator('tr').filter({ has: page.locator(`label:has-text("${subtestLabel}")`) });
};

// Helper to get scores from a subtest row (desktop view)
const getSubtestScores = async (page: Page, subtestLabel: string) => {
  const row = getSubtestRow(page, subtestLabel);
  const cells = row.locator('td');

  // Row structure: label | raw input | standard | percentile | age equiv
  const standard = await cells.nth(2).textContent();
  const percentile = await cells.nth(3).textContent();
  const ageEquiv = await cells.nth(4).textContent();

  return { standard, percentile, ageEquiv };
};

// Helper to get domain row scores (desktop view)
const getDomainScores = async (page: Page, domainLabel: string) => {
  const row = page.locator('tr.composite-row').filter({ hasText: domainLabel });
  const cells = row.locator('td');

  // Row structure: label | sum | standard | percentile | age equiv (N/A)
  const sum = await cells.nth(1).textContent();
  const standard = await cells.nth(2).textContent();
  const percentile = await cells.nth(3).textContent();

  return { sum, standard, percentile };
};

// Helper to enable a domain in display settings
const enableDomain = async (page: Page, domainLabel: string) => {
  const details = page.locator('details summary:has-text("Display Settings")');
  await details.click();
  await page.getByLabel(domainLabel).check();
  await details.click(); // close
};

// Helper to enable a subtest in display settings
const enableSubtest = async (page: Page, subtestName: string) => {
  const details = page.locator('details summary:has-text("Display Settings")');
  await details.click();
  await page.getByLabel(subtestName).check();
  await details.click(); // close
};

test.describe('Full Scoring Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Use larger viewport to test desktop table view
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('enters age and raw scores, displays calculated results', async ({ page }) => {
    // Set age to 12 months (first age band)
    await setAgeOverride(page, 12);
    await expect(page.getByText('12 months', { exact: true })).toBeVisible();

    // Enter raw score for Receptive Language (raw 10 at 12mo → SS 84 per B13 table)
    await enterRawScore(page, 'Receptive Language', 10);

    // Verify standard score appears
    const rlScores = await getSubtestScores(page, 'Receptive Language');
    expect(rlScores.standard).toBe('84');
    expect(rlScores.percentile).toBe('14%');
  });

  test('calculates domain composite scores', async ({ page }) => {
    await setAgeOverride(page, 12);

    // Enable Communication domain (hidden by default)
    await enableDomain(page, 'Communication (RL+EL)');

    // Enter scores for Communication domain subtests (RL + EL)
    // From B13: raw 10 → RL SS 84, raw 10 → EL SS 90
    await enterRawScore(page, 'Receptive Language', 10);
    await enterRawScore(page, 'Expressive Language', 10);

    // Check Communication domain composite appears
    // Sum should be 84 + 90 = 174
    const commScores = await getDomainScores(page, 'Communication');
    expect(commScores.sum?.trim()).toBe('174');
    // Standard score comes from D1 table lookup
    expect(commScores.standard).not.toBe('—');
  });

  test('calculates Physical domain composite', async ({ page }) => {
    await setAgeOverride(page, 12);

    // Enable Physical domain and required subtests (hidden by default)
    await enableDomain(page, 'Physical (GM+FM)');
    await enableSubtest(page, 'Gross Motor');
    await enableSubtest(page, 'Fine Motor');

    // Enter scores for Physical domain subtests (GM + FM)
    // From B13: raw 9 → GM SS 50, raw 10 → FM SS 82
    await enterRawScore(page, 'Gross Motor', 9);
    await enterRawScore(page, 'Fine Motor', 10);

    // Check Physical domain composite
    const physScores = await getDomainScores(page, 'Physical');
    expect(physScores.sum?.trim()).toBe('132');
    expect(physScores.standard).not.toBe('—');
  });

  test('shows placeholder when no raw score entered', async ({ page }) => {
    await setAgeOverride(page, 24);

    // Without entering any scores, results should show dashes
    const rlScores = await getSubtestScores(page, 'Receptive Language');
    expect(rlScores.standard).toBe('—');
    expect(rlScores.percentile).toBe('—');
    expect(rlScores.ageEquiv).toBe('—');
  });

  test('handles boundary raw scores with annotations', async ({ page }) => {
    await setAgeOverride(page, 12);

    // Enter raw score that yields a bounded value (e.g., <50)
    // From B13: raw 4 → receptiveLanguage 52, raw 3 → <50 bound for most subtests
    // Use Social-Emotional which is visible by default: raw 2 → <50
    await enterRawScore(page, 'Social-Emotional', 2);

    const seScores = await getSubtestScores(page, 'Social-Emotional');
    expect(seScores.standard).toBe('<50');
  });

  test('handles upper boundary scores (>150)', async ({ page }) => {
    await setAgeOverride(page, 12);

    // From B13: raw 45 → social_emotional >150
    await enterRawScore(page, 'Social-Emotional', 45);

    const seScores = await getSubtestScores(page, 'Social-Emotional');
    expect(seScores.standard).toBe('>150');
  });

  test('updates results when raw score changes', async ({ page }) => {
    await setAgeOverride(page, 12);

    // Enter initial score (using visible subtest)
    await enterRawScore(page, 'Social-Emotional', 10);
    let scores = await getSubtestScores(page, 'Social-Emotional');
    expect(scores.standard).toBe('65');

    // Change to different score
    await enterRawScore(page, 'Social-Emotional', 15);
    scores = await getSubtestScores(page, 'Social-Emotional');
    expect(scores.standard).toBe('79');
  });

  test('updates results when age changes', async ({ page }) => {
    await setAgeOverride(page, 12);
    await enterRawScore(page, 'Receptive Language', 10);

    let scores = await getSubtestScores(page, 'Receptive Language');
    const scoreAt12 = scores.standard;

    // Change age - same raw score should give different standard score
    await page.getByLabel('Age (months)').fill('24');
    scores = await getSubtestScores(page, 'Receptive Language');
    const scoreAt24 = scores.standard;

    // Different age bands have different conversions
    expect(scoreAt12).not.toBe(scoreAt24);
  });

  test('all seven subtests can be scored', async ({ page }) => {
    await setAgeOverride(page, 12);

    // Enable all subtests (only RL, EL, SE visible by default)
    const hiddenSubtests = ['Cognitive', 'Gross Motor', 'Fine Motor', 'Adaptive Behavior'];
    for (const subtest of hiddenSubtests) {
      await enableSubtest(page, subtest);
    }

    const allSubtests = [
      'Cognitive',
      'Receptive Language',
      'Expressive Language',
      'Social-Emotional',
      'Gross Motor',
      'Fine Motor',
      'Adaptive Behavior',
    ];

    // Enter scores for all subtests
    for (const subtest of allSubtests) {
      await enterRawScore(page, subtest, 10);
    }

    // Verify all have results
    for (const subtest of allSubtests) {
      const scores = await getSubtestScores(page, subtest);
      expect(scores.standard).not.toBe('—');
    }
  });
});

test.describe('Mobile Card Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('displays scores in card layout on mobile', async ({ page }) => {
    await setAgeOverride(page, 12);

    // Find mobile card by section heading
    const rlCard = page.locator('section').filter({ hasText: 'Receptive Language' }).first();
    await expect(rlCard).toBeVisible();

    // Enter score via mobile input
    const input = rlCard.getByRole('spinbutton');
    await input.fill('10');

    // Verify score chips appear
    await expect(rlCard.getByText('84')).toBeVisible();
    await expect(rlCard.getByText('14%')).toBeVisible();
  });
});
