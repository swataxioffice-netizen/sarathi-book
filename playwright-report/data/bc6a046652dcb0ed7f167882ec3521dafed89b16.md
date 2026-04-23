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
    ...

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Hatchback/i)

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
          - generic [ref=e28]: Rate Lists
        - button "Staff & Salary Super" [ref=e30]:
          - img [ref=e31]
          - generic [ref=e36]: Staff & Salary
          - generic [ref=e37]: Super
        - button "App Settings" [ref=e38]:
          - img [ref=e39]
          - generic [ref=e42]: App Settings
      - generic [ref=e43]:
        - paragraph [ref=e44]: Branding
        - button "Visiting Card Pro" [ref=e45]:
          - img [ref=e46]
          - generic [ref=e52]: Visiting Card
          - generic [ref=e53]: Pro
        - button "Letterhead Pro" [ref=e54]:
          - img [ref=e55]
          - generic [ref=e61]: Letterhead
          - generic [ref=e62]: Pro
        - button "Remove Watermark Pro" [ref=e63]:
          - img [ref=e64]
          - generic [ref=e67]: Remove Watermark
          - generic [ref=e68]: Pro
        - button "Bill Theme Colour Pro" [ref=e69]:
          - img [ref=e70]
          - generic [ref=e76]: Bill Theme Colour
          - generic [ref=e77]: Pro
      - generic [ref=e78]:
        - paragraph [ref=e79]: Help
        - button "About Us" [ref=e80]:
          - img [ref=e81]
          - generic [ref=e84]: About Us
        - button "Contact Us" [ref=e85]:
          - img [ref=e86]
          - generic [ref=e92]: Contact Us
        - button "Privacy Policy" [ref=e93]:
          - img [ref=e94]
          - generic [ref=e97]: Privacy Policy
        - button "Terms" [ref=e98]:
          - img [ref=e99]
          - generic [ref=e105]: Terms
    - button "Share App" [ref=e107]:
      - img [ref=e108]
      - text: Share App
  - main [ref=e114]:
    - generic [ref=e115]:
      - heading "tariff" [level=2] [ref=e116]
      - generic [ref=e117]:
        - button "Notifications" [ref=e119]:
          - img [ref=e120]
        - generic [ref=e123]:
          - paragraph [ref=e124]: Guest User
          - paragraph [ref=e125]: Driver Account
        - button "Sign In" [ref=e126] [cursor=pointer]:
          - img [ref=e127]
          - generic [ref=e132]: Sign In
    - generic [ref=e133]:
      - generic [ref=e135]:
        - generic [ref=e137]:
          - heading "Your Tariff Card" [level=1] [ref=e138]
          - paragraph [ref=e139]: Set your own rates & bata. Share with customers instantly.
          - generic [ref=e142]: Tap any value below to edit
        - main [ref=e143]:
          - generic [ref=e144]:
            - generic [ref=e145]:
              - img [ref=e147]
              - generic [ref=e150]: Edit Any Rate or Bata
            - generic [ref=e151]:
              - img [ref=e153]
              - generic [ref=e158]: Saved to Your Device
            - generic [ref=e159]:
              - img [ref=e161]
              - generic [ref=e163]: Your Prices, Your Control
          - generic [ref=e164]:
            - img [ref=e166]
            - generic [ref=e169]:
              - heading "Set Your Own Rates" [level=3] [ref=e170]
              - paragraph [ref=e171]: Tap any rate or bata value below to enter your own price. Changes are saved to this device automatically.
          - generic [ref=e172]:
            - table [ref=e174]:
              - rowgroup [ref=e175]:
                - row "Vehicle Type One Way Drop Round Trip Driver Bata Min Km/Day" [ref=e176]:
                  - columnheader "Vehicle Type" [ref=e177]
                  - columnheader "One Way Drop" [ref=e178]:
                    - generic [ref=e179]:
                      - text: One Way Drop
                      - img [ref=e180]
                  - columnheader "Round Trip" [ref=e183]:
                    - generic [ref=e184]:
                      - text: Round Trip
                      - img [ref=e185]
                  - columnheader "Driver Bata" [ref=e188]:
                    - generic [ref=e189]:
                      - text: Driver Bata
                      - img [ref=e190]
                  - columnheader "Min Km/Day" [ref=e193]
              - rowgroup [ref=e194]:
                - row "Hatchback Swift, Ritz ₹ 15 per km ₹ 13 per km ₹ 300 per day 250 KM Calc" [ref=e195]:
                  - cell "Hatchback Swift, Ritz" [ref=e196]:
                    - generic [ref=e198]: Hatchback
                    - generic [ref=e199]: Swift, Ritz
                  - cell "₹ 15 per km" [ref=e200]:
                    - generic [ref=e201]:
                      - generic [ref=e202]: ₹
                      - spinbutton [ref=e203]: "15"
                    - generic [ref=e204]: per km
                  - cell "₹ 13 per km" [ref=e205]:
                    - generic [ref=e206]:
                      - generic [ref=e207]: ₹
                      - spinbutton [ref=e208]: "13"
                    - generic [ref=e209]: per km
                  - cell "₹ 300 per day" [ref=e210]:
                    - generic [ref=e211]:
                      - generic [ref=e212]: ₹
                      - spinbutton [ref=e213]: "300"
                    - generic [ref=e214]: per day
                  - cell "250 KM" [ref=e215]:
                    - generic [ref=e216]: 250 KM
                  - cell "Calc" [ref=e217]:
                    - link "Calc" [ref=e218] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e219]
                - row "Sedan Dzire, Etios, Aura ₹ 16 per km ₹ 14 per km ₹ 300 per day 250 KM Calc" [ref=e222]:
                  - cell "Sedan Dzire, Etios, Aura" [ref=e223]:
                    - generic [ref=e225]: Sedan
                    - generic [ref=e226]: Dzire, Etios, Aura
                  - cell "₹ 16 per km" [ref=e227]:
                    - generic [ref=e228]:
                      - generic [ref=e229]: ₹
                      - spinbutton [ref=e230]: "16"
                    - generic [ref=e231]: per km
                  - cell "₹ 14 per km" [ref=e232]:
                    - generic [ref=e233]:
                      - generic [ref=e234]: ₹
                      - spinbutton [ref=e235]: "14"
                    - generic [ref=e236]: per km
                  - cell "₹ 300 per day" [ref=e237]:
                    - generic [ref=e238]:
                      - generic [ref=e239]: ₹
                      - spinbutton [ref=e240]: "300"
                    - generic [ref=e241]: per day
                  - cell "250 KM" [ref=e242]:
                    - generic [ref=e243]: 250 KM
                  - cell "Calc" [ref=e244]:
                    - link "Calc" [ref=e245] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e246]
                - row "SUV (7-Seater) Ertiga, Marazzo ₹ 20 per km ₹ 18 per km ₹ 500 per day 250 KM Calc" [ref=e249]:
                  - cell "SUV (7-Seater) Ertiga, Marazzo" [ref=e250]:
                    - generic [ref=e252]: SUV (7-Seater)
                    - generic [ref=e253]: Ertiga, Marazzo
                  - cell "₹ 20 per km" [ref=e254]:
                    - generic [ref=e255]:
                      - generic [ref=e256]: ₹
                      - spinbutton [ref=e257]: "20"
                    - generic [ref=e258]: per km
                  - cell "₹ 18 per km" [ref=e259]:
                    - generic [ref=e260]:
                      - generic [ref=e261]: ₹
                      - spinbutton [ref=e262]: "18"
                    - generic [ref=e263]: per km
                  - cell "₹ 500 per day" [ref=e264]:
                    - generic [ref=e265]:
                      - generic [ref=e266]: ₹
                      - spinbutton [ref=e267]: "500"
                    - generic [ref=e268]: per day
                  - cell "250 KM" [ref=e269]:
                    - generic [ref=e270]: 250 KM
                  - cell "Calc" [ref=e271]:
                    - link "Calc" [ref=e272] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e273]
                - row "Premium SUV Innova Crysta ₹ 25 per km ₹ 22 per km ₹ 600 per day 300 KM Calc" [ref=e276]:
                  - cell "Premium SUV Innova Crysta" [ref=e277]:
                    - generic [ref=e279]: Premium SUV
                    - generic [ref=e280]: Innova Crysta
                  - cell "₹ 25 per km" [ref=e281]:
                    - generic [ref=e282]:
                      - generic [ref=e283]: ₹
                      - spinbutton [ref=e284]: "25"
                    - generic [ref=e285]: per km
                  - cell "₹ 22 per km" [ref=e286]:
                    - generic [ref=e287]:
                      - generic [ref=e288]: ₹
                      - spinbutton [ref=e289]: "22"
                    - generic [ref=e290]: per km
                  - cell "₹ 600 per day" [ref=e291]:
                    - generic [ref=e292]:
                      - generic [ref=e293]: ₹
                      - spinbutton [ref=e294]: "600"
                    - generic [ref=e295]: per day
                  - cell "300 KM" [ref=e296]:
                    - generic [ref=e297]: 300 KM
                  - cell "Calc" [ref=e298]:
                    - link "Calc" [ref=e299] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e300]
                - row "Tata Ace (Loads) Tata Ace, Super Ace ₹ 18 per km ₹ 15 per km ₹ 400 per day 250 KM Calc" [ref=e303]:
                  - cell "Tata Ace (Loads) Tata Ace, Super Ace" [ref=e304]:
                    - generic [ref=e306]: Tata Ace (Loads)
                    - generic [ref=e307]: Tata Ace, Super Ace
                  - cell "₹ 18 per km" [ref=e308]:
                    - generic [ref=e309]:
                      - generic [ref=e310]: ₹
                      - spinbutton [ref=e311]: "18"
                    - generic [ref=e312]: per km
                  - cell "₹ 15 per km" [ref=e313]:
                    - generic [ref=e314]:
                      - generic [ref=e315]: ₹
                      - spinbutton [ref=e316]: "15"
                    - generic [ref=e317]: per km
                  - cell "₹ 400 per day" [ref=e318]:
                    - generic [ref=e319]:
                      - generic [ref=e320]: ₹
                      - spinbutton [ref=e321]: "400"
                    - generic [ref=e322]: per day
                  - cell "250 KM" [ref=e323]:
                    - generic [ref=e324]: 250 KM
                  - cell "Calc" [ref=e325]:
                    - link "Calc" [ref=e326] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e327]
                - row "Bada Dost (Loads) AL Bada Dost, Ashok Leyland ₹ 20 per km ₹ 17 per km ₹ 500 per day 250 KM Calc" [ref=e330]:
                  - cell "Bada Dost (Loads) AL Bada Dost, Ashok Leyland" [ref=e331]:
                    - generic [ref=e333]: Bada Dost (Loads)
                    - generic [ref=e334]: AL Bada Dost, Ashok Leyland
                  - cell "₹ 20 per km" [ref=e335]:
                    - generic [ref=e336]:
                      - generic [ref=e337]: ₹
                      - spinbutton [ref=e338]: "20"
                    - generic [ref=e339]: per km
                  - cell "₹ 17 per km" [ref=e340]:
                    - generic [ref=e341]:
                      - generic [ref=e342]: ₹
                      - spinbutton [ref=e343]: "17"
                    - generic [ref=e344]: per km
                  - cell "₹ 500 per day" [ref=e345]:
                    - generic [ref=e346]:
                      - generic [ref=e347]: ₹
                      - spinbutton [ref=e348]: "500"
                    - generic [ref=e349]: per day
                  - cell "250 KM" [ref=e350]:
                    - generic [ref=e351]: 250 KM
                  - cell "Calc" [ref=e352]:
                    - link "Calc" [ref=e353] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e354]
                - row "Bolero Pickup (Loads) Bolero Pickup, Dost ₹ 22 per km ₹ 19 per km ₹ 600 per day 250 KM Calc" [ref=e357]:
                  - cell "Bolero Pickup (Loads) Bolero Pickup, Dost" [ref=e358]:
                    - generic [ref=e360]: Bolero Pickup (Loads)
                    - generic [ref=e361]: Bolero Pickup, Dost
                  - cell "₹ 22 per km" [ref=e362]:
                    - generic [ref=e363]:
                      - generic [ref=e364]: ₹
                      - spinbutton [ref=e365]: "22"
                    - generic [ref=e366]: per km
                  - cell "₹ 19 per km" [ref=e367]:
                    - generic [ref=e368]:
                      - generic [ref=e369]: ₹
                      - spinbutton [ref=e370]: "19"
                    - generic [ref=e371]: per km
                  - cell "₹ 600 per day" [ref=e372]:
                    - generic [ref=e373]:
                      - generic [ref=e374]: ₹
                      - spinbutton [ref=e375]: "600"
                    - generic [ref=e376]: per day
                  - cell "250 KM" [ref=e377]:
                    - generic [ref=e378]: 250 KM
                  - cell "Calc" [ref=e379]:
                    - link "Calc" [ref=e380] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e381]
                - row "Tempo Traveller 12-Seater TT ₹ 24 per km ₹ 24 per km ₹ 800 per day 250 KM Calc" [ref=e384]:
                  - cell "Tempo Traveller 12-Seater TT" [ref=e385]:
                    - generic [ref=e387]: Tempo Traveller
                    - generic [ref=e388]: 12-Seater TT
                  - cell "₹ 24 per km" [ref=e389]:
                    - generic [ref=e390]:
                      - generic [ref=e391]: ₹
                      - spinbutton [ref=e392]: "24"
                    - generic [ref=e393]: per km
                  - cell "₹ 24 per km" [ref=e394]:
                    - generic [ref=e395]:
                      - generic [ref=e396]: ₹
                      - spinbutton [ref=e397]: "24"
                    - generic [ref=e398]: per km
                  - cell "₹ 800 per day" [ref=e399]:
                    - generic [ref=e400]:
                      - generic [ref=e401]: ₹
                      - spinbutton [ref=e402]: "800"
                    - generic [ref=e403]: per day
                  - cell "250 KM" [ref=e404]:
                    - generic [ref=e405]: 250 KM
                  - cell "Calc" [ref=e406]:
                    - link "Calc" [ref=e407] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e408]
                - row "Mini Bus (18-Seater) Swaraj Mazda ₹ 30 per km ₹ 30 per km ₹ 1000 per day 250 KM Calc" [ref=e411]:
                  - cell "Mini Bus (18-Seater) Swaraj Mazda" [ref=e412]:
                    - generic [ref=e414]: Mini Bus (18-Seater)
                    - generic [ref=e415]: Swaraj Mazda
                  - cell "₹ 30 per km" [ref=e416]:
                    - generic [ref=e417]:
                      - generic [ref=e418]: ₹
                      - spinbutton [ref=e419]: "30"
                    - generic [ref=e420]: per km
                  - cell "₹ 30 per km" [ref=e421]:
                    - generic [ref=e422]:
                      - generic [ref=e423]: ₹
                      - spinbutton [ref=e424]: "30"
                    - generic [ref=e425]: per km
                  - cell "₹ 1000 per day" [ref=e426]:
                    - generic [ref=e427]:
                      - generic [ref=e428]: ₹
                      - spinbutton [ref=e429]: "1000"
                    - generic [ref=e430]: per day
                  - cell "250 KM" [ref=e431]:
                    - generic [ref=e432]: 250 KM
                  - cell "Calc" [ref=e433]:
                    - link "Calc" [ref=e434] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e435]
                - row "Large Bus (24-Seater) Ashok Leyland ₹ 55 per km ₹ 55 per km ₹ 1500 per day 300 KM Calc" [ref=e438]:
                  - cell "Large Bus (24-Seater) Ashok Leyland" [ref=e439]:
                    - generic [ref=e441]: Large Bus (24-Seater)
                    - generic [ref=e442]: Ashok Leyland
                  - cell "₹ 55 per km" [ref=e443]:
                    - generic [ref=e444]:
                      - generic [ref=e445]: ₹
                      - spinbutton [ref=e446]: "55"
                    - generic [ref=e447]: per km
                  - cell "₹ 55 per km" [ref=e448]:
                    - generic [ref=e449]:
                      - generic [ref=e450]: ₹
                      - spinbutton [ref=e451]: "55"
                    - generic [ref=e452]: per km
                  - cell "₹ 1500 per day" [ref=e453]:
                    - generic [ref=e454]:
                      - generic [ref=e455]: ₹
                      - spinbutton [ref=e456]: "1500"
                    - generic [ref=e457]: per day
                  - cell "300 KM" [ref=e458]:
                    - generic [ref=e459]: 300 KM
                  - cell "Calc" [ref=e460]:
                    - link "Calc" [ref=e461] [cursor=pointer]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e462]
            - generic [ref=e466]: "* All fields are editable — set your own rates. Saved to this device."
          - generic [ref=e467]:
            - generic [ref=e468]:
              - heading "Local Hourly Rentals" [level=2] [ref=e469]:
                - img [ref=e470]
                - text: Local Hourly Rentals
              - paragraph [ref=e473]: Perfect for city usage, shopping, and business meetings.
            - table [ref=e475]:
              - rowgroup [ref=e476]:
                - row "Vehicle 4 Hr / 40 Km 8 Hr / 80 Km 12 Hr / 120 Km Extra Hr" [ref=e477]:
                  - columnheader "Vehicle" [ref=e478]
                  - columnheader "4 Hr / 40 Km" [ref=e479]:
                    - generic [ref=e480]:
                      - text: 4 Hr / 40 Km
                      - img [ref=e481]
                  - columnheader "8 Hr / 80 Km" [ref=e484]:
                    - generic [ref=e485]:
                      - text: 8 Hr / 80 Km
                      - img [ref=e486]
                  - columnheader "12 Hr / 120 Km" [ref=e489]:
                    - generic [ref=e490]:
                      - text: 12 Hr / 120 Km
                      - img [ref=e491]
                  - columnheader "Extra Hr" [ref=e494]:
                    - generic [ref=e495]:
                      - text: Extra Hr
                      - img [ref=e496]
              - rowgroup [ref=e499]:
                - row "Hatchback ₹ 1100 ₹ 2000 ₹ 2800 ₹ 200 /hr" [ref=e500]:
                  - cell "Hatchback" [ref=e501]:
                    - generic [ref=e502]: Hatchback
                  - cell "₹ 1100" [ref=e503]:
                    - generic [ref=e504]:
                      - generic [ref=e505]: ₹
                      - spinbutton [ref=e506]: "1100"
                  - cell "₹ 2000" [ref=e507]:
                    - generic [ref=e508]:
                      - generic [ref=e509]: ₹
                      - spinbutton [ref=e510]: "2000"
                  - cell "₹ 2800" [ref=e511]:
                    - generic [ref=e512]:
                      - generic [ref=e513]: ₹
                      - spinbutton [ref=e514]: "2800"
                  - cell "₹ 200 /hr" [ref=e515]:
                    - generic [ref=e516]:
                      - generic [ref=e517]: ₹
                      - spinbutton [ref=e518]: "200"
                    - generic [ref=e519]: /hr
                - row "Sedan ₹ 1350 ₹ 2200 ₹ 3050 ₹ 250 /hr" [ref=e520]:
                  - cell "Sedan" [ref=e521]:
                    - generic [ref=e522]: Sedan
                  - cell "₹ 1350" [ref=e523]:
                    - generic [ref=e524]:
                      - generic [ref=e525]: ₹
                      - spinbutton [ref=e526]: "1350"
                  - cell "₹ 2200" [ref=e527]:
                    - generic [ref=e528]:
                      - generic [ref=e529]: ₹
                      - spinbutton [ref=e530]: "2200"
                  - cell "₹ 3050" [ref=e531]:
                    - generic [ref=e532]:
                      - generic [ref=e533]: ₹
                      - spinbutton [ref=e534]: "3050"
                  - cell "₹ 250 /hr" [ref=e535]:
                    - generic [ref=e536]:
                      - generic [ref=e537]: ₹
                      - spinbutton [ref=e538]: "250"
                    - generic [ref=e539]: /hr
                - row "SUV (Innova/Ertiga) ₹ 1900 ₹ 3200 ₹ 4200 ₹ 350 /hr" [ref=e540]:
                  - cell "SUV (Innova/Ertiga)" [ref=e541]:
                    - generic [ref=e542]: SUV (Innova/Ertiga)
                  - cell "₹ 1900" [ref=e543]:
                    - generic [ref=e544]:
                      - generic [ref=e545]: ₹
                      - spinbutton [ref=e546]: "1900"
                  - cell "₹ 3200" [ref=e547]:
                    - generic [ref=e548]:
                      - generic [ref=e549]: ₹
                      - spinbutton [ref=e550]: "3200"
                  - cell "₹ 4200" [ref=e551]:
                    - generic [ref=e552]:
                      - generic [ref=e553]: ₹
                      - spinbutton [ref=e554]: "4200"
                  - cell "₹ 350 /hr" [ref=e555]:
                    - generic [ref=e556]:
                      - generic [ref=e557]: ₹
                      - spinbutton [ref=e558]: "350"
                    - generic [ref=e559]: /hr
                - row "Innova Crysta ₹ 2800 ₹ 4500 ₹ 6000 ₹ 450 /hr" [ref=e560]:
                  - cell "Innova Crysta" [ref=e561]:
                    - generic [ref=e562]: Innova Crysta
                  - cell "₹ 2800" [ref=e563]:
                    - generic [ref=e564]:
                      - generic [ref=e565]: ₹
                      - spinbutton [ref=e566]: "2800"
                  - cell "₹ 4500" [ref=e567]:
                    - generic [ref=e568]:
                      - generic [ref=e569]: ₹
                      - spinbutton [ref=e570]: "4500"
                  - cell "₹ 6000" [ref=e571]:
                    - generic [ref=e572]:
                      - generic [ref=e573]: ₹
                      - spinbutton [ref=e574]: "6000"
                  - cell "₹ 450 /hr" [ref=e575]:
                    - generic [ref=e576]:
                      - generic [ref=e577]: ₹
                      - spinbutton [ref=e578]: "450"
                    - generic [ref=e579]: /hr
                - row "Tata Ace (Loading) ₹ 1500 ₹ 2500 ₹ 3500 ₹ 300 /hr" [ref=e580]:
                  - cell "Tata Ace (Loading)" [ref=e581]:
                    - generic [ref=e582]: Tata Ace (Loading)
                  - cell "₹ 1500" [ref=e583]:
                    - generic [ref=e584]:
                      - generic [ref=e585]: ₹
                      - spinbutton [ref=e586]: "1500"
                  - cell "₹ 2500" [ref=e587]:
                    - generic [ref=e588]:
                      - generic [ref=e589]: ₹
                      - spinbutton [ref=e590]: "2500"
                  - cell "₹ 3500" [ref=e591]:
                    - generic [ref=e592]:
                      - generic [ref=e593]: ₹
                      - spinbutton [ref=e594]: "3500"
                  - cell "₹ 300 /hr" [ref=e595]:
                    - generic [ref=e596]:
                      - generic [ref=e597]: ₹
                      - spinbutton [ref=e598]: "300"
                    - generic [ref=e599]: /hr
                - row "Bada Dost (Loading) ₹ 1800 ₹ 3000 ₹ 4200 ₹ 350 /hr" [ref=e600]:
                  - cell "Bada Dost (Loading)" [ref=e601]:
                    - generic [ref=e602]: Bada Dost (Loading)
                  - cell "₹ 1800" [ref=e603]:
                    - generic [ref=e604]:
                      - generic [ref=e605]: ₹
                      - spinbutton [ref=e606]: "1800"
                  - cell "₹ 3000" [ref=e607]:
                    - generic [ref=e608]:
                      - generic [ref=e609]: ₹
                      - spinbutton [ref=e610]: "3000"
                  - cell "₹ 4200" [ref=e611]:
                    - generic [ref=e612]:
                      - generic [ref=e613]: ₹
                      - spinbutton [ref=e614]: "4200"
                  - cell "₹ 350 /hr" [ref=e615]:
                    - generic [ref=e616]:
                      - generic [ref=e617]: ₹
                      - spinbutton [ref=e618]: "350"
                    - generic [ref=e619]: /hr
                - row "Bolero Pickup (Loading) ₹ 2000 ₹ 3500 ₹ 5000 ₹ 400 /hr" [ref=e620]:
                  - cell "Bolero Pickup (Loading)" [ref=e621]:
                    - generic [ref=e622]: Bolero Pickup (Loading)
                  - cell "₹ 2000" [ref=e623]:
                    - generic [ref=e624]:
                      - generic [ref=e625]: ₹
                      - spinbutton [ref=e626]: "2000"
                  - cell "₹ 3500" [ref=e627]:
                    - generic [ref=e628]:
                      - generic [ref=e629]: ₹
                      - spinbutton [ref=e630]: "3500"
                  - cell "₹ 5000" [ref=e631]:
                    - generic [ref=e632]:
                      - generic [ref=e633]: ₹
                      - spinbutton [ref=e634]: "5000"
                  - cell "₹ 400 /hr" [ref=e635]:
                    - generic [ref=e636]:
                      - generic [ref=e637]: ₹
                      - spinbutton [ref=e638]: "400"
                    - generic [ref=e639]: /hr
                - row "Tempo Traveller (12s) ₹ 3500 ₹ 5500 ₹ 7000 ₹ 600 /hr" [ref=e640]:
                  - cell "Tempo Traveller (12s)" [ref=e641]:
                    - generic [ref=e642]: Tempo Traveller (12s)
                  - cell "₹ 3500" [ref=e643]:
                    - generic [ref=e644]:
                      - generic [ref=e645]: ₹
                      - spinbutton [ref=e646]: "3500"
                  - cell "₹ 5500" [ref=e647]:
                    - generic [ref=e648]:
                      - generic [ref=e649]: ₹
                      - spinbutton [ref=e650]: "5500"
                  - cell "₹ 7000" [ref=e651]:
                    - generic [ref=e652]:
                      - generic [ref=e653]: ₹
                      - spinbutton [ref=e654]: "7000"
                  - cell "₹ 600 /hr" [ref=e655]:
                    - generic [ref=e656]:
                      - generic [ref=e657]: ₹
                      - spinbutton [ref=e658]: "600"
                    - generic [ref=e659]: /hr
                - row "Mini Bus (18s) ₹ 4500 ₹ 7500 ₹ 9500 ₹ 800 /hr" [ref=e660]:
                  - cell "Mini Bus (18s)" [ref=e661]:
                    - generic [ref=e662]: Mini Bus (18s)
                  - cell "₹ 4500" [ref=e663]:
                    - generic [ref=e664]:
                      - generic [ref=e665]: ₹
                      - spinbutton [ref=e666]: "4500"
                  - cell "₹ 7500" [ref=e667]:
                    - generic [ref=e668]:
                      - generic [ref=e669]: ₹
                      - spinbutton [ref=e670]: "7500"
                  - cell "₹ 9500" [ref=e671]:
                    - generic [ref=e672]:
                      - generic [ref=e673]: ₹
                      - spinbutton [ref=e674]: "9500"
                  - cell "₹ 800 /hr" [ref=e675]:
                    - generic [ref=e676]:
                      - generic [ref=e677]: ₹
                      - spinbutton [ref=e678]: "800"
                    - generic [ref=e679]: /hr
                - row "Bus (24s+) ₹ 6500 ₹ 9500 ₹ 12500 ₹ 1200 /hr" [ref=e680]:
                  - cell "Bus (24s+)" [ref=e681]:
                    - generic [ref=e682]: Bus (24s+)
                  - cell "₹ 6500" [ref=e683]:
                    - generic [ref=e684]:
                      - generic [ref=e685]: ₹
                      - spinbutton [ref=e686]: "6500"
                  - cell "₹ 9500" [ref=e687]:
                    - generic [ref=e688]:
                      - generic [ref=e689]: ₹
                      - spinbutton [ref=e690]: "9500"
                  - cell "₹ 12500" [ref=e691]:
                    - generic [ref=e692]:
                      - generic [ref=e693]: ₹
                      - spinbutton [ref=e694]: "12500"
                  - cell "₹ 1200 /hr" [ref=e695]:
                    - generic [ref=e696]:
                      - generic [ref=e697]: ₹
                      - spinbutton [ref=e698]: "1200"
                    - generic [ref=e699]: /hr
          - generic [ref=e700]:
            - heading "Rental Policies & Limits" [level=2] [ref=e702]:
              - img [ref=e703]
              - text: Rental Policies & Limits
            - generic [ref=e706]:
              - generic [ref=e708]:
                - img [ref=e710]
                - generic [ref=e714]:
                  - heading "Max Driving Limit" [level=3] [ref=e715]
                  - paragraph [ref=e716]:
                    - text: For safety reasons, a single driver is limited to driving a maximum of
                    - generic [ref=e717]: 600 KM per day
                    - text: . For trips exceeding this limit, a second driver or identifying a layover is mandatory.
              - generic [ref=e719]:
                - img [ref=e721]
                - generic [ref=e723]:
                  - heading "Night Charges" [level=3] [ref=e724]
                  - paragraph [ref=e725]: Driver Night Allowance is applicable if the trip happens between 10:00 PM and 6:00 AM. This ensures our drivers are compensated for late-night shifts.
          - generic [ref=e726]:
            - generic [ref=e727]:
              - heading "Did you know?" [level=3] [ref=e728]
              - paragraph [ref=e729]: For one-way drop trips, you only pay for the distance travelled one way! Most other operators charge round-trip fare for one-way drops. Sarathi Book saves you up to 40%.
            - generic [ref=e730]:
              - heading "Zero Commission" [level=3] [ref=e731]
              - paragraph [ref=e732]: We don't take a cut from drivers. This ensures you get the lowest possible market rate and drivers earn their fair share. It's a win-win.
      - generic [ref=e734]:
        - generic [ref=e735]:
          - generic [ref=e736]:
            - generic [ref=e738]: SarathiBook
            - paragraph [ref=e739]: Fare calculator + GST invoice in 60 seconds. Built for cab drivers and owners across India.
          - generic [ref=e740]:
            - heading "Services" [level=4] [ref=e741]
            - list [ref=e742]:
              - listitem [ref=e743]:
                - button "Cab Fare Calculator" [ref=e744]
              - listitem [ref=e745]:
                - button "Tariff List" [ref=e746]
              - listitem [ref=e747]:
                - button "Routes Directory" [ref=e748]
              - listitem [ref=e749]:
                - button "Trending Routes" [ref=e750]
          - generic [ref=e751]:
            - heading "Company" [level=4] [ref=e752]
            - list [ref=e753]:
              - listitem [ref=e754]:
                - button "About Us" [ref=e755]
              - listitem [ref=e756]:
                - button "Contact Us" [ref=e757]
              - listitem [ref=e758]:
                - button "Privacy Policy" [ref=e759]
              - listitem [ref=e760]:
                - button "Terms of Service" [ref=e761]
          - generic [ref=e762]:
            - heading "Newsletter" [level=4] [ref=e763]
            - paragraph [ref=e764]: Get latest updates on cab rates and business tools.
            - generic [ref=e765]:
              - textbox "Email" [ref=e766]
              - button "Join" [ref=e767]
        - generic [ref=e768]:
          - paragraph [ref=e769]: © 2026 Sarathi Book. All rights reserved.
          - generic [ref=e770]:
            - button [ref=e771]:
              - img [ref=e772]
            - button [ref=e774]:
              - img [ref=e775]
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