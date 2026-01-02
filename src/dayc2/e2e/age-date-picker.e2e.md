# E2E Tests: Age/Date Picker Scenarios

## Test Environment
- URL: http://localhost:5173/
- Prerequisites: Dev server running (`npm run dev`)

## Test Results Summary (Dec 31, 2025)
| Test | Status |
|------|--------|
| Test 1: Valid Age Calculation | ✅ PASS |
| Test 2: Below Minimum Age | ✅ PASS |
| Test 3: Above Maximum Age | ✅ PASS (via override mode) |
| Test 4: Test Date Before Birth Date | ⏭️ SKIP (UI prevents; covered by unit test) |
| Test 5: Age Override Valid | ✅ PASS |
| Test 6: Override Below Minimum | ✅ PASS |
| Test 7: Override Above Maximum | ✅ PASS |
| Test 8: No Restrictions Without Test Date | ✅ PASS |
| Test 9: Birth Date Restricted After Test Date | ✅ PASS |
| Test 10: Mode Toggle Preserves Dates | 🔲 TODO |

## Running E2E Tests

```bash
# Install Playwright (if not installed)
npm install -D @playwright/test

# Run E2E tests
npx playwright test src/dayc2/e2e/age-date-picker.e2e.ts
```

---

## Test 1: Date Mode - Valid Age Calculation

**Steps:**
1. Navigate to app
2. Click on "Test Date" field
3. Select today's date
4. Click on "Birth Date" field  
5. Select a date 24 months ago

**Expected:**
- Age displays "24 months"
- Age Band label is shown
- No error message
- Score inputs become enabled

---

## Test 2: Date Mode - Below Minimum Age (< 12 months)

**Steps:**
1. Navigate to app
2. Click on "Test Date" field
3. Select today's date
4. Click on "Birth Date" field
5. Select a date 6 months ago

**Expected:**
- Age displays "6 months"
- Error message: "Age 6 months is below DAYC-2 minimum (12 months)"
- Score inputs remain disabled

---

## Test 3: Date Mode - Above Maximum Age (> 71 months)

**Steps:**
1. Navigate to app
2. Click on "Test Date" field
3. Select today's date
4. Click on "Birth Date" field
5. Select a date 72+ months ago

**Expected:**
- Age displays "72 months" (or higher)
- Error message: "above DAYC-2 maximum (71 months)"
- Score inputs remain disabled

---

## Test 4: Date Mode - Test Date Before Birth Date

**Steps:**
1. Navigate to app
2. Click on "Birth Date" field
3. Select a date in 2024
4. Click on "Test Date" field
5. Select a date in 2023 (before birth date)

**Expected:**
- Negative age displayed
- Error message: "Test date cannot be before date of birth"
- Score inputs remain disabled

---

## Test 5: Age Override Mode - Valid Age

**Steps:**
1. Navigate to app
2. Check "Enter age directly" checkbox
3. Enter "36" in age input

**Expected:**
- Age displays "36 months"
- Age Band label is shown
- No error message
- Score inputs become enabled

---

## Test 6: Age Override Mode - Below Minimum

**Steps:**
1. Navigate to app
2. Check "Enter age directly" checkbox
3. Enter "5" in age input

**Expected:**
- Age displays "5 months"
- Error message: "below DAYC-2 minimum"
- Score inputs remain disabled

---

## Test 7: Age Override Mode - Above Maximum

**Steps:**
1. Navigate to app
2. Check "Enter age directly" checkbox
3. Enter "80" in age input

**Expected:**
- Age displays "80 months"
- Error message: "above DAYC-2 maximum"
- Score inputs remain disabled

---

## Test 8: Date Picker Constraints - No Restrictions Without Test Date

**Steps:**
1. Navigate to app (fresh)
2. Click on "Birth Date" field
3. Check available years in dropdown

**Expected:**
- All reasonable years are selectable (not restricted)
- No artificial min/max date constraint

---

## Test 9: Date Picker Constraints - Birth Date Restricted After Test Date Set

**Steps:**
1. Navigate to app
2. Click on "Test Date" field
3. Select Dec 31, 2024
4. Click on "Birth Date" field
5. Check available dates

**Expected:**
- Birth date cannot be after Dec 31, 2024
- Birth date min is approximately 6 years before test date (around 2019)

---

## Test 10: Mode Toggle Persistence

**Steps:**
1. Navigate to app
2. Enter birth date and test date (valid age)
3. Check "Enter age directly" checkbox
4. Verify date inputs disappear
5. Uncheck "Enter age directly" checkbox

**Expected:**
- Date inputs reappear
- Previously entered dates are preserved (or cleared - document actual behavior)
