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
    6) <h3 class="font-bold text-sm text-slate-800">Hatchback</h3> aka getByText('Hatchback').nth(5)
    7) <div class="font-bold text-slate-800 capitalize">Hatchback</div> aka locator('.flex-1 > .min-h-screen > .max-w-5xl > .hidden.md\\:block.bg-white.rounded-2xl.shadow-lg.border.border-slate-200.overflow-hidden.mb-12 > .overflow-x-auto > .w-full.text-left > .divide-y > tr > td > .font-bold').first()
    8) <h3 class="font-bold text-slate-700 capitalize text-sm">Hatchback</h3> aka locator('h3').filter({ hasText: 'Hatchback' }).nth(3)

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
          - generic [ref=e26]: Rate Lists
        - button "Staff & Salary Super" [ref=e28]:
          - img [ref=e29]
          - generic [ref=e34]: Staff & Salary
          - generic [ref=e35]: Super
        - button "App Settings" [ref=e36]:
          - img [ref=e37]
          - generic [ref=e40]: App Settings
      - generic [ref=e41]:
        - paragraph [ref=e42]: Branding
        - button "Visiting Card Pro" [ref=e43]:
          - img [ref=e44]
          - generic [ref=e48]: Visiting Card
          - generic [ref=e49]: Pro
        - button "Letterhead Pro" [ref=e50]:
          - img [ref=e51]
          - generic [ref=e54]: Letterhead
          - generic [ref=e55]: Pro
        - button "Remove Watermark Pro" [ref=e56]:
          - img [ref=e57]
          - generic [ref=e60]: Remove Watermark
          - generic [ref=e61]: Pro
        - button "Bill Theme Colour Pro" [ref=e62]:
          - img [ref=e63]
          - generic [ref=e69]: Bill Theme Colour
          - generic [ref=e70]: Pro
      - generic [ref=e71]:
        - paragraph [ref=e72]: Help
        - button "About Us" [ref=e73]:
          - img [ref=e74]
          - generic [ref=e77]: About Us
        - button "Contact Us" [ref=e78]:
          - img [ref=e79]
          - generic [ref=e83]: Contact Us
        - button "Privacy Policy" [ref=e84]:
          - img [ref=e85]
          - generic [ref=e88]: Privacy Policy
        - button "Terms" [ref=e89]:
          - img [ref=e90]
          - generic [ref=e93]: Terms
    - button "Share App" [ref=e95]:
      - img [ref=e96]
      - text: Share App
  - main [ref=e102]:
    - generic [ref=e103]:
      - heading "tariff" [level=2] [ref=e104]
      - generic [ref=e105]:
        - button "Notifications" [ref=e107]:
          - img [ref=e108]
        - generic [ref=e111]:
          - paragraph [ref=e112]: Guest User
          - paragraph [ref=e113]: Driver Account
        - button "Sign In" [ref=e114] [cursor=pointer]:
          - img [ref=e115]
          - generic [ref=e120]: Sign In
    - generic [ref=e121]:
      - generic [ref=e123]:
        - generic [ref=e125]:
          - heading "Your Tariff Card" [level=1] [ref=e126]
          - paragraph [ref=e127]: Set your own rates & bata. Share with customers instantly.
          - generic [ref=e130]: Tap any value below to edit
        - main [ref=e131]:
          - generic [ref=e132]:
            - generic [ref=e133]:
              - img [ref=e135]
              - generic [ref=e138]: Edit Any Rate or Bata
            - generic [ref=e139]:
              - img [ref=e141]
              - generic [ref=e144]: Saved to Your Device
            - generic [ref=e145]:
              - img [ref=e147]
              - generic [ref=e149]: Your Prices, Your Control
          - generic [ref=e150]:
            - img [ref=e152]
            - generic [ref=e155]:
              - heading "Set Your Own Rates" [level=3] [ref=e156]
              - paragraph [ref=e157]: Tap any rate or bata value below to enter your own price. Changes are saved to this device automatically.
          - generic [ref=e158]:
            - table [ref=e160]:
              - rowgroup [ref=e161]:
                - row "Vehicle Type One Way Drop Round Trip Driver Bata Min Km/Day" [ref=e162]:
                  - columnheader "Vehicle Type" [ref=e163]
                  - columnheader "One Way Drop" [ref=e164]:
                    - generic [ref=e165]:
                      - text: One Way Drop
                      - img [ref=e166]
                  - columnheader "Round Trip" [ref=e169]:
                    - generic [ref=e170]:
                      - text: Round Trip
                      - img [ref=e171]
                  - columnheader "Driver Bata" [ref=e174]:
                    - generic [ref=e175]:
                      - text: Driver Bata
                      - img [ref=e176]
                  - columnheader "Min Km/Day" [ref=e179]
              - rowgroup [ref=e180]:
                - row "Hatchback Swift, Ritz ₹ 15 per km ₹ 13 per km ₹ 300 per day 250 KM Calc" [ref=e181]:
                  - cell "Hatchback Swift, Ritz" [ref=e182]:
                    - generic [ref=e184]: Hatchback
                    - generic [ref=e185]: Swift, Ritz
                  - cell "₹ 15 per km" [ref=e186]:
                    - generic [ref=e187]:
                      - generic [ref=e188]: ₹
                      - spinbutton [ref=e189]: "15"
                    - generic [ref=e190]: per km
                  - cell "₹ 13 per km" [ref=e191]:
                    - generic [ref=e192]:
                      - generic [ref=e193]: ₹
                      - spinbutton [ref=e194]: "13"
                    - generic [ref=e195]: per km
                  - cell "₹ 300 per day" [ref=e196]:
                    - generic [ref=e197]:
                      - generic [ref=e198]: ₹
                      - spinbutton [ref=e199]: "300"
                    - generic [ref=e200]: per day
                  - cell "250 KM" [ref=e201]:
                    - generic [ref=e202]: 250 KM
                  - cell "Calc" [ref=e203]:
                    - link "Calc" [ref=e204]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e205]
                - row "Sedan Dzire, Etios, Aura ₹ 16 per km ₹ 14 per km ₹ 300 per day 250 KM Calc" [ref=e207]:
                  - cell "Sedan Dzire, Etios, Aura" [ref=e208]:
                    - generic [ref=e210]: Sedan
                    - generic [ref=e211]: Dzire, Etios, Aura
                  - cell "₹ 16 per km" [ref=e212]:
                    - generic [ref=e213]:
                      - generic [ref=e214]: ₹
                      - spinbutton [ref=e215]: "16"
                    - generic [ref=e216]: per km
                  - cell "₹ 14 per km" [ref=e217]:
                    - generic [ref=e218]:
                      - generic [ref=e219]: ₹
                      - spinbutton [ref=e220]: "14"
                    - generic [ref=e221]: per km
                  - cell "₹ 300 per day" [ref=e222]:
                    - generic [ref=e223]:
                      - generic [ref=e224]: ₹
                      - spinbutton [ref=e225]: "300"
                    - generic [ref=e226]: per day
                  - cell "250 KM" [ref=e227]:
                    - generic [ref=e228]: 250 KM
                  - cell "Calc" [ref=e229]:
                    - link "Calc" [ref=e230]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e231]
                - row "SUV (7-Seater) Ertiga, Marazzo ₹ 20 per km ₹ 18 per km ₹ 500 per day 250 KM Calc" [ref=e233]:
                  - cell "SUV (7-Seater) Ertiga, Marazzo" [ref=e234]:
                    - generic [ref=e236]: SUV (7-Seater)
                    - generic [ref=e237]: Ertiga, Marazzo
                  - cell "₹ 20 per km" [ref=e238]:
                    - generic [ref=e239]:
                      - generic [ref=e240]: ₹
                      - spinbutton [ref=e241]: "20"
                    - generic [ref=e242]: per km
                  - cell "₹ 18 per km" [ref=e243]:
                    - generic [ref=e244]:
                      - generic [ref=e245]: ₹
                      - spinbutton [ref=e246]: "18"
                    - generic [ref=e247]: per km
                  - cell "₹ 500 per day" [ref=e248]:
                    - generic [ref=e249]:
                      - generic [ref=e250]: ₹
                      - spinbutton [ref=e251]: "500"
                    - generic [ref=e252]: per day
                  - cell "250 KM" [ref=e253]:
                    - generic [ref=e254]: 250 KM
                  - cell "Calc" [ref=e255]:
                    - link "Calc" [ref=e256]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e257]
                - row "Premium SUV Innova Crysta ₹ 25 per km ₹ 22 per km ₹ 600 per day 300 KM Calc" [ref=e259]:
                  - cell "Premium SUV Innova Crysta" [ref=e260]:
                    - generic [ref=e262]: Premium SUV
                    - generic [ref=e263]: Innova Crysta
                  - cell "₹ 25 per km" [ref=e264]:
                    - generic [ref=e265]:
                      - generic [ref=e266]: ₹
                      - spinbutton [ref=e267]: "25"
                    - generic [ref=e268]: per km
                  - cell "₹ 22 per km" [ref=e269]:
                    - generic [ref=e270]:
                      - generic [ref=e271]: ₹
                      - spinbutton [ref=e272]: "22"
                    - generic [ref=e273]: per km
                  - cell "₹ 600 per day" [ref=e274]:
                    - generic [ref=e275]:
                      - generic [ref=e276]: ₹
                      - spinbutton [ref=e277]: "600"
                    - generic [ref=e278]: per day
                  - cell "300 KM" [ref=e279]:
                    - generic [ref=e280]: 300 KM
                  - cell "Calc" [ref=e281]:
                    - link "Calc" [ref=e282]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e283]
                - row "Tata Ace (Loads) Tata Ace, Super Ace ₹ 18 per km ₹ 15 per km ₹ 400 per day 250 KM Calc" [ref=e285]:
                  - cell "Tata Ace (Loads) Tata Ace, Super Ace" [ref=e286]:
                    - generic [ref=e288]: Tata Ace (Loads)
                    - generic [ref=e289]: Tata Ace, Super Ace
                  - cell "₹ 18 per km" [ref=e290]:
                    - generic [ref=e291]:
                      - generic [ref=e292]: ₹
                      - spinbutton [ref=e293]: "18"
                    - generic [ref=e294]: per km
                  - cell "₹ 15 per km" [ref=e295]:
                    - generic [ref=e296]:
                      - generic [ref=e297]: ₹
                      - spinbutton [ref=e298]: "15"
                    - generic [ref=e299]: per km
                  - cell "₹ 400 per day" [ref=e300]:
                    - generic [ref=e301]:
                      - generic [ref=e302]: ₹
                      - spinbutton [ref=e303]: "400"
                    - generic [ref=e304]: per day
                  - cell "250 KM" [ref=e305]:
                    - generic [ref=e306]: 250 KM
                  - cell "Calc" [ref=e307]:
                    - link "Calc" [ref=e308]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e309]
                - row "Bada Dost (Loads) AL Bada Dost, Ashok Leyland ₹ 20 per km ₹ 17 per km ₹ 500 per day 250 KM Calc" [ref=e311]:
                  - cell "Bada Dost (Loads) AL Bada Dost, Ashok Leyland" [ref=e312]:
                    - generic [ref=e314]: Bada Dost (Loads)
                    - generic [ref=e315]: AL Bada Dost, Ashok Leyland
                  - cell "₹ 20 per km" [ref=e316]:
                    - generic [ref=e317]:
                      - generic [ref=e318]: ₹
                      - spinbutton [ref=e319]: "20"
                    - generic [ref=e320]: per km
                  - cell "₹ 17 per km" [ref=e321]:
                    - generic [ref=e322]:
                      - generic [ref=e323]: ₹
                      - spinbutton [ref=e324]: "17"
                    - generic [ref=e325]: per km
                  - cell "₹ 500 per day" [ref=e326]:
                    - generic [ref=e327]:
                      - generic [ref=e328]: ₹
                      - spinbutton [ref=e329]: "500"
                    - generic [ref=e330]: per day
                  - cell "250 KM" [ref=e331]:
                    - generic [ref=e332]: 250 KM
                  - cell "Calc" [ref=e333]:
                    - link "Calc" [ref=e334]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e335]
                - row "Bolero Pickup (Loads) Bolero Pickup, Dost ₹ 22 per km ₹ 19 per km ₹ 600 per day 250 KM Calc" [ref=e337]:
                  - cell "Bolero Pickup (Loads) Bolero Pickup, Dost" [ref=e338]:
                    - generic [ref=e340]: Bolero Pickup (Loads)
                    - generic [ref=e341]: Bolero Pickup, Dost
                  - cell "₹ 22 per km" [ref=e342]:
                    - generic [ref=e343]:
                      - generic [ref=e344]: ₹
                      - spinbutton [ref=e345]: "22"
                    - generic [ref=e346]: per km
                  - cell "₹ 19 per km" [ref=e347]:
                    - generic [ref=e348]:
                      - generic [ref=e349]: ₹
                      - spinbutton [ref=e350]: "19"
                    - generic [ref=e351]: per km
                  - cell "₹ 600 per day" [ref=e352]:
                    - generic [ref=e353]:
                      - generic [ref=e354]: ₹
                      - spinbutton [ref=e355]: "600"
                    - generic [ref=e356]: per day
                  - cell "250 KM" [ref=e357]:
                    - generic [ref=e358]: 250 KM
                  - cell "Calc" [ref=e359]:
                    - link "Calc" [ref=e360]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e361]
                - row "Tempo Traveller 12-Seater TT ₹ 24 per km ₹ 24 per km ₹ 800 per day 250 KM Calc" [ref=e363]:
                  - cell "Tempo Traveller 12-Seater TT" [ref=e364]:
                    - generic [ref=e366]: Tempo Traveller
                    - generic [ref=e367]: 12-Seater TT
                  - cell "₹ 24 per km" [ref=e368]:
                    - generic [ref=e369]:
                      - generic [ref=e370]: ₹
                      - spinbutton [ref=e371]: "24"
                    - generic [ref=e372]: per km
                  - cell "₹ 24 per km" [ref=e373]:
                    - generic [ref=e374]:
                      - generic [ref=e375]: ₹
                      - spinbutton [ref=e376]: "24"
                    - generic [ref=e377]: per km
                  - cell "₹ 800 per day" [ref=e378]:
                    - generic [ref=e379]:
                      - generic [ref=e380]: ₹
                      - spinbutton [ref=e381]: "800"
                    - generic [ref=e382]: per day
                  - cell "250 KM" [ref=e383]:
                    - generic [ref=e384]: 250 KM
                  - cell "Calc" [ref=e385]:
                    - link "Calc" [ref=e386]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e387]
                - row "Mini Bus (18-Seater) Swaraj Mazda ₹ 30 per km ₹ 30 per km ₹ 1000 per day 250 KM Calc" [ref=e389]:
                  - cell "Mini Bus (18-Seater) Swaraj Mazda" [ref=e390]:
                    - generic [ref=e392]: Mini Bus (18-Seater)
                    - generic [ref=e393]: Swaraj Mazda
                  - cell "₹ 30 per km" [ref=e394]:
                    - generic [ref=e395]:
                      - generic [ref=e396]: ₹
                      - spinbutton [ref=e397]: "30"
                    - generic [ref=e398]: per km
                  - cell "₹ 30 per km" [ref=e399]:
                    - generic [ref=e400]:
                      - generic [ref=e401]: ₹
                      - spinbutton [ref=e402]: "30"
                    - generic [ref=e403]: per km
                  - cell "₹ 1000 per day" [ref=e404]:
                    - generic [ref=e405]:
                      - generic [ref=e406]: ₹
                      - spinbutton [ref=e407]: "1000"
                    - generic [ref=e408]: per day
                  - cell "250 KM" [ref=e409]:
                    - generic [ref=e410]: 250 KM
                  - cell "Calc" [ref=e411]:
                    - link "Calc" [ref=e412]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e413]
                - row "Large Bus (24-Seater) Ashok Leyland ₹ 55 per km ₹ 55 per km ₹ 1500 per day 300 KM Calc" [ref=e415]:
                  - cell "Large Bus (24-Seater) Ashok Leyland" [ref=e416]:
                    - generic [ref=e418]: Large Bus (24-Seater)
                    - generic [ref=e419]: Ashok Leyland
                  - cell "₹ 55 per km" [ref=e420]:
                    - generic [ref=e421]:
                      - generic [ref=e422]: ₹
                      - spinbutton [ref=e423]: "55"
                    - generic [ref=e424]: per km
                  - cell "₹ 55 per km" [ref=e425]:
                    - generic [ref=e426]:
                      - generic [ref=e427]: ₹
                      - spinbutton [ref=e428]: "55"
                    - generic [ref=e429]: per km
                  - cell "₹ 1500 per day" [ref=e430]:
                    - generic [ref=e431]:
                      - generic [ref=e432]: ₹
                      - spinbutton [ref=e433]: "1500"
                    - generic [ref=e434]: per day
                  - cell "300 KM" [ref=e435]:
                    - generic [ref=e436]: 300 KM
                  - cell "Calc" [ref=e437]:
                    - link "Calc" [ref=e438]:
                      - /url: /calculator/cab
                      - text: Calc
                      - img [ref=e439]
            - generic [ref=e442]: "* All fields are editable — set your own rates. Saved to this device."
          - generic [ref=e443]:
            - generic [ref=e444]:
              - heading "Local Hourly Rentals" [level=2] [ref=e445]:
                - img [ref=e446]
                - text: Local Hourly Rentals
              - paragraph [ref=e449]: Perfect for city usage, shopping, and business meetings.
            - table [ref=e451]:
              - rowgroup [ref=e452]:
                - row "Vehicle 4 Hr / 40 Km 8 Hr / 80 Km 12 Hr / 120 Km Extra Hr" [ref=e453]:
                  - columnheader "Vehicle" [ref=e454]
                  - columnheader "4 Hr / 40 Km" [ref=e455]:
                    - generic [ref=e456]:
                      - text: 4 Hr / 40 Km
                      - img [ref=e457]
                  - columnheader "8 Hr / 80 Km" [ref=e460]:
                    - generic [ref=e461]:
                      - text: 8 Hr / 80 Km
                      - img [ref=e462]
                  - columnheader "12 Hr / 120 Km" [ref=e465]:
                    - generic [ref=e466]:
                      - text: 12 Hr / 120 Km
                      - img [ref=e467]
                  - columnheader "Extra Hr" [ref=e470]:
                    - generic [ref=e471]:
                      - text: Extra Hr
                      - img [ref=e472]
              - rowgroup [ref=e475]:
                - row "Hatchback ₹ 1100 ₹ 2000 ₹ 2800 ₹ 200 /hr" [ref=e476]:
                  - cell "Hatchback" [ref=e477]:
                    - generic [ref=e478]: Hatchback
                  - cell "₹ 1100" [ref=e479]:
                    - generic [ref=e480]:
                      - generic [ref=e481]: ₹
                      - spinbutton [ref=e482]: "1100"
                  - cell "₹ 2000" [ref=e483]:
                    - generic [ref=e484]:
                      - generic [ref=e485]: ₹
                      - spinbutton [ref=e486]: "2000"
                  - cell "₹ 2800" [ref=e487]:
                    - generic [ref=e488]:
                      - generic [ref=e489]: ₹
                      - spinbutton [ref=e490]: "2800"
                  - cell "₹ 200 /hr" [ref=e491]:
                    - generic [ref=e492]:
                      - generic [ref=e493]: ₹
                      - spinbutton [ref=e494]: "200"
                    - generic [ref=e495]: /hr
                - row "Sedan ₹ 1350 ₹ 2200 ₹ 3050 ₹ 250 /hr" [ref=e496]:
                  - cell "Sedan" [ref=e497]:
                    - generic [ref=e498]: Sedan
                  - cell "₹ 1350" [ref=e499]:
                    - generic [ref=e500]:
                      - generic [ref=e501]: ₹
                      - spinbutton [ref=e502]: "1350"
                  - cell "₹ 2200" [ref=e503]:
                    - generic [ref=e504]:
                      - generic [ref=e505]: ₹
                      - spinbutton [ref=e506]: "2200"
                  - cell "₹ 3050" [ref=e507]:
                    - generic [ref=e508]:
                      - generic [ref=e509]: ₹
                      - spinbutton [ref=e510]: "3050"
                  - cell "₹ 250 /hr" [ref=e511]:
                    - generic [ref=e512]:
                      - generic [ref=e513]: ₹
                      - spinbutton [ref=e514]: "250"
                    - generic [ref=e515]: /hr
                - row "SUV (Innova/Ertiga) ₹ 1900 ₹ 3200 ₹ 4200 ₹ 350 /hr" [ref=e516]:
                  - cell "SUV (Innova/Ertiga)" [ref=e517]:
                    - generic [ref=e518]: SUV (Innova/Ertiga)
                  - cell "₹ 1900" [ref=e519]:
                    - generic [ref=e520]:
                      - generic [ref=e521]: ₹
                      - spinbutton [ref=e522]: "1900"
                  - cell "₹ 3200" [ref=e523]:
                    - generic [ref=e524]:
                      - generic [ref=e525]: ₹
                      - spinbutton [ref=e526]: "3200"
                  - cell "₹ 4200" [ref=e527]:
                    - generic [ref=e528]:
                      - generic [ref=e529]: ₹
                      - spinbutton [ref=e530]: "4200"
                  - cell "₹ 350 /hr" [ref=e531]:
                    - generic [ref=e532]:
                      - generic [ref=e533]: ₹
                      - spinbutton [ref=e534]: "350"
                    - generic [ref=e535]: /hr
                - row "Innova Crysta ₹ 2800 ₹ 4500 ₹ 6000 ₹ 450 /hr" [ref=e536]:
                  - cell "Innova Crysta" [ref=e537]:
                    - generic [ref=e538]: Innova Crysta
                  - cell "₹ 2800" [ref=e539]:
                    - generic [ref=e540]:
                      - generic [ref=e541]: ₹
                      - spinbutton [ref=e542]: "2800"
                  - cell "₹ 4500" [ref=e543]:
                    - generic [ref=e544]:
                      - generic [ref=e545]: ₹
                      - spinbutton [ref=e546]: "4500"
                  - cell "₹ 6000" [ref=e547]:
                    - generic [ref=e548]:
                      - generic [ref=e549]: ₹
                      - spinbutton [ref=e550]: "6000"
                  - cell "₹ 450 /hr" [ref=e551]:
                    - generic [ref=e552]:
                      - generic [ref=e553]: ₹
                      - spinbutton [ref=e554]: "450"
                    - generic [ref=e555]: /hr
                - row "Tata Ace (Loading) ₹ 1500 ₹ 2500 ₹ 3500 ₹ 300 /hr" [ref=e556]:
                  - cell "Tata Ace (Loading)" [ref=e557]:
                    - generic [ref=e558]: Tata Ace (Loading)
                  - cell "₹ 1500" [ref=e559]:
                    - generic [ref=e560]:
                      - generic [ref=e561]: ₹
                      - spinbutton [ref=e562]: "1500"
                  - cell "₹ 2500" [ref=e563]:
                    - generic [ref=e564]:
                      - generic [ref=e565]: ₹
                      - spinbutton [ref=e566]: "2500"
                  - cell "₹ 3500" [ref=e567]:
                    - generic [ref=e568]:
                      - generic [ref=e569]: ₹
                      - spinbutton [ref=e570]: "3500"
                  - cell "₹ 300 /hr" [ref=e571]:
                    - generic [ref=e572]:
                      - generic [ref=e573]: ₹
                      - spinbutton [ref=e574]: "300"
                    - generic [ref=e575]: /hr
                - row "Bada Dost (Loading) ₹ 1800 ₹ 3000 ₹ 4200 ₹ 350 /hr" [ref=e576]:
                  - cell "Bada Dost (Loading)" [ref=e577]:
                    - generic [ref=e578]: Bada Dost (Loading)
                  - cell "₹ 1800" [ref=e579]:
                    - generic [ref=e580]:
                      - generic [ref=e581]: ₹
                      - spinbutton [ref=e582]: "1800"
                  - cell "₹ 3000" [ref=e583]:
                    - generic [ref=e584]:
                      - generic [ref=e585]: ₹
                      - spinbutton [ref=e586]: "3000"
                  - cell "₹ 4200" [ref=e587]:
                    - generic [ref=e588]:
                      - generic [ref=e589]: ₹
                      - spinbutton [ref=e590]: "4200"
                  - cell "₹ 350 /hr" [ref=e591]:
                    - generic [ref=e592]:
                      - generic [ref=e593]: ₹
                      - spinbutton [ref=e594]: "350"
                    - generic [ref=e595]: /hr
                - row "Bolero Pickup (Loading) ₹ 2000 ₹ 3500 ₹ 5000 ₹ 400 /hr" [ref=e596]:
                  - cell "Bolero Pickup (Loading)" [ref=e597]:
                    - generic [ref=e598]: Bolero Pickup (Loading)
                  - cell "₹ 2000" [ref=e599]:
                    - generic [ref=e600]:
                      - generic [ref=e601]: ₹
                      - spinbutton [ref=e602]: "2000"
                  - cell "₹ 3500" [ref=e603]:
                    - generic [ref=e604]:
                      - generic [ref=e605]: ₹
                      - spinbutton [ref=e606]: "3500"
                  - cell "₹ 5000" [ref=e607]:
                    - generic [ref=e608]:
                      - generic [ref=e609]: ₹
                      - spinbutton [ref=e610]: "5000"
                  - cell "₹ 400 /hr" [ref=e611]:
                    - generic [ref=e612]:
                      - generic [ref=e613]: ₹
                      - spinbutton [ref=e614]: "400"
                    - generic [ref=e615]: /hr
                - row "Tempo Traveller (12s) ₹ 3500 ₹ 5500 ₹ 7000 ₹ 600 /hr" [ref=e616]:
                  - cell "Tempo Traveller (12s)" [ref=e617]:
                    - generic [ref=e618]: Tempo Traveller (12s)
                  - cell "₹ 3500" [ref=e619]:
                    - generic [ref=e620]:
                      - generic [ref=e621]: ₹
                      - spinbutton [ref=e622]: "3500"
                  - cell "₹ 5500" [ref=e623]:
                    - generic [ref=e624]:
                      - generic [ref=e625]: ₹
                      - spinbutton [ref=e626]: "5500"
                  - cell "₹ 7000" [ref=e627]:
                    - generic [ref=e628]:
                      - generic [ref=e629]: ₹
                      - spinbutton [ref=e630]: "7000"
                  - cell "₹ 600 /hr" [ref=e631]:
                    - generic [ref=e632]:
                      - generic [ref=e633]: ₹
                      - spinbutton [ref=e634]: "600"
                    - generic [ref=e635]: /hr
                - row "Mini Bus (18s) ₹ 4500 ₹ 7500 ₹ 9500 ₹ 800 /hr" [ref=e636]:
                  - cell "Mini Bus (18s)" [ref=e637]:
                    - generic [ref=e638]: Mini Bus (18s)
                  - cell "₹ 4500" [ref=e639]:
                    - generic [ref=e640]:
                      - generic [ref=e641]: ₹
                      - spinbutton [ref=e642]: "4500"
                  - cell "₹ 7500" [ref=e643]:
                    - generic [ref=e644]:
                      - generic [ref=e645]: ₹
                      - spinbutton [ref=e646]: "7500"
                  - cell "₹ 9500" [ref=e647]:
                    - generic [ref=e648]:
                      - generic [ref=e649]: ₹
                      - spinbutton [ref=e650]: "9500"
                  - cell "₹ 800 /hr" [ref=e651]:
                    - generic [ref=e652]:
                      - generic [ref=e653]: ₹
                      - spinbutton [ref=e654]: "800"
                    - generic [ref=e655]: /hr
                - row "Bus (24s+) ₹ 6500 ₹ 9500 ₹ 12500 ₹ 1200 /hr" [ref=e656]:
                  - cell "Bus (24s+)" [ref=e657]:
                    - generic [ref=e658]: Bus (24s+)
                  - cell "₹ 6500" [ref=e659]:
                    - generic [ref=e660]:
                      - generic [ref=e661]: ₹
                      - spinbutton [ref=e662]: "6500"
                  - cell "₹ 9500" [ref=e663]:
                    - generic [ref=e664]:
                      - generic [ref=e665]: ₹
                      - spinbutton [ref=e666]: "9500"
                  - cell "₹ 12500" [ref=e667]:
                    - generic [ref=e668]:
                      - generic [ref=e669]: ₹
                      - spinbutton [ref=e670]: "12500"
                  - cell "₹ 1200 /hr" [ref=e671]:
                    - generic [ref=e672]:
                      - generic [ref=e673]: ₹
                      - spinbutton [ref=e674]: "1200"
                    - generic [ref=e675]: /hr
          - generic [ref=e676]:
            - heading "Rental Policies & Limits" [level=2] [ref=e678]:
              - img [ref=e679]
              - text: Rental Policies & Limits
            - generic [ref=e682]:
              - generic [ref=e684]:
                - img [ref=e686]
                - generic [ref=e688]:
                  - heading "Max Driving Limit" [level=3] [ref=e689]
                  - paragraph [ref=e690]:
                    - text: For safety reasons, a single driver is limited to driving a maximum of
                    - generic [ref=e691]: 600 KM per day
                    - text: . For trips exceeding this limit, a second driver or identifying a layover is mandatory.
              - generic [ref=e693]:
                - img [ref=e695]
                - generic [ref=e697]:
                  - heading "Night Charges" [level=3] [ref=e698]
                  - paragraph [ref=e699]: Driver Night Allowance is applicable if the trip happens between 10:00 PM and 6:00 AM. This ensures our drivers are compensated for late-night shifts.
          - generic [ref=e700]:
            - generic [ref=e701]:
              - heading "Did you know?" [level=3] [ref=e702]
              - paragraph [ref=e703]: For one-way drop trips, you only pay for the distance travelled one way! Most other operators charge round-trip fare for one-way drops. Sarathi Book saves you up to 40%.
            - generic [ref=e704]:
              - heading "Zero Commission" [level=3] [ref=e705]
              - paragraph [ref=e706]: We don't take a cut from drivers. This ensures you get the lowest possible market rate and drivers earn their fair share. It's a win-win.
      - generic [ref=e708]:
        - generic [ref=e709]:
          - generic [ref=e710]:
            - generic [ref=e712]: SarathiBook
            - paragraph [ref=e713]: Fare calculator + GST invoice in 60 seconds. Built for cab drivers and owners across India.
          - generic [ref=e714]:
            - heading "Services" [level=4] [ref=e715]
            - list [ref=e716]:
              - listitem [ref=e717]:
                - button "Cab Fare Calculator" [ref=e718]
              - listitem [ref=e719]:
                - button "Tariff List" [ref=e720]
              - listitem [ref=e721]:
                - button "Routes Directory" [ref=e722]
              - listitem [ref=e723]:
                - button "Trending Routes" [ref=e724]
          - generic [ref=e725]:
            - heading "Company" [level=4] [ref=e726]
            - list [ref=e727]:
              - listitem [ref=e728]:
                - button "About Us" [ref=e729]
              - listitem [ref=e730]:
                - button "Contact Us" [ref=e731]
              - listitem [ref=e732]:
                - button "Privacy Policy" [ref=e733]
              - listitem [ref=e734]:
                - button "Terms of Service" [ref=e735]
          - generic [ref=e736]:
            - heading "Newsletter" [level=4] [ref=e737]
            - paragraph [ref=e738]: Get latest updates on cab rates and business tools.
            - generic [ref=e739]:
              - textbox "Email" [ref=e740]
              - button "Join" [ref=e741]
        - generic [ref=e742]:
          - paragraph [ref=e743]: © 2026 Sarathi Book. All rights reserved.
          - generic [ref=e744]:
            - button [ref=e745]:
              - img [ref=e746]
            - button [ref=e748]:
              - img [ref=e749]
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