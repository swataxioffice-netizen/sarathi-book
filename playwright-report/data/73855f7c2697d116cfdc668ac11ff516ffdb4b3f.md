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
  - waiting for locator('text=One Way')
    - locator resolved to 2 elements. Proceeding with the first one: <h3 class="text-[13px] font-black uppercase tracking-wider leading-tight text-slate-800">One Way</h3>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="text-center mb-6 md:mb-10">…</div> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="text-center mb-6 md:mb-10">…</div> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-slate-500 font-bold mb-4 md:mb-6 max-w-md mx-auto text-[11px] md:text-sm leading-relaxed">Pro is for active drivers. Fleet Pro is for owner…</p> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
  4 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="text-center mb-6 md:mb-10">…</div> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="text-center mb-6 md:mb-10">…</div> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-slate-500 font-bold mb-4 md:mb-6 max-w-md mx-auto text-[11px] md:text-sm leading-relaxed">Pro is for active drivers. Fleet Pro is for owner…</p> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-slate-500 font-bold mb-4 md:mb-6 max-w-md mx-auto text-[11px] md:text-sm leading-relaxed">Pro is for active drivers. Fleet Pro is for owner…</p> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="text-center mb-6 md:mb-10">…</div> from <div class="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-12 animate-fade-in">…</div> subtree intercepts pointer events
  5 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border border-white/10 w-full max-w-[320px] relative overflow-hidden animate-scale-up">…</div> from <div class="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border border-white/10 w-full max-w-[320px] relative overflow-hidden animate-scale-up">…</div> from <div class="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable

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
          - button "Notifications" [ref=e106]:
            - img [ref=e107]
          - generic [ref=e110]:
            - paragraph [ref=e111]: Guest User
            - paragraph [ref=e112]: Driver Account
          - button "Sign In" [ref=e113] [cursor=pointer]:
            - img [ref=e114]
            - generic [ref=e119]: Sign In
      - generic [ref=e123]:
        - generic [ref=e124] [cursor=pointer]:
          - paragraph [ref=e126]: Complete your profile to generate bills
          - generic [ref=e127]: 0% →
        - generic [ref=e128]:
          - generic [ref=e131]:
            - heading "Create Invoice" [level=2] [ref=e132]: Create Invoice
            - generic [ref=e134]:
              - button "One Way Point to Point Drop" [ref=e135]:
                - img [ref=e137]
                - generic [ref=e139]:
                  - heading "One Way" [level=3] [ref=e140]
                  - paragraph [ref=e141]: Point to Point Drop
                - img [ref=e143]
              - button "Local Hourly Rental Package" [ref=e145]:
                - img [ref=e147]
                - generic [ref=e150]:
                  - heading "Local" [level=3] [ref=e151]
                  - paragraph [ref=e152]: Hourly Rental Package
                - img [ref=e154]
              - button "Outstation Round Trip Journey" [ref=e156]:
                - img [ref=e158]
                - generic [ref=e163]:
                  - heading "Outstation" [level=3] [ref=e164]
                  - paragraph [ref=e165]: Round Trip Journey
                - img [ref=e167]
              - button "Custom Bill Add your own charges" [ref=e169]:
                - img [ref=e171]
                - generic [ref=e173]:
                  - heading "Custom Bill" [level=3] [ref=e174]
                  - paragraph [ref=e175]: Add your own charges
                - img [ref=e177]
            - button "View Invoice History" [ref=e179]
          - generic [ref=e182]:
            - generic [ref=e183]:
              - generic [ref=e184]:
                - generic [ref=e186]:
                  - button [ref=e187]:
                    - img [ref=e188]
                  - generic [ref=e190]:
                    - img [ref=e191]
                    - generic [ref=e193]: April 2026
                  - button [ref=e194]:
                    - img [ref=e195]
                - generic [ref=e197]:
                  - button "GST Invoice" [ref=e198]
                  - button "Non-GST Bill" [ref=e199]
              - generic [ref=e200]:
                - generic [ref=e201]:
                  - paragraph [ref=e202]: Total Volume
                  - heading "₹0" [level=2] [ref=e203]
                - generic [ref=e205]: 0 Invoices
            - generic [ref=e206]:
              - img [ref=e207]
              - paragraph [ref=e210]: No invoices found for Apr 2026
  - generic [ref=e212]:
    - button [ref=e213]:
      - img [ref=e214]
    - generic [ref=e218]:
      - generic [ref=e219]:
        - heading "Simple Pricing, Real Value" [level=2] [ref=e220]
        - paragraph [ref=e221]: Pro is for active drivers. Fleet Pro is for owners managing multiple vehicles and staff.
        - generic [ref=e222]:
          - button "Monthly" [ref=e223]
          - button "Yearly Save ~15%" [ref=e224]:
            - text: Yearly
            - generic [ref=e225]: Save ~15%
      - generic [ref=e226]:
        - generic [ref=e227]:
          - generic [ref=e228]:
            - img [ref=e230]
            - heading "Free Forever" [level=3] [ref=e232]
            - generic [ref=e233]:
              - generic [ref=e234]: ₹0
              - generic [ref=e235]: / mo
            - paragraph [ref=e236]: Try the calculator & basic invoicing
          - generic [ref=e237]:
            - generic [ref=e238]:
              - img [ref=e240]
              - generic [ref=e242]: 1 Vehicle
            - generic [ref=e243]:
              - img [ref=e245]
              - generic [ref=e247]: Watermark on PDFs
            - generic [ref=e248]:
              - img [ref=e250]
              - generic [ref=e252]: Ad-supported
            - generic [ref=e253]:
              - img [ref=e255]
              - generic [ref=e257]: 10 Invoices / Month
            - generic [ref=e258]:
              - img [ref=e260]
              - generic [ref=e262]: 50 Calculations / Month
          - button "Current Plan" [disabled] [ref=e263]
        - generic [ref=e264]:
          - generic [ref=e265]:
            - img [ref=e266]
            - text: Most Popular
          - generic [ref=e269]:
            - img [ref=e271]
            - heading "Pro" [level=3] [ref=e273]
            - generic [ref=e274]:
              - generic [ref=e275]: ₹49
              - generic [ref=e276]: / mo
            - paragraph [ref=e277]: For active drivers who share PDFs with customers
          - generic [ref=e278]:
            - generic [ref=e279]:
              - img [ref=e281]
              - generic [ref=e283]: No Watermark on PDFs
            - generic [ref=e284]:
              - img [ref=e286]
              - generic [ref=e288]: Custom Business Logo
            - generic [ref=e289]:
              - img [ref=e291]
              - generic [ref=e293]: No Ads
            - generic [ref=e294]:
              - img [ref=e296]
              - generic [ref=e298]: Unlimited Invoices & Quotations
            - generic [ref=e299]:
              - img [ref=e301]
              - generic [ref=e303]: Unlimited Calculations
            - generic [ref=e304]:
              - img [ref=e306]
              - generic [ref=e308]: Up to 4 Vehicles
            - generic [ref=e309]:
              - img [ref=e311]
              - generic [ref=e313]: Quick Notes
          - button "Upgrade to Pro" [ref=e314]
        - generic [ref=e315]:
          - generic [ref=e316]:
            - img [ref=e318]
            - heading "Fleet Pro" [level=3] [ref=e320]
            - generic [ref=e321]:
              - generic [ref=e322]: ₹149
              - generic [ref=e323]: / mo
            - paragraph [ref=e324]: For fleet owners managing drivers & vehicles
          - generic [ref=e325]:
            - generic [ref=e326]:
              - img [ref=e328]
              - generic [ref=e330]: Everything in Pro
            - generic [ref=e331]:
              - img [ref=e333]
              - generic [ref=e335]: Unlimited Vehicles
            - generic [ref=e336]:
              - img [ref=e338]
              - generic [ref=e340]: Staff & Salary Management
            - generic [ref=e341]:
              - img [ref=e343]
              - generic [ref=e345]: AI Assistant (Sarathi)
            - generic [ref=e346]:
              - img [ref=e348]
              - generic [ref=e350]: Finance & Loan Center
            - generic [ref=e351]:
              - img [ref=e353]
              - generic [ref=e355]: 24/7 Dedicated Support
          - button "Get Fleet Pro" [ref=e356]
      - generic [ref=e357]:
        - generic [ref=e358]:
          - heading "Deep Comparison" [level=3] [ref=e359]
          - paragraph [ref=e360]: See what each plan unlocks
        - table [ref=e362]:
          - rowgroup [ref=e363]:
            - row "Features Free Pro Super Pro" [ref=e364]:
              - columnheader "Features" [ref=e365]
              - columnheader "Free" [ref=e366]
              - columnheader "Pro" [ref=e367]
              - columnheader "Super Pro" [ref=e368]
          - rowgroup [ref=e369]:
            - row "Monthly Invoices 10 Unlimited Unlimited" [ref=e370]:
              - cell "Monthly Invoices" [ref=e371]
              - cell "10" [ref=e372]
              - cell "Unlimited" [ref=e373]
              - cell "Unlimited" [ref=e374]
            - row "Monthly Calculations 50 Unlimited Unlimited" [ref=e375]:
              - cell "Monthly Calculations" [ref=e376]
              - cell "50" [ref=e377]
              - cell "Unlimited" [ref=e378]
              - cell "Unlimited" [ref=e379]
            - row "Vehicles 1 Up to 4 Unlimited" [ref=e380]:
              - cell "Vehicles" [ref=e381]
              - cell "1" [ref=e382]
              - cell "Up to 4" [ref=e383]
              - cell "Unlimited" [ref=e384]
            - row "No Watermark on PDFs" [ref=e385]:
              - cell "No Watermark on PDFs" [ref=e386]
              - cell [ref=e387]:
                - img [ref=e388]
              - cell [ref=e389]:
                - img [ref=e390]
              - cell [ref=e392]:
                - img [ref=e393]
            - row "Custom Business Logo" [ref=e395]:
              - cell "Custom Business Logo" [ref=e396]
              - cell [ref=e397]:
                - img [ref=e398]
              - cell [ref=e399]:
                - img [ref=e400]
              - cell [ref=e402]:
                - img [ref=e403]
            - row "No Ads" [ref=e405]:
              - cell "No Ads" [ref=e406]
              - cell [ref=e407]:
                - img [ref=e408]
              - cell [ref=e409]:
                - img [ref=e410]
              - cell [ref=e412]:
                - img [ref=e413]
            - row "Quick Notes" [ref=e415]:
              - cell "Quick Notes" [ref=e416]
              - cell [ref=e417]:
                - img [ref=e418]
              - cell [ref=e419]:
                - img [ref=e420]
              - cell [ref=e422]:
                - img [ref=e423]
            - row "Staff & Salary Management" [ref=e425]:
              - cell "Staff & Salary Management" [ref=e426]
              - cell [ref=e427]:
                - img [ref=e428]
              - cell [ref=e429]:
                - img [ref=e430]
              - cell [ref=e431]:
                - img [ref=e432]
            - row "AI Assistant (Sarathi)" [ref=e434]:
              - cell "AI Assistant (Sarathi)" [ref=e435]
              - cell [ref=e436]:
                - img [ref=e437]
              - cell [ref=e438]:
                - img [ref=e439]
              - cell [ref=e440]:
                - img [ref=e441]
            - row "Finance & Loan Center" [ref=e443]:
              - cell "Finance & Loan Center" [ref=e444]
              - cell [ref=e445]:
                - img [ref=e446]
              - cell [ref=e447]:
                - img [ref=e448]
              - cell [ref=e449]:
                - img [ref=e450]
            - row "Support Community Priority 24/7 Dedicated" [ref=e452]:
              - cell "Support" [ref=e453]
              - cell "Community" [ref=e454]
              - cell "Priority" [ref=e455]
              - cell "24/7 Dedicated" [ref=e456]
    - generic [ref=e458]:
      - generic [ref=e459]:
        - img [ref=e460]
        - generic [ref=e463]: 100% Secure via Razorpay
      - generic [ref=e464]:
        - img [ref=e465]
        - generic [ref=e467]: Instant Activation
      - generic [ref=e468]:
        - img [ref=e469]
        - generic [ref=e471]: Cancel Anytime
  - generic [ref=e474]:
    - generic [ref=e475]:
      - generic [ref=e476]:
        - img [ref=e478]
        - heading "Pro Features" [level=3] [ref=e481]
      - button [ref=e482]:
        - img [ref=e483]
    - generic [ref=e486]:
      - paragraph [ref=e487]:
        - text: Generate professional
        - strong [ref=e488]: GST Invoices
        - text: ","
        - strong [ref=e489]: Quotations
        - text: "&"
        - strong [ref=e490]: Pay Slips
        - text: . Track
        - strong [ref=e491]: Driver Attendance
        - text: with
        - strong [ref=e492]: Fare Calculator
        - text: .
      - generic [ref=e493]:
        - generic [ref=e496]: Calculator
        - generic [ref=e499]: Invoice
        - generic [ref=e502]: Quote
        - generic [ref=e505]: Attendance
        - generic [ref=e508]: Salary
    - button "Continue with Google" [ref=e509]:
      - img [ref=e510]
      - generic [ref=e515]: Continue with Google
    - button "Continue as Guest" [ref=e516]
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
> 49 |     await page.click('text=One Way');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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