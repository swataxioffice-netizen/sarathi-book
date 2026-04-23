import { test, expect } from '@playwright/test';

test.describe('Sarathi Book 360 Audit', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle Guest Nudge if it appears
    const guestBtn = page.getByRole('button', { name: /Continue as Guest/i });
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
    }
  });

  test('Phase 1: Deep Fare Calculation Audit', async ({ page }) => {
    // Navigate to Calculator
    await page.click('button:has-text("FARE")');
    
    // Select Outstation
    await page.click('button:has-text("Round Trip")');
    
    // Enter Distance
    const distInput = page.locator('input[type="number"]').first();
    await distInput.fill('500');
    
    // Select Vehicle (e.g., SUV)
    await page.click('text=SUV');
    
    // Toggle Hill Station (Manual override)
    // Looking for the 'Add Extras' or 'Hill Station' text
    await page.click('text=Add Extras');
    const hillStationInput = page.locator('input[placeholder*="Hill Station"]');
    if (await hillStationInput.isVisible()) {
        await hillStationInput.fill('500');
    }

    // Verify Calculation Result (Total should be > 500 * rate)
    const totalAmount = page.locator('.text-3xl.font-black'); // Custom selector based on Calculator UI
    await expect(totalAmount).toContainText(/₹/);
    const amountText = await totalAmount.innerText();
    const amount = parseInt(amountText.replace(/[^0-9]/g, ''));
    expect(amount).toBeGreaterThan(5000); // Basic sanity check (500km * ~12/km + bata)
  });

  test('Phase 2: Invoice Generation Audit', async ({ page }) => {
    // Navigate to Invoices
    await page.click('button:has-text("BILL")');
    
    // Start One Way Trip
    await page.click('text=One Way');
    
    // Step 1: Locations
    await page.fill('input[placeholder*="Pickup"]', 'Chennai Airport');
    await page.fill('input[placeholder*="Drop"]', 'Pondicherry');
    await page.fill('input[placeholder*="Distance"]', '150');
    await page.click('button:has-text("Next")');
    
    // Step 2: Customer
    await page.fill('input[placeholder*="Customer Name"]', 'Audit Test User');
    await page.click('button:has-text("Next")');
    
    // Step 3: Verify Totals
    await expect(page.getByText(/Grand Total/i)).toBeVisible();
    
    // Preview PDF
    await page.click('button:has-text("Preview")');
    // Note: We can't easily audit the PDF content inside the canvas, but we verify the modal opens
    await expect(page.locator('canvas, iframe')).toBeVisible({ timeout: 15000 });
  });

  test('Phase 3: Operations & Staff Audit', async ({ page }) => {
    // Open SideNav
    await page.click('header button').first(); // Hamburger
    await page.click('text=Staff & Salary');
    
    // Check if Salary Manager loads
    await expect(page.getByText(/Driver Management/i)).toBeVisible();
    
    // Add a Driver (Mock)
    await page.click('button:has-text("Add Driver")');
    await page.fill('input[name="name"]', 'Audit Driver');
    await page.fill('input[name="phone"]', '9876543210');
    await page.click('button:has-text("Save")');
    
    // Verify driver is in list
    await expect(page.getByText('Audit Driver')).toBeVisible();
  });

  test('Phase 4: Global Brand & Tariff Audit', async ({ page }) => {
    // Check Tariff Page
    await page.goto('/tariff'); // Direct navigation for speed
    await expect(page.getByRole('heading', { name: /Tariff/i })).toBeVisible();
    
    // Verify specific rate is present
    await expect(page.getByText(/Hatchback/i)).toBeVisible();
    await expect(page.getByText(/₹[0-9]+/i)).toBeVisible();
  });

});
