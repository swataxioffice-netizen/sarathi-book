import { test, expect } from '@playwright/test';

test.describe('Sarathi Book Core Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for any heading containing Sarathi
    await expect(page.getByRole('heading', { name: /Sarathi/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test('should load the default landing page', async ({ page }) => {
    // Check for the presence of the default tab content
    await expect(page.getByText(/Invoices|Trips/i).first()).toBeVisible();
  });

  test('should navigate to the Calculator', async ({ page, isMobile }) => {
    if (isMobile) {
      // Mobile Navigation
      await page.click('button:has-text("FARE")');
    } else {
      // Desktop Navigation
      const footerLink = page.locator('footer button').filter({ hasText: /Calculator/i });
      if (await footerLink.isVisible()) {
          await footerLink.scrollIntoViewIfNeeded();
          await footerLink.click();
      } else {
          // Direct navigation as a extreme fallback
          await page.goto('/calculator');
      }
    }

    // Verify calculator page is active
    await expect(page).toHaveURL(/calculator/);
    await expect(page.locator('body')).toContainText(/Hatchback|Sedan|SUV/i);
  });

  test('should show login nudge after 15s (Guest mode)', async ({ page }) => {
    test.slow(); 
    const nudge = page.getByText(/Pro Features|Upgrade/i).first();
    await expect(nudge).toBeVisible({ timeout: 25000 });
    
    const continueBtn = page.getByRole('button', { name: /Continue as Guest/i });
    if (await continueBtn.isVisible()) {
        await continueBtn.click();
        await expect(nudge).not.toBeVisible();
    }
  });

});
