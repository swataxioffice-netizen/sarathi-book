# Roadmap to Pan-India "Google for Fares" Scale

This document outlines the technical and operational roadmap specifically to scale **Sarathi Book** from a local tool to a national standard.

## Phase 1: The "Intelligence" Upgrade (Implementation)
*Goal: Support the complex fare rules of every Indian state.*

### 1. Dynamic "Rate Card" Engine
Currently, your `fare.ts` has hardcoded "Chennai Association 2025" logic. This must be abstracted.
*   **What to build:** A `RateProfile` system.
*   **How it works:**
    *   **Profile:** "Mumbai Cool Cabs", "Kerala Taxi Union", "Bangalore Airport Taxi".
    *   **Rules:** JSON configuration for minimum KM, Driver Batta logic, Night Charge start/end times.
    *   **Selection:** When a user signs up, they select their **"Home Zone"** (e.g., Maharashtra > Mumbai). The app loads `mumbai_rates.json`.

### 2. Multi-Tier Vehicle Classification
"Hatchback" isn't enough.
*   **What to build:** Granular vehicle mapping.
*   **Examples:**
    *   *Micro:* Alto, Eon (Cheaper rates like Ola Micro)
    *   *Compact:* WagonR, Celerio
    *   *Prime Setup:* Dzire, Etios
    *   *Utility:* Tavera (Common in rural India) vs Innova Crysta (Premium)
*   **Why:** A Tavera in rural Bihar charges very differently from an Innova in South Bombay.

### 3. "Return Trip" Intelligence
The biggest confusing factor in Outstation.
*   **Logic:**
    *   *Rule 1 (South India):* Charge for return KM if outside city limits.
    *   *Rule 2 (Inter-State):* Charge for return KM up to the border or base.
    *   *Rule 3 (One Way Specialists):* Charge only one way (increasingly common).
*   **Feature:** A toggle in the calculator: "Return Empty?" which automatically adds the logic based on the selected **RateProfile**.

## Phase 2: The "Offline Map" Problem (Maintenance)
*Goal: Zero reliance on paid APIs for 90% of searches.*

### 1. Cached City-to-City Matrix
Google Maps costs money per call.
*   **The Hack:** 90% of queries are common routes (e.g., Chennai <-> Bangalore, Mumbai <-> Pune).
*   **Solution:** Build a database of "Common Route Distances."
    *   When a user searches "Chennai" to "Bangalore", check your database first.
    *   If found (345 KM), use it. Cost: ₹0.
    *   If not found, call Google API -> Save result to database -> Next time it's free.

### 2. Offline Mode
Drivers often calculate bills in dead zones.
*   **Strategy:** Download the "RateProfile" and "Common Routes" to the user's phone (PWA LocalStorage).
*   **Result:** Calculator works instantly even in airplane mode.

## Phase 3: The "Crowd" Engine (Maintenance & Growth)
*Goal: Let the drivers maintain the data for you.*

### 1. "Report a Rate"
Like Waze for prices.
*   **Feature:** If a driver sees the "Kerala Min KM" is 125Km but the union changed it to 130Km yesterday, they click "Report Incorrect Rate."
*   **Admin Panel:** You verify and update the JSON. Push update to all Kerala users.

### 2. Community Toll Database
Permit and Toll prices change faster than any one person can track.
*   **Feature:** "Add Expense" -> "Toll at Vashi Check Naka: ₹45".
*   **Intelligence:** If 50 drivers enter ₹45 for Vashi Toll, the system learns "Vashi Toll = ₹45" and suggests it next time.

---

## Technical Architecture Changes Required

1.  **Database Migration:** Move `trips` to a scalable syncing backend (Supabase is fine for now, but optimize queries).
2.  **Rate API:** A new endpoint `GET /rates?zone=KA_BLR` which returns the specific logic for that zone.
3.  **Search Indexes:** Fast lookup for "City Name" to Lat/Long without pinging Google Places every keystroke.

## "What to Maintain" (Your Job)

1.  **The "Truth":** You are the editor-in-chief. Your main job is verifying that "Delhi NCR" rates are actually accurate. If the calculator is wrong, trust is lost.
2.  **Server Costs:** As you scale, optimize image storage (compress more) and map calls (cache more).
3.  **App Up-time:** Ensure the PWA loads in under 2 seconds on a ₹5,000 Android phone.
