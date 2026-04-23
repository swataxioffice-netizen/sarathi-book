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
  6 × retrying click action
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
  2 × retrying click action
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
          - button "Bill Theme Colour Pro" [active] [ref=e68]:
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
  - generic [ref=e236]:
    - button [ref=e237]:
      - img [ref=e238]
    - generic [ref=e242]:
      - generic [ref=e243]:
        - heading "Simple Pricing, Real Value" [level=2] [ref=e244]
        - paragraph [ref=e245]: Pro is for active drivers. Fleet Pro is for owners managing multiple vehicles and staff.
        - generic [ref=e246]:
          - button "Monthly" [ref=e247]
          - button "Yearly Save ~15%" [ref=e248]:
            - text: Yearly
            - generic [ref=e249]: Save ~15%
      - generic [ref=e250]:
        - generic [ref=e251]:
          - generic [ref=e252]:
            - img [ref=e254]
            - heading "Free Forever" [level=3] [ref=e256]
            - generic [ref=e257]:
              - generic [ref=e258]: ₹0
              - generic [ref=e259]: / mo
            - paragraph [ref=e260]: Try the calculator & basic invoicing
          - generic [ref=e261]:
            - generic [ref=e262]:
              - img [ref=e264]
              - generic [ref=e266]: 1 Vehicle
            - generic [ref=e267]:
              - img [ref=e269]
              - generic [ref=e271]: Watermark on PDFs
            - generic [ref=e272]:
              - img [ref=e274]
              - generic [ref=e276]: Ad-supported
            - generic [ref=e277]:
              - img [ref=e279]
              - generic [ref=e281]: 10 Invoices / Month
            - generic [ref=e282]:
              - img [ref=e284]
              - generic [ref=e286]: 50 Calculations / Month
          - button "Current Plan" [disabled] [ref=e287]
        - generic [ref=e288]:
          - generic [ref=e289]:
            - img [ref=e290]
            - text: Most Popular
          - generic [ref=e295]:
            - img [ref=e297]
            - heading "Pro" [level=3] [ref=e299]
            - generic [ref=e300]:
              - generic [ref=e301]: ₹49
              - generic [ref=e302]: / mo
            - paragraph [ref=e303]: For active drivers who share PDFs with customers
          - generic [ref=e304]:
            - generic [ref=e305]:
              - img [ref=e307]
              - generic [ref=e309]: No Watermark on PDFs
            - generic [ref=e310]:
              - img [ref=e312]
              - generic [ref=e314]: Custom Business Logo
            - generic [ref=e315]:
              - img [ref=e317]
              - generic [ref=e319]: No Ads
            - generic [ref=e320]:
              - img [ref=e322]
              - generic [ref=e324]: Unlimited Invoices & Quotations
            - generic [ref=e325]:
              - img [ref=e327]
              - generic [ref=e329]: Unlimited Calculations
            - generic [ref=e330]:
              - img [ref=e332]
              - generic [ref=e334]: Up to 4 Vehicles
            - generic [ref=e335]:
              - img [ref=e337]
              - generic [ref=e339]: Quick Notes
          - button "Upgrade to Pro" [ref=e340]
        - generic [ref=e341]:
          - generic [ref=e342]:
            - img [ref=e344]
            - heading "Fleet Pro" [level=3] [ref=e347]
            - generic [ref=e348]:
              - generic [ref=e349]: ₹149
              - generic [ref=e350]: / mo
            - paragraph [ref=e351]: For fleet owners managing drivers & vehicles
          - generic [ref=e352]:
            - generic [ref=e353]:
              - img [ref=e355]
              - generic [ref=e357]: Everything in Pro
            - generic [ref=e358]:
              - img [ref=e360]
              - generic [ref=e362]: Unlimited Vehicles
            - generic [ref=e363]:
              - img [ref=e365]
              - generic [ref=e367]: Staff & Salary Management
            - generic [ref=e368]:
              - img [ref=e370]
              - generic [ref=e372]: AI Assistant (Sarathi)
            - generic [ref=e373]:
              - img [ref=e375]
              - generic [ref=e377]: Finance & Loan Center
            - generic [ref=e378]:
              - img [ref=e380]
              - generic [ref=e382]: 24/7 Dedicated Support
          - button "Get Fleet Pro" [ref=e383]
      - generic [ref=e384]:
        - generic [ref=e385]:
          - heading "Deep Comparison" [level=3] [ref=e386]
          - paragraph [ref=e387]: See what each plan unlocks
        - table [ref=e389]:
          - rowgroup [ref=e390]:
            - row "Features Free Pro Super Pro" [ref=e391]:
              - columnheader "Features" [ref=e392]
              - columnheader "Free" [ref=e393]
              - columnheader "Pro" [ref=e394]
              - columnheader "Super Pro" [ref=e395]
          - rowgroup [ref=e396]:
            - row "Monthly Invoices 10 Unlimited Unlimited" [ref=e397]:
              - cell "Monthly Invoices" [ref=e398]
              - cell "10" [ref=e399]
              - cell "Unlimited" [ref=e400]
              - cell "Unlimited" [ref=e401]
            - row "Monthly Calculations 50 Unlimited Unlimited" [ref=e402]:
              - cell "Monthly Calculations" [ref=e403]
              - cell "50" [ref=e404]
              - cell "Unlimited" [ref=e405]
              - cell "Unlimited" [ref=e406]
            - row "Vehicles 1 Up to 4 Unlimited" [ref=e407]:
              - cell "Vehicles" [ref=e408]
              - cell "1" [ref=e409]
              - cell "Up to 4" [ref=e410]
              - cell "Unlimited" [ref=e411]
            - row "No Watermark on PDFs" [ref=e412]:
              - cell "No Watermark on PDFs" [ref=e413]
              - cell [ref=e414]:
                - img [ref=e415]
              - cell [ref=e417]:
                - img [ref=e418]
              - cell [ref=e420]:
                - img [ref=e421]
            - row "Custom Business Logo" [ref=e423]:
              - cell "Custom Business Logo" [ref=e424]
              - cell [ref=e425]:
                - img [ref=e426]
              - cell [ref=e428]:
                - img [ref=e429]
              - cell [ref=e431]:
                - img [ref=e432]
            - row "No Ads" [ref=e434]:
              - cell "No Ads" [ref=e435]
              - cell [ref=e436]:
                - img [ref=e437]
              - cell [ref=e439]:
                - img [ref=e440]
              - cell [ref=e442]:
                - img [ref=e443]
            - row "Quick Notes" [ref=e445]:
              - cell "Quick Notes" [ref=e446]
              - cell [ref=e447]:
                - img [ref=e448]
              - cell [ref=e450]:
                - img [ref=e451]
              - cell [ref=e453]:
                - img [ref=e454]
            - row "Staff & Salary Management" [ref=e456]:
              - cell "Staff & Salary Management" [ref=e457]
              - cell [ref=e458]:
                - img [ref=e459]
              - cell [ref=e461]:
                - img [ref=e462]
              - cell [ref=e464]:
                - img [ref=e465]
            - row "AI Assistant (Sarathi)" [ref=e467]:
              - cell "AI Assistant (Sarathi)" [ref=e468]
              - cell [ref=e469]:
                - img [ref=e470]
              - cell [ref=e472]:
                - img [ref=e473]
              - cell [ref=e475]:
                - img [ref=e476]
            - row "Finance & Loan Center" [ref=e478]:
              - cell "Finance & Loan Center" [ref=e479]
              - cell [ref=e480]:
                - img [ref=e481]
              - cell [ref=e483]:
                - img [ref=e484]
              - cell [ref=e486]:
                - img [ref=e487]
            - row "Support Community Priority 24/7 Dedicated" [ref=e489]:
              - cell "Support" [ref=e490]
              - cell "Community" [ref=e491]
              - cell "Priority" [ref=e492]
              - cell "24/7 Dedicated" [ref=e493]
    - generic [ref=e495]:
      - generic [ref=e496]:
        - img [ref=e497]
        - generic [ref=e500]: 100% Secure via Razorpay
      - generic [ref=e501]:
        - img [ref=e502]
        - generic [ref=e504]: Instant Activation
      - generic [ref=e505]:
        - img [ref=e506]
        - generic [ref=e508]: Cancel Anytime
  - generic [ref=e511]:
    - generic [ref=e512]:
      - generic [ref=e513]:
        - img [ref=e515]
        - heading "Pro Features" [level=3] [ref=e518]
      - button [ref=e519]:
        - img [ref=e520]
    - generic [ref=e523]:
      - paragraph [ref=e524]:
        - text: Generate professional
        - strong [ref=e525]: GST Invoices
        - text: ","
        - strong [ref=e526]: Quotations
        - text: "&"
        - strong [ref=e527]: Pay Slips
        - text: . Track
        - strong [ref=e528]: Driver Attendance
        - text: with
        - strong [ref=e529]: Fare Calculator
        - text: .
      - generic [ref=e530]:
        - generic [ref=e533]: Calculator
        - generic [ref=e536]: Invoice
        - generic [ref=e539]: Quote
        - generic [ref=e542]: Attendance
        - generic [ref=e545]: Salary
    - button "Continue with Google" [ref=e546]:
      - img [ref=e547]
      - generic [ref=e552]: Continue with Google
    - button "Continue as Guest" [ref=e553]
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