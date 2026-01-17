# Video Production Guide: Cab Fare Estimate & Sharing

## Objective
Create a video demonstrating the "Cab Fare Estimate" feature, specifically simulating a trip from **Pallavaram** to **Madurai** using an **SUV**, adding additional charges, viewing the detailed price card, and sharing the quote via WhatsApp.

## Prerequisites
- Application running (`npm run dev` or production URL).
- Browser (Chrome/Edge recommended) with mobile view or desktop view (responsive design supports both, but "floating card" is a key mobile feature).

## Scenario Details
- **Pickup**: Pallavaram (Chennai)
- **Drop**: Madurai
- **Vehicle**: SUV (Innova/Ertiga)
- **Action**: Add Extra Charges -> View Details -> Share on WhatsApp

---

## Step-by-Step Walkthrough

### 1. Initial Setup
*   **Action**: Open the application and navigate to the **Cab Rental** Calculator (default view).
*   **Visual**: Clean interface with "Drop Trip", "Round Trip", "Local Package" options.

### 2. Enter Trip Details
*   **Action**:
    *   In the **Pickup** field, type: `Pallavaram`. Select the matching result from the dropdown.
    *   In the **Drop** field, type: `Madurai`. Select the matching result.
*   **Visual**:
    *   The map indicator may appear or the distance will auto-calculate (approx. 490-500 km).
    *   Notice the badge updating to "Drop Trip" or "Outstation".

### 3. Select Vehicle
*   **Action**:
    *   In the **Vehicle** dropdown, select **SUV (Innova/Ertiga)**.
*   **Visual**:
    *   The estimated fare at the bottom (floating card) will update instantly to reflect SUV rates (approx. ₹20/km for drop).

### 4. Add Additional Charges
*   **Action**:
    *   Click the **"Additional Charges"** bar (View: "Tap to add Tolls, Parking, Bata...").
    *   The "Additional Charges" drawer opens.
    *   **Demonstrate**:
        *   Enter **Toll Charges** (e.g., `500`).
        *   Enter **Driver Bata** or check automatic calculation if applicable.
        *   Close the drawer.
*   **Visual**:
    *   The total fare on the floating card updates to include these extras.

### 5. View Detail Price Card
*   **Action**:
    *   Click the **"View Detail"** button on the floating price card at the bottom.
*   **Visual**:
    *   The card expands upwards to show the full **Fare Breakdown**.
    *   **Highlight Details**:
        *   Base Fare (Distance × Rate).
        *   Driver Bata (if added).
        *   Toll Charges.
    *   **Action**: Toggle the **"Add GST (5%)"** checkbox to show tax calculation.

### 6. Share on WhatsApp
*   **Action**:
    *   Identify the **Green WhatsApp Button** in the bottom action grid of the expanded card.
    *   Click the button.
*   **Visual**:
    *   A new tab/window opens to `api.whatsapp.com`.
    *   **Show Message Preview**:
        *   Title: *Cab Fare* or *Estimated Fare*
        *   Body: Detailed breakdown of the trip.
        *   Footer: *Total Estimate: ₹[Amount]*

---

## Script / Voiceover Notes
> "Here is how to generate a quick estimate for an outstation trip using Sarathi Book.
> 
> First, we enter our route: **Pallavaram** to **Madurai**. The system automatically calculates the distance.
> 
> Next, we select our vehicle, an **SUV**, which updates the base rate.
> 
> To include expenses like Tolls, tap 'Additional Charges' and input the amount.
> 
> Finally, tap **'View Detail'** to see the complete breakdown. You can even add GST here for a formal quote.
> 
> To send this to a customer or driver, simply click the **WhatsApp** button. It pre-formats the entire quote instantly."
