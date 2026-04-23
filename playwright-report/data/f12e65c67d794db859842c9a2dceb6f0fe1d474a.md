# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-audit.spec.ts >> Sarathi Book 360 Audit >> Phase 4: Global Brand & Tariff Audit
- Location: tests\e2e\comprehensive-audit.spec.ts:88:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Hatchback/i)
Expected: visible
Error: strict mode violation: getByText(/Hatchback/i) resolved to 8 elements:
    1) <div class="font-bold text-slate-800 text-base">Hatchback</div> aka getByText('Hatchback').first()
    2) <h3 class="font-bold text-sm text-slate-800">Hatchback</h3> aka getByText('Hatchback').nth(1)
    3) <div class="font-bold text-slate-800 capitalize">Hatchback</div> aka getByText('Hatchback').nth(2)
    4) <h3 class="font-bold text-slate-700 capitalize text-sm">Hatchback</h3> aka getByText('Hatchback').nth(3)
    5) <div class="font-bold text-slate-800 text-base">Hatchback</div> aka getByText('Hatchback').nth(4)
    6) <h3 class="font-bold text-sm text-slate-800">Hatchback</h3> aka getByRole('heading', { name: 'Hatchback' }).first()
    7) <div class="font-bold text-slate-800 capitalize">Hatchback</div> aka locator('.flex-1 > .min-h-screen > .max-w-5xl > .hidden.md\\:block.bg-white.rounded-2xl.shadow-lg.border.border-slate-200.overflow-hidden.mb-12 > .overflow-x-auto > .w-full.text-left > .divide-y > tr > td > .font-bold').first()
    8) <h3 class="font-bold text-slate-700 capitalize text-sm">Hatchback</h3> aka getByRole('heading', { name: 'Hatchback' }).nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Hatchback/i)

```

# Page snapshot

```yaml
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
    - generic [ref=e21]:
      - generic [ref=e23]:
        - heading "Your Tariff Card" [level=1] [ref=e24]
        - paragraph [ref=e25]: Set your own rates & bata. Share with customers instantly.
        - generic [ref=e28]: Tap any value below to edit
      - main [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]:
            - img [ref=e33]
            - generic [ref=e36]: Edit Any Rate or Bata
          - generic [ref=e37]:
            - img [ref=e39]
            - generic [ref=e42]: Saved to Your Device
          - generic [ref=e43]:
            - img [ref=e45]
            - generic [ref=e47]: Your Prices, Your Control
        - generic [ref=e48]:
          - img [ref=e50]
          - generic [ref=e53]:
            - heading "Set Your Own Rates" [level=3] [ref=e54]
            - paragraph [ref=e55]: Tap any rate or bata value below to enter your own price. Changes are saved to this device automatically.
        - generic [ref=e56]:
          - generic [ref=e58] [cursor=pointer]:
            - generic [ref=e59]:
              - img [ref=e61]
              - generic [ref=e65]:
                - heading "Hatchback" [level=3] [ref=e67]
                - paragraph [ref=e68]: ₹15/km (Drop) · tap to edit
            - img [ref=e71]
          - generic [ref=e74] [cursor=pointer]:
            - generic [ref=e75]:
              - img [ref=e77]
              - generic [ref=e81]:
                - heading "Sedan" [level=3] [ref=e83]
                - paragraph [ref=e84]: ₹16/km (Drop) · tap to edit
            - img [ref=e87]
          - generic [ref=e90] [cursor=pointer]:
            - generic [ref=e91]:
              - img [ref=e93]
              - generic [ref=e97]:
                - heading "SUV (7-Seater)" [level=3] [ref=e99]
                - paragraph [ref=e100]: ₹20/km (Drop) · tap to edit
            - img [ref=e103]
          - generic [ref=e106] [cursor=pointer]:
            - generic [ref=e107]:
              - img [ref=e109]
              - generic [ref=e113]:
                - heading "Premium SUV" [level=3] [ref=e115]
                - paragraph [ref=e116]: ₹25/km (Drop) · tap to edit
            - img [ref=e119]
          - generic [ref=e122] [cursor=pointer]:
            - generic [ref=e123]:
              - img [ref=e125]
              - generic [ref=e129]:
                - heading "Tata Ace (Loads)" [level=3] [ref=e131]
                - paragraph [ref=e132]: ₹18/km (Drop) · tap to edit
            - img [ref=e135]
          - generic [ref=e138] [cursor=pointer]:
            - generic [ref=e139]:
              - img [ref=e141]
              - generic [ref=e145]:
                - heading "Bada Dost (Loads)" [level=3] [ref=e147]
                - paragraph [ref=e148]: ₹20/km (Drop) · tap to edit
            - img [ref=e151]
          - generic [ref=e154] [cursor=pointer]:
            - generic [ref=e155]:
              - img [ref=e157]
              - generic [ref=e161]:
                - heading "Bolero Pickup (Loads)" [level=3] [ref=e163]
                - paragraph [ref=e164]: ₹22/km (Drop) · tap to edit
            - img [ref=e167]
          - generic [ref=e170] [cursor=pointer]:
            - generic [ref=e171]:
              - img [ref=e173]
              - generic [ref=e177]:
                - heading "Tempo Traveller" [level=3] [ref=e179]
                - paragraph [ref=e180]: ₹24/km (Drop) · tap to edit
            - img [ref=e183]
          - generic [ref=e186] [cursor=pointer]:
            - generic [ref=e187]:
              - img [ref=e189]
              - generic [ref=e193]:
                - heading "Mini Bus (18-Seater)" [level=3] [ref=e195]
                - paragraph [ref=e196]: ₹30/km (Drop) · tap to edit
            - img [ref=e199]
          - generic [ref=e202] [cursor=pointer]:
            - generic [ref=e203]:
              - img [ref=e205]
              - generic [ref=e209]:
                - heading "Large Bus (24-Seater)" [level=3] [ref=e211]
                - paragraph [ref=e212]: ₹55/km (Drop) · tap to edit
            - img [ref=e215]
        - generic [ref=e218]:
          - generic [ref=e219]:
            - heading "Local Packages" [level=2] [ref=e220]:
              - img [ref=e221]
              - text: Local Packages
            - paragraph [ref=e224]: Hourly rentals for city use
          - generic [ref=e225]:
            - generic [ref=e226]:
              - generic [ref=e227]:
                - heading "Hatchback" [level=3] [ref=e228]
                - generic [ref=e229]:
                  - generic [ref=e230]: "Extra: ₹"
                  - spinbutton [ref=e231]: "200"
                  - generic [ref=e232]: /hr
              - generic [ref=e233]:
                - generic [ref=e234]:
                  - paragraph [ref=e235]:
                    - text: 4 Hr
                    - img [ref=e236]
                  - generic [ref=e239]:
                    - generic [ref=e240]: ₹
                    - spinbutton [ref=e241]: "1100"
                - generic [ref=e242]:
                  - paragraph [ref=e243]:
                    - text: 8 Hr
                    - img [ref=e244]
                  - generic [ref=e247]:
                    - generic [ref=e248]: ₹
                    - spinbutton [ref=e249]: "2000"
                - generic [ref=e250]:
                  - paragraph [ref=e251]:
                    - text: 12 Hr
                    - img [ref=e252]
                  - generic [ref=e255]:
                    - generic [ref=e256]: ₹
                    - spinbutton [ref=e257]: "2800"
            - generic [ref=e258]:
              - generic [ref=e259]:
                - heading "Sedan" [level=3] [ref=e260]
                - generic [ref=e261]:
                  - generic [ref=e262]: "Extra: ₹"
                  - spinbutton [ref=e263]: "250"
                  - generic [ref=e264]: /hr
              - generic [ref=e265]:
                - generic [ref=e266]:
                  - paragraph [ref=e267]:
                    - text: 4 Hr
                    - img [ref=e268]
                  - generic [ref=e271]:
                    - generic [ref=e272]: ₹
                    - spinbutton [ref=e273]: "1350"
                - generic [ref=e274]:
                  - paragraph [ref=e275]:
                    - text: 8 Hr
                    - img [ref=e276]
                  - generic [ref=e279]:
                    - generic [ref=e280]: ₹
                    - spinbutton [ref=e281]: "2200"
                - generic [ref=e282]:
                  - paragraph [ref=e283]:
                    - text: 12 Hr
                    - img [ref=e284]
                  - generic [ref=e287]:
                    - generic [ref=e288]: ₹
                    - spinbutton [ref=e289]: "3050"
            - generic [ref=e290]:
              - generic [ref=e291]:
                - heading "SUV (Innova/Ertiga)" [level=3] [ref=e292]
                - generic [ref=e293]:
                  - generic [ref=e294]: "Extra: ₹"
                  - spinbutton [ref=e295]: "350"
                  - generic [ref=e296]: /hr
              - generic [ref=e297]:
                - generic [ref=e298]:
                  - paragraph [ref=e299]:
                    - text: 4 Hr
                    - img [ref=e300]
                  - generic [ref=e303]:
                    - generic [ref=e304]: ₹
                    - spinbutton [ref=e305]: "1900"
                - generic [ref=e306]:
                  - paragraph [ref=e307]:
                    - text: 8 Hr
                    - img [ref=e308]
                  - generic [ref=e311]:
                    - generic [ref=e312]: ₹
                    - spinbutton [ref=e313]: "3200"
                - generic [ref=e314]:
                  - paragraph [ref=e315]:
                    - text: 12 Hr
                    - img [ref=e316]
                  - generic [ref=e319]:
                    - generic [ref=e320]: ₹
                    - spinbutton [ref=e321]: "4200"
            - generic [ref=e322]:
              - generic [ref=e323]:
                - heading "Innova Crysta" [level=3] [ref=e324]
                - generic [ref=e325]:
                  - generic [ref=e326]: "Extra: ₹"
                  - spinbutton [ref=e327]: "450"
                  - generic [ref=e328]: /hr
              - generic [ref=e329]:
                - generic [ref=e330]:
                  - paragraph [ref=e331]:
                    - text: 4 Hr
                    - img [ref=e332]
                  - generic [ref=e335]:
                    - generic [ref=e336]: ₹
                    - spinbutton [ref=e337]: "2800"
                - generic [ref=e338]:
                  - paragraph [ref=e339]:
                    - text: 8 Hr
                    - img [ref=e340]
                  - generic [ref=e343]:
                    - generic [ref=e344]: ₹
                    - spinbutton [ref=e345]: "4500"
                - generic [ref=e346]:
                  - paragraph [ref=e347]:
                    - text: 12 Hr
                    - img [ref=e348]
                  - generic [ref=e351]:
                    - generic [ref=e352]: ₹
                    - spinbutton [ref=e353]: "6000"
            - generic [ref=e354]:
              - generic [ref=e355]:
                - heading "Tata Ace (Loading)" [level=3] [ref=e356]
                - generic [ref=e357]:
                  - generic [ref=e358]: "Extra: ₹"
                  - spinbutton [ref=e359]: "300"
                  - generic [ref=e360]: /hr
              - generic [ref=e361]:
                - generic [ref=e362]:
                  - paragraph [ref=e363]:
                    - text: 4 Hr
                    - img [ref=e364]
                  - generic [ref=e367]:
                    - generic [ref=e368]: ₹
                    - spinbutton [ref=e369]: "1500"
                - generic [ref=e370]:
                  - paragraph [ref=e371]:
                    - text: 8 Hr
                    - img [ref=e372]
                  - generic [ref=e375]:
                    - generic [ref=e376]: ₹
                    - spinbutton [ref=e377]: "2500"
                - generic [ref=e378]:
                  - paragraph [ref=e379]:
                    - text: 12 Hr
                    - img [ref=e380]
                  - generic [ref=e383]:
                    - generic [ref=e384]: ₹
                    - spinbutton [ref=e385]: "3500"
            - generic [ref=e386]:
              - generic [ref=e387]:
                - heading "Bada Dost (Loading)" [level=3] [ref=e388]
                - generic [ref=e389]:
                  - generic [ref=e390]: "Extra: ₹"
                  - spinbutton [ref=e391]: "350"
                  - generic [ref=e392]: /hr
              - generic [ref=e393]:
                - generic [ref=e394]:
                  - paragraph [ref=e395]:
                    - text: 4 Hr
                    - img [ref=e396]
                  - generic [ref=e399]:
                    - generic [ref=e400]: ₹
                    - spinbutton [ref=e401]: "1800"
                - generic [ref=e402]:
                  - paragraph [ref=e403]:
                    - text: 8 Hr
                    - img [ref=e404]
                  - generic [ref=e407]:
                    - generic [ref=e408]: ₹
                    - spinbutton [ref=e409]: "3000"
                - generic [ref=e410]:
                  - paragraph [ref=e411]:
                    - text: 12 Hr
                    - img [ref=e412]
                  - generic [ref=e415]:
                    - generic [ref=e416]: ₹
                    - spinbutton [ref=e417]: "4200"
            - generic [ref=e418]:
              - generic [ref=e419]:
                - heading "Bolero Pickup (Loading)" [level=3] [ref=e420]
                - generic [ref=e421]:
                  - generic [ref=e422]: "Extra: ₹"
                  - spinbutton [ref=e423]: "400"
                  - generic [ref=e424]: /hr
              - generic [ref=e425]:
                - generic [ref=e426]:
                  - paragraph [ref=e427]:
                    - text: 4 Hr
                    - img [ref=e428]
                  - generic [ref=e431]:
                    - generic [ref=e432]: ₹
                    - spinbutton [ref=e433]: "2000"
                - generic [ref=e434]:
                  - paragraph [ref=e435]:
                    - text: 8 Hr
                    - img [ref=e436]
                  - generic [ref=e439]:
                    - generic [ref=e440]: ₹
                    - spinbutton [ref=e441]: "3500"
                - generic [ref=e442]:
                  - paragraph [ref=e443]:
                    - text: 12 Hr
                    - img [ref=e444]
                  - generic [ref=e447]:
                    - generic [ref=e448]: ₹
                    - spinbutton [ref=e449]: "5000"
            - generic [ref=e450]:
              - generic [ref=e451]:
                - heading "Tempo Traveller (12s)" [level=3] [ref=e452]
                - generic [ref=e453]:
                  - generic [ref=e454]: "Extra: ₹"
                  - spinbutton [ref=e455]: "600"
                  - generic [ref=e456]: /hr
              - generic [ref=e457]:
                - generic [ref=e458]:
                  - paragraph [ref=e459]:
                    - text: 4 Hr
                    - img [ref=e460]
                  - generic [ref=e463]:
                    - generic [ref=e464]: ₹
                    - spinbutton [ref=e465]: "3500"
                - generic [ref=e466]:
                  - paragraph [ref=e467]:
                    - text: 8 Hr
                    - img [ref=e468]
                  - generic [ref=e471]:
                    - generic [ref=e472]: ₹
                    - spinbutton [ref=e473]: "5500"
                - generic [ref=e474]:
                  - paragraph [ref=e475]:
                    - text: 12 Hr
                    - img [ref=e476]
                  - generic [ref=e479]:
                    - generic [ref=e480]: ₹
                    - spinbutton [ref=e481]: "7000"
            - generic [ref=e482]:
              - generic [ref=e483]:
                - heading "Mini Bus (18s)" [level=3] [ref=e484]
                - generic [ref=e485]:
                  - generic [ref=e486]: "Extra: ₹"
                  - spinbutton [ref=e487]: "800"
                  - generic [ref=e488]: /hr
              - generic [ref=e489]:
                - generic [ref=e490]:
                  - paragraph [ref=e491]:
                    - text: 4 Hr
                    - img [ref=e492]
                  - generic [ref=e495]:
                    - generic [ref=e496]: ₹
                    - spinbutton [ref=e497]: "4500"
                - generic [ref=e498]:
                  - paragraph [ref=e499]:
                    - text: 8 Hr
                    - img [ref=e500]
                  - generic [ref=e503]:
                    - generic [ref=e504]: ₹
                    - spinbutton [ref=e505]: "7500"
                - generic [ref=e506]:
                  - paragraph [ref=e507]:
                    - text: 12 Hr
                    - img [ref=e508]
                  - generic [ref=e511]:
                    - generic [ref=e512]: ₹
                    - spinbutton [ref=e513]: "9500"
            - generic [ref=e514]:
              - generic [ref=e515]:
                - heading "Bus (24s+)" [level=3] [ref=e516]
                - generic [ref=e517]:
                  - generic [ref=e518]: "Extra: ₹"
                  - spinbutton [ref=e519]: "1200"
                  - generic [ref=e520]: /hr
              - generic [ref=e521]:
                - generic [ref=e522]:
                  - paragraph [ref=e523]:
                    - text: 4 Hr
                    - img [ref=e524]
                  - generic [ref=e527]:
                    - generic [ref=e528]: ₹
                    - spinbutton [ref=e529]: "6500"
                - generic [ref=e530]:
                  - paragraph [ref=e531]:
                    - text: 8 Hr
                    - img [ref=e532]
                  - generic [ref=e535]:
                    - generic [ref=e536]: ₹
                    - spinbutton [ref=e537]: "9500"
                - generic [ref=e538]:
                  - paragraph [ref=e539]:
                    - text: 12 Hr
                    - img [ref=e540]
                  - generic [ref=e543]:
                    - generic [ref=e544]: ₹
                    - spinbutton [ref=e545]: "12500"
        - generic [ref=e546]:
          - heading "Rental Policies & Limits" [level=2] [ref=e548]:
            - img [ref=e549]
            - text: Rental Policies & Limits
          - generic [ref=e552]:
            - generic [ref=e554]:
              - img [ref=e556]
              - generic [ref=e558]:
                - heading "Max Driving Limit" [level=3] [ref=e559]
                - paragraph [ref=e560]:
                  - text: For safety reasons, a single driver is limited to driving a maximum of
                  - generic [ref=e561]: 600 KM per day
                  - text: . For trips exceeding this limit, a second driver or identifying a layover is mandatory.
            - generic [ref=e563]:
              - img [ref=e565]
              - generic [ref=e567]:
                - heading "Night Charges" [level=3] [ref=e568]
                - paragraph [ref=e569]: Driver Night Allowance is applicable if the trip happens between 10:00 PM and 6:00 AM. This ensures our drivers are compensated for late-night shifts.
        - generic [ref=e570]:
          - generic [ref=e571]:
            - heading "Did you know?" [level=3] [ref=e572]
            - paragraph [ref=e573]: For one-way drop trips, you only pay for the distance travelled one way! Most other operators charge round-trip fare for one-way drops. Sarathi Book saves you up to 40%.
          - generic [ref=e574]:
            - heading "Zero Commission" [level=3] [ref=e575]
            - paragraph [ref=e576]: We don't take a cut from drivers. This ensures you get the lowest possible market rate and drivers earn their fair share. It's a win-win.
    - generic [ref=e578]:
      - generic [ref=e579]:
        - generic [ref=e580]:
          - generic [ref=e582]: SarathiBook
          - paragraph [ref=e583]: Fare calculator + GST invoice in 60 seconds. Built for cab drivers and owners across India.
        - generic [ref=e584]:
          - heading "Services" [level=4] [ref=e585]
          - list [ref=e586]:
            - listitem [ref=e587]:
              - button "Cab Fare Calculator" [ref=e588]
            - listitem [ref=e589]:
              - button "Tariff List" [ref=e590]
            - listitem [ref=e591]:
              - button "Routes Directory" [ref=e592]
            - listitem [ref=e593]:
              - button "Trending Routes" [ref=e594]
        - generic [ref=e595]:
          - heading "Company" [level=4] [ref=e596]
          - list [ref=e597]:
            - listitem [ref=e598]:
              - button "About Us" [ref=e599]
            - listitem [ref=e600]:
              - button "Contact Us" [ref=e601]
            - listitem [ref=e602]:
              - button "Privacy Policy" [ref=e603]
            - listitem [ref=e604]:
              - button "Terms of Service" [ref=e605]
        - generic [ref=e606]:
          - heading "Newsletter" [level=4] [ref=e607]
          - paragraph [ref=e608]: Get latest updates on cab rates and business tools.
          - generic [ref=e609]:
            - textbox "Email" [ref=e610]
            - button "Join" [ref=e611]
      - generic [ref=e612]:
        - paragraph [ref=e613]: © 2026 Sarathi Book. All rights reserved.
        - generic [ref=e614]:
          - button [ref=e615]:
            - img [ref=e616]
          - button [ref=e618]:
            - img [ref=e619]
  - generic [ref=e622]:
    - button "BILL" [ref=e624]:
      - img [ref=e626]
      - generic [ref=e629]: BILL
    - generic [ref=e630]:
      - button "Fare Calculator" [ref=e631]:
        - img [ref=e632]
      - generic [ref=e634]: FARE
    - button "EARNINGS" [ref=e636]:
      - img [ref=e638]
      - generic [ref=e641]: EARNINGS
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
> 94 |     await expect(page.getByText(/Hatchback/i)).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  95 |     await expect(page.getByText(/₹[0-9]+/i)).toBeVisible();
  96 |   });
  97 | 
  98 | });
  99 | 
```