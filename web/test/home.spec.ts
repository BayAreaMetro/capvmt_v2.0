import { test, expect } from '@playwright/test';

test('home page renders and links to the data explorer', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Climate Action Plan' })).toBeVisible();
  await page.getByRole('link', { name: 'Get VMT Data' }).click();
  await expect(page).toHaveURL('/data');
});

test('home navigation does not expose the map menu item', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Map', exact: true })).toHaveCount(0);
});

test('home navigation does not expose the feedback menu item', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Feedback', exact: true })).toHaveCount(0);
});

test('feedback route is not available', async ({ page }) => {
  const response = await page.goto('/feedback');

  expect(response?.status()).toBe(404);
});

test('about page does not embed the overview video', async ({ page }) => {
  await page.goto('/about');

  await expect(page.locator('iframe[src*="youtube.com"]')).toHaveCount(0);
});
