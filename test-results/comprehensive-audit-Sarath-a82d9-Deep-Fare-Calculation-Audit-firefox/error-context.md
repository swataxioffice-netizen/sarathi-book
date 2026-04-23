# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-audit.spec.ts >> Sarathi Book 360 Audit >> Phase 1: Deep Fare Calculation Audit
- Location: tests\e2e\comprehensive-audit.spec.ts:14:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("FARE")')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - img "Sarathi Book" [ref=e7]
        - generic [ref=e8]:
          - heading "SarathiBook" [level=1] [ref=e9]
          - paragraph [ref=e10]: Free Edition
      - generic [ref=e11]:
        - button "Upgrade to Pro" [ref=e12]:
          - img [ref=e13]
          - text: Upgrade to Pro
        - generic [ref=e15]:
          - paragraph [ref=e16]: Account
          - button "My Profile" [ref=e17]:
            - img [ref=e18]
            - generic [ref=e21]: My Profile
          - button "Rate Lists" [ref=e22]:
            - img [ref=e23]
            - generic [ref=e28]: Rate Lists
          - button "Staff & Salary Super" [ref=e29]:
            - img [ref=e30]
            - generic [ref=e35]: Staff & Salary
            - generic [ref=e36]: Super
          - button "App Settings" [ref=e37]:
            - img [ref=e38]
            - generic [ref=e41]: App Settings
        - generic [ref=e42]:
          - paragraph [ref=e43]: Branding
          - button "Visiting Card Pro" [ref=e44]:
            - img [ref=e45]
            - generic [ref=e51]: Visiting Card
            - generic [ref=e52]: Pro
          - button "Letterhead Pro" [ref=e53]:
            - img [ref=e54]
            - generic [ref=e60]: Letterhead
            - generic [ref=e61]: Pro
          - button "Remove Watermark Pro" [ref=e62]:
            - img [ref=e63]
            - generic [ref=e66]: Remove Watermark
            - generic [ref=e67]: Pro
          - button "Bill Theme Colour Pro" [ref=e68]:
            - img [ref=e69]
            - generic [ref=e75]: Bill Theme Colour
            - generic [ref=e76]: Pro
        - generic [ref=e77]:
          - paragraph [ref=e78]: Help
          - button "About Us" [ref=e79]:
            - img [ref=e80]
            - generic [ref=e83]: About Us
          - button "Contact Us" [ref=e84]:
            - img [ref=e85]
            - generic [ref=e91]: Contact Us
          - button "Privacy Policy" [ref=e92]:
            - img [ref=e93]
            - generic [ref=e96]: Privacy Policy
          - button "Terms" [ref=e97]:
            - img [ref=e98]
            - generic [ref=e104]: Terms
      - button "Share App" [ref=e106]:
        - img [ref=e107]
        - text: Share App
    - main [ref=e113]:
      - generic [ref=e114]:
        - heading "Invoices & Trips" [level=2] [ref=e115]
        - generic [ref=e116]:
          - button "Notifications" [ref=e118]:
            - img [ref=e119]
          - generic [ref=e122]:
            - paragraph [ref=e123]: Guest User
            - paragraph [ref=e124]: Driver Account
          - button "Sign In" [ref=e125] [cursor=pointer]:
            - img [ref=e126]
            - generic [ref=e131]: Sign In
      - generic [ref=e135]:
        - generic [ref=e136] [cursor=pointer]:
          - paragraph [ref=e138]: Complete your profile to generate bills
          - generic [ref=e139]: 0% →
        - generic [ref=e140]:
          - generic [ref=e143]:
            - heading "Create Invoice" [level=2] [ref=e144]: Create Invoice
            - generic [ref=e146]:
              - button "One Way Point to Point Drop" [ref=e147]:
                - img [ref=e149]
                - generic [ref=e152]:
                  - heading "One Way" [level=3] [ref=e153]
                  - paragraph [ref=e154]: Point to Point Drop
                - img [ref=e156]
              - button "Local Hourly Rental Package" [ref=e159]:
                - img [ref=e161]
                - generic [ref=e164]:
                  - heading "Local" [level=3] [ref=e165]
                  - paragraph [ref=e166]: Hourly Rental Package
                - img [ref=e168]
              - button "Outstation Round Trip Journey" [ref=e171]:
                - img [ref=e173]
                - generic [ref=e178]:
                  - heading "Outstation" [level=3] [ref=e179]
                  - paragraph [ref=e180]: Round Trip Journey
                - img [ref=e182]
              - button "Custom Bill Add your own charges" [ref=e185]:
                - img [ref=e187]
                - generic [ref=e190]:
                  - heading "Custom Bill" [level=3] [ref=e191]
                  - paragraph [ref=e192]: Add your own charges
                - img [ref=e194]
            - button "View Invoice History" [ref=e197]
          - generic [ref=e200]:
            - generic [ref=e201]:
              - generic [ref=e202]:
                - generic [ref=e204]:
                  - button [ref=e205]:
                    - img [ref=e206]
                  - generic [ref=e208]:
                    - img [ref=e209]
                    - generic [ref=e214]: April 2026
                  - button [ref=e215]:
                    - img [ref=e216]
                - generic [ref=e218]:
                  - button "GST Invoice" [ref=e219]
                  - button "Non-GST Bill" [ref=e220]
              - generic [ref=e221]:
                - generic [ref=e222]:
                  - paragraph [ref=e223]: Total Volume
                  - heading "₹0" [level=2] [ref=e224]
                - generic [ref=e226]: 0 Invoices
            - generic [ref=e227]:
              - img [ref=e228]
              - paragraph [ref=e234]: No invoices found for Apr 2026
  - generic [ref=e237]:
    - generic [ref=e238]:
      - generic [ref=e239]:
        - img [ref=e241]
        - heading "Pro Features" [level=3] [ref=e244]
      - button [ref=e245]:
        - img [ref=e246]
    - generic [ref=e249]:
      - paragraph [ref=e250]:
        - text: Generate professional
        - strong [ref=e251]: GST Invoices
        - text: ","
        - strong [ref=e252]: Quotations
        - text: "&"
        - strong [ref=e253]: Pay Slips
        - text: . Track
        - strong [ref=e254]: Driver Attendance
        - text: with
        - strong [ref=e255]: Fare Calculator
        - text: .
      - generic [ref=e256]:
        - generic [ref=e259]: Calculator
        - generic [ref=e262]: Invoice
        - generic [ref=e265]: Quote
        - generic [ref=e268]: Attendance
        - generic [ref=e271]: Salary
    - button "Continue with Google" [ref=e272]:
      - img [ref=e273]
      - generic [ref=e278]: Continue with Google
    - button "Continue as Guest" [ref=e279]
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
> 16 |     await page.click('button:has-text("FARE")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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
  46 |     await page.click('button:has-text("BILL")');
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