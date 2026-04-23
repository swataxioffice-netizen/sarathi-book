# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-audit.spec.ts >> Sarathi Book 360 Audit >> Phase 3: Operations & Staff Audit
- Location: tests\e2e\comprehensive-audit.spec.ts:70:3

# Error details

```
TypeError: page.click(...).first is not a function
```

# Page snapshot

```yaml
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
          - generic [ref=e26]: Rate Lists
        - button "Staff & Salary Super" [ref=e27]:
          - img [ref=e28]
          - generic [ref=e33]: Staff & Salary
          - generic [ref=e34]: Super
        - button "App Settings" [ref=e35]:
          - img [ref=e36]
          - generic [ref=e39]: App Settings
      - generic [ref=e40]:
        - paragraph [ref=e41]: Branding
        - button "Visiting Card Pro" [ref=e42]:
          - img [ref=e43]
          - generic [ref=e47]: Visiting Card
          - generic [ref=e48]: Pro
        - button "Letterhead Pro" [ref=e49]:
          - img [ref=e50]
          - generic [ref=e53]: Letterhead
          - generic [ref=e54]: Pro
        - button "Remove Watermark Pro" [ref=e55]:
          - img [ref=e56]
          - generic [ref=e59]: Remove Watermark
          - generic [ref=e60]: Pro
        - button "Bill Theme Colour Pro" [ref=e61]:
          - img [ref=e62]
          - generic [ref=e68]: Bill Theme Colour
          - generic [ref=e69]: Pro
      - generic [ref=e70]:
        - paragraph [ref=e71]: Help
        - button "About Us" [ref=e72]:
          - img [ref=e73]
          - generic [ref=e76]: About Us
        - button "Contact Us" [ref=e77]:
          - img [ref=e78]
          - generic [ref=e82]: Contact Us
        - button "Privacy Policy" [ref=e83]:
          - img [ref=e84]
          - generic [ref=e87]: Privacy Policy
        - button "Terms" [ref=e88]:
          - img [ref=e89]
          - generic [ref=e92]: Terms
    - button "Share App" [ref=e94]:
      - img [ref=e95]
      - text: Share App
  - main [ref=e101]:
    - generic [ref=e102]:
      - heading "Invoices & Trips" [level=2] [ref=e103]
      - generic [ref=e104]:
        - generic [ref=e105]:
          - button "Notifications" [expanded] [active] [ref=e106]:
            - img [ref=e107]
          - generic [ref=e110]:
            - heading "Notifications" [level=3] [ref=e112]
            - generic [ref=e114]:
              - img [ref=e116]
              - paragraph [ref=e119]: No new notifications
              - paragraph [ref=e120]: We'll notify you when something important happens.
        - generic [ref=e121]:
          - paragraph [ref=e122]: Guest User
          - paragraph [ref=e123]: Driver Account
        - button "Sign In" [ref=e124] [cursor=pointer]:
          - img [ref=e125]
          - generic [ref=e130]: Sign In
    - generic [ref=e134]:
      - generic [ref=e135] [cursor=pointer]:
        - paragraph [ref=e137]: Complete your profile to generate bills
        - generic [ref=e138]: 0% →
      - generic [ref=e139]:
        - generic [ref=e142]:
          - heading "Create Invoice" [level=2] [ref=e143]: Create Invoice
          - generic [ref=e145]:
            - button "One Way Point to Point Drop" [ref=e146]:
              - img [ref=e148]
              - generic [ref=e150]:
                - heading "One Way" [level=3] [ref=e151]
                - paragraph [ref=e152]: Point to Point Drop
              - img [ref=e154]
            - button "Local Hourly Rental Package" [ref=e156]:
              - img [ref=e158]
              - generic [ref=e161]:
                - heading "Local" [level=3] [ref=e162]
                - paragraph [ref=e163]: Hourly Rental Package
              - img [ref=e165]
            - button "Outstation Round Trip Journey" [ref=e167]:
              - img [ref=e169]
              - generic [ref=e174]:
                - heading "Outstation" [level=3] [ref=e175]
                - paragraph [ref=e176]: Round Trip Journey
              - img [ref=e178]
            - button "Custom Bill Add your own charges" [ref=e180]:
              - img [ref=e182]
              - generic [ref=e184]:
                - heading "Custom Bill" [level=3] [ref=e185]
                - paragraph [ref=e186]: Add your own charges
              - img [ref=e188]
          - button "View Invoice History" [ref=e190]
        - generic [ref=e193]:
          - generic [ref=e194]:
            - generic [ref=e195]:
              - generic [ref=e197]:
                - button [ref=e198]:
                  - img [ref=e199]
                - generic [ref=e201]:
                  - img [ref=e202]
                  - generic [ref=e204]: April 2026
                - button [ref=e205]:
                  - img [ref=e206]
              - generic [ref=e208]:
                - button "GST Invoice" [ref=e209]
                - button "Non-GST Bill" [ref=e210]
            - generic [ref=e211]:
              - generic [ref=e212]:
                - paragraph [ref=e213]: Total Volume
                - heading "₹0" [level=2] [ref=e214]
              - generic [ref=e216]: 0 Invoices
          - generic [ref=e217]:
            - img [ref=e218]
            - paragraph [ref=e221]: No invoices found for Apr 2026
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
> 72 |     await page.click('header button').first(); // Hamburger
     |                                       ^ TypeError: page.click(...).first is not a function
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