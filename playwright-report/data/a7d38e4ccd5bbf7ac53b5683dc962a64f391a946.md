# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-audit.spec.ts >> Sarathi Book 360 Audit >> Phase 2: Invoice Generation Audit
- Location: tests\e2e\comprehensive-audit.spec.ts:44:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("BILL")')
    - locator resolved to 2 elements. Proceeding with the first one: <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group text-slate-600 hover:bg-slate-50 hover:text-slate-900">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    41 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "Open Menu" [ref=e7]:
          - img [ref=e8]
        - generic [ref=e9]:
          - img "Sarathi Book" [ref=e11]
          - heading "SarathiBook" [level=1] [ref=e13]
        - button "Notifications" [ref=e16]:
          - img [ref=e17]
    - main [ref=e20]:
      - generic [ref=e22]:
        - generic [ref=e23] [cursor=pointer]:
          - paragraph [ref=e25]: Complete your profile to generate bills
          - generic [ref=e26]: 0% →
        - generic [ref=e30]:
          - heading "Create Invoice" [level=2] [ref=e31]: Create Invoice
          - generic [ref=e33]:
            - button "One Way Point to Point Drop" [ref=e34]:
              - img [ref=e36]
              - generic [ref=e38]:
                - heading "One Way" [level=3] [ref=e39]
                - paragraph [ref=e40]: Point to Point Drop
              - img [ref=e42]
            - button "Local Hourly Rental Package" [ref=e44]:
              - img [ref=e46]
              - generic [ref=e49]:
                - heading "Local" [level=3] [ref=e50]
                - paragraph [ref=e51]: Hourly Rental Package
              - img [ref=e53]
            - button "Outstation Round Trip Journey" [ref=e55]:
              - img [ref=e57]
              - generic [ref=e62]:
                - heading "Outstation" [level=3] [ref=e63]
                - paragraph [ref=e64]: Round Trip Journey
              - img [ref=e66]
            - button "Custom Bill Add your own charges" [ref=e68]:
              - img [ref=e70]
              - generic [ref=e72]:
                - heading "Custom Bill" [level=3] [ref=e73]
                - paragraph [ref=e74]: Add your own charges
              - img [ref=e76]
          - button "View Invoice History" [ref=e78]
    - generic [ref=e80]:
      - button "BILL" [ref=e82]:
        - img [ref=e84]
        - generic [ref=e87]: BILL
      - generic [ref=e88]:
        - button "Fare Calculator" [ref=e89]:
          - img [ref=e90]
        - generic [ref=e92]: FARE
      - button "EARNINGS" [ref=e94]:
        - img [ref=e96]
        - generic [ref=e99]: EARNINGS
  - generic [ref=e102]:
    - generic [ref=e103]:
      - generic [ref=e104]:
        - img [ref=e106]
        - heading "Pro Features" [level=3] [ref=e109]
      - button [ref=e110]:
        - img [ref=e111]
    - generic [ref=e114]:
      - paragraph [ref=e115]:
        - text: Generate professional
        - strong [ref=e116]: GST Invoices
        - text: ","
        - strong [ref=e117]: Quotations
        - text: "&"
        - strong [ref=e118]: Pay Slips
        - text: . Track
        - strong [ref=e119]: Driver Attendance
        - text: with
        - strong [ref=e120]: Fare Calculator
        - text: .
      - generic [ref=e121]:
        - generic [ref=e124]: Calculator
        - generic [ref=e127]: Invoice
        - generic [ref=e130]: Quote
        - generic [ref=e133]: Attendance
        - generic [ref=e136]: Salary
    - button "Continue with Google" [ref=e137]:
      - img [ref=e138]
      - generic [ref=e143]: Continue with Google
    - button "Continue as Guest" [ref=e144]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Sarathi Book 360 Audit', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/');
  7  |     // Handle Guest Nudge if it appears
  8  |     const guestBtn = page.getByRole('button', { name: /Continue as Guest/i });
  9  |     if (await guestBtn.isVisible()) {
  10 |       await guestBtn.click();
  11 |     }
  12 |   });
  13 | 
  14 |   test('Phase 1: Deep Fare Calculation Audit', async ({ page }) => {
  15 |     // Navigate to Calculator
  16 |     await page.click('button:has-text("FARE")');
  17 |     
  18 |     // Select Outstation
  19 |     await page.click('button:has-text("Round Trip")');
  20 |     
  21 |     // Enter Distance
  22 |     const distInput = page.locator('input[type="number"]').first();
  23 |     await distInput.fill('500');
  24 |     
  25 |     // Select Vehicle (e.g., SUV)
  26 |     await page.click('text=SUV');
  27 |     
  28 |     // Toggle Hill Station (Manual override)
  29 |     // Looking for the 'Add Extras' or 'Hill Station' text
  30 |     await page.click('text=Add Extras');
  31 |     const hillStationInput = page.locator('input[placeholder*="Hill Station"]');
  32 |     if (await hillStationInput.isVisible()) {
  33 |         await hillStationInput.fill('500');
  34 |     }
  35 | 
  36 |     // Verify Calculation Result (Total should be > 500 * rate)
  37 |     const totalAmount = page.locator('.text-3xl.font-black'); // Custom selector based on Calculator UI
  38 |     await expect(totalAmount).toContainText(/₹/);
  39 |     const amountText = await totalAmount.innerText();
  40 |     const amount = parseInt(amountText.replace(/[^0-9]/g, ''));
  41 |     expect(amount).toBeGreaterThan(5000); // Basic sanity check (500km * ~12/km + bata)
  42 |   });
  43 | 
  44 |   test('Phase 2: Invoice Generation Audit', async ({ page }) => {
  45 |     // Navigate to Invoices
> 46 |     await page.click('button:has-text("BILL")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  47 |     
  48 |     // Start One Way Trip
  49 |     await page.click('text=One Way');
  50 |     
  51 |     // Step 1: Locations
  52 |     await page.fill('input[placeholder*="Pickup"]', 'Chennai Airport');
  53 |     await page.fill('input[placeholder*="Drop"]', 'Pondicherry');
  54 |     await page.fill('input[placeholder*="Distance"]', '150');
  55 |     await page.click('button:has-text("Next")');
  56 |     
  57 |     // Step 2: Customer
  58 |     await page.fill('input[placeholder*="Customer Name"]', 'Audit Test User');
  59 |     await page.click('button:has-text("Next")');
  60 |     
  61 |     // Step 3: Verify Totals
  62 |     await expect(page.getByText(/Grand Total/i)).toBeVisible();
  63 |     
  64 |     // Preview PDF
  65 |     await page.click('button:has-text("Preview")');
  66 |     // Note: We can't easily audit the PDF content inside the canvas, but we verify the modal opens
  67 |     await expect(page.locator('canvas, iframe')).toBeVisible({ timeout: 15000 });
  68 |   });
  69 | 
  70 |   test('Phase 3: Operations & Staff Audit', async ({ page }) => {
  71 |     // Open SideNav
  72 |     await page.click('header button').first(); // Hamburger
  73 |     await page.click('text=Staff & Salary');
  74 |     
  75 |     // Check if Salary Manager loads
  76 |     await expect(page.getByText(/Driver Management/i)).toBeVisible();
  77 |     
  78 |     // Add a Driver (Mock)
  79 |     await page.click('button:has-text("Add Driver")');
  80 |     await page.fill('input[name="name"]', 'Audit Driver');
  81 |     await page.fill('input[name="phone"]', '9876543210');
  82 |     await page.click('button:has-text("Save")');
  83 |     
  84 |     // Verify driver is in list
  85 |     await expect(page.getByText('Audit Driver')).toBeVisible();
  86 |   });
  87 | 
  88 |   test('Phase 4: Global Brand & Tariff Audit', async ({ page }) => {
  89 |     // Check Tariff Page
  90 |     await page.goto('/tariff'); // Direct navigation for speed
  91 |     await expect(page.getByRole('heading', { name: /Tariff/i })).toBeVisible();
  92 |     
  93 |     // Verify specific rate is present
  94 |     await expect(page.getByText(/Hatchback/i)).toBeVisible();
  95 |     await expect(page.getByText(/₹[0-9]+/i)).toBeVisible();
  96 |   });
  97 | 
  98 | });
  99 | 
```