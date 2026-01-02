/**
 * E2E Tests for Age/Date Picker scenarios using Playwright
 * 
 * Install: npm install -D @playwright/test
 * Run: npx playwright test src/dayc2/e2e/age-date-picker.e2e.ts
 * 
 * Prerequisites:
 * - Dev server running (npm run dev) on http://localhost:5173
 */

import { test, expect, Page } from '@playwright/test';



const expectAgeVisible = async (page: Page, months: number) => {
  await expect(page.getByText(`${months} months`, { exact: true })).toBeVisible();
};

const expectAgeBandVisible = async (page: Page) => {
  await expect(page.getByText(/Age Band:/)).toBeVisible();
};

const expectScoreInputsEnabled = async (page: Page) => {
  const receptiveInput = page.getByRole('spinbutton', { name: 'Receptive Language' });
  await expect(receptiveInput).toBeEnabled();
};

const expectScoreInputsDisabled = async (page: Page) => {
  const receptiveInput = page.getByRole('spinbutton', { name: 'Receptive Language' });
  await expect(receptiveInput).toBeDisabled();
};

const expectAgeError = async (page: Page, pattern: RegExp) => {
  await expect(page.getByText(pattern)).toBeVisible();
};

// Helper to select a date in react-datepicker
const selectDate = async (page: Page, fieldLabel: string, month: string, year: string, day: string) => {
  const field = page.getByLabel(fieldLabel);
  await field.click();
  
  // Select year
  const yearDropdown = page.locator('.react-datepicker__year-select');
  await yearDropdown.selectOption(year);
  
  // Select month (react-datepicker uses month name)
  const monthDropdown = page.locator('.react-datepicker__month-select');
  await monthDropdown.selectOption(month);
  
  // Click the day - react-datepicker uses class with day number
  const dayNum = parseInt(day, 10);
  await page.locator(`.react-datepicker__day--0${dayNum.toString().padStart(2, '0')}:not(.react-datepicker__day--outside-month)`).click();
};

test.describe('Age/Date Picker E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Valid Age Calculation (24 months)', async ({ page }) => {
    // Set test date to Dec 31, 2025
    await selectDate(page, 'Test Date', 'December', '2025', '31');
    
    // Set birth date to Dec 31, 2023 (24 months before)
    await selectDate(page, 'Birth Date', 'December', '2023', '31');
    
    await expectAgeVisible(page, 24);
    await expectAgeBandVisible(page);
    await expectScoreInputsEnabled(page);
  });

  test('Below Minimum Age (6 months)', async ({ page }) => {
    // Set test date to Dec 31, 2025
    await selectDate(page, 'Test Date', 'December', '2025', '31');
    
    // Set birth date to June 30, 2025 (6 months before)
    await selectDate(page, 'Birth Date', 'June', '2025', '30');
    
    await expectAgeVisible(page, 6);
    await expectAgeError(page, /below DAYC-2 minimum/);
    await expectScoreInputsDisabled(page);
  });

  test('Above Maximum Age via Override (80 months)', async ({ page }) => {
    // Enable age override mode
    await page.getByLabel('Enter age directly').check();
    
    // Enter age of 80 months
    await page.getByLabel('Age (months)').fill('80');
    
    await expectAgeVisible(page, 80);
    await expectAgeError(page, /above DAYC-2 maximum/);
    await expectScoreInputsDisabled(page);
  });

  test('Age Override Valid (36 months)', async ({ page }) => {
    // Enable age override mode
    await page.getByLabel('Enter age directly').check();
    
    // Enter valid age
    await page.getByLabel('Age (months)').fill('36');
    
    await expectAgeVisible(page, 36);
    await expectAgeBandVisible(page);
    await expectScoreInputsEnabled(page);
  });

  test('Age Override Below Minimum (5 months)', async ({ page }) => {
    // Enable age override mode
    await page.getByLabel('Enter age directly').check();
    
    // Enter age below minimum
    await page.getByLabel('Age (months)').fill('5');
    
    await expectAgeVisible(page, 5);
    await expectAgeError(page, /below DAYC-2 minimum/);
  });

  test('Age Override Above Maximum (80 months)', async ({ page }) => {
    // Enable age override mode
    await page.getByLabel('Enter age directly').check();
    
    // Enter age above maximum
    await page.getByLabel('Age (months)').fill('80');
    
    await expectAgeVisible(page, 80);
    await expectAgeError(page, /above DAYC-2 maximum/);
  });

  test('No Date Restrictions Without Test Date', async ({ page }) => {
    // Click birth date field to open picker
    await page.getByLabel('Birth Date').click();
    
    // Check year dropdown has wide range (1900-2100)
    const yearDropdown = page.locator('.react-datepicker__year-select');
    const options = await yearDropdown.locator('option').allTextContents();
    
    expect(options).toContain('1900');
    expect(options).toContain('2100');
  });

  test('Birth Date Restricted After Test Date Set', async ({ page }) => {
    // First set test date to Dec 31, 2025
    await selectDate(page, 'Test Date', 'December', '2025', '31');
    
    // Click birth date field to open picker
    await page.getByLabel('Birth Date').click();
    
    // Check year dropdown is restricted (2019-2025 for 6 years before test date)
    const yearDropdown = page.locator('.react-datepicker__year-select');
    const options = await yearDropdown.locator('option').allTextContents();
    
    expect(options).toContain('2019');
    expect(options).toContain('2025');
    expect(options).not.toContain('2018'); // Should not have years before 6 years ago
    expect(options).not.toContain('2026'); // Should not have future years
  });

  test('Mode Toggle Preserves Dates', async ({ page }) => {
    // Enter dates
    await selectDate(page, 'Test Date', 'December', '2025', '31');
    await selectDate(page, 'Birth Date', 'December', '2023', '31');
    
    await expectAgeVisible(page, 24);
    
    // Toggle to age override mode
    await page.getByLabel('Enter age directly').check();
    
    // Verify date inputs disappear
    await expect(page.getByLabel('Birth Date')).not.toBeVisible();
    
    // Toggle back to date mode
    await page.getByLabel('Enter age directly').uncheck();
    
    // Verify date inputs reappear with preserved values
    await expect(page.getByLabel('Birth Date')).toHaveValue('12/31/2023');
    await expect(page.getByLabel('Test Date')).toHaveValue('12/31/2025');
    await expectAgeVisible(page, 24);
  });

  test('Mode Toggle After Age Change Preserves Dates', async ({ page }) => {
    // Enter dates (24 months)
    await selectDate(page, 'Test Date', 'December', '2025', '31');
    await selectDate(page, 'Birth Date', 'December', '2023', '31');
    await expectAgeVisible(page, 24);

    // Toggle to age override and change age
    await page.getByLabel('Enter age directly').check();
    await page.getByLabel('Age (months)').fill('48');
    await expectAgeVisible(page, 48);

    // Toggle back to date mode
    await page.getByLabel('Enter age directly').uncheck();

    // Dates should be preserved, showing original calculated age
    await expect(page.getByLabel('Birth Date')).toHaveValue('12/31/2023');
    await expect(page.getByLabel('Test Date')).toHaveValue('12/31/2025');
    await expectAgeVisible(page, 24);
  });
});
