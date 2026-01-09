import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Verify the page loaded successfully
    await expect(page).toHaveTitle(/Tao Tang/i);
  });

  test('should display the hero section', async ({ page }) => {
    await page.goto('/');
    
    // Verify hero content is visible
    await expect(page.locator('h1')).toBeVisible();
  });
});
