import { test, expect } from '@playwright/test';

test('home page renders and links to the data explorer', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Climate Action Plan' })).toBeVisible();
  await page.getByRole('link', { name: 'Get VMT Data' }).click();
  await expect(page).toHaveURL('/data');
});
