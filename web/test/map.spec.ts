import { test, expect } from '@playwright/test';

test('shows a clear configuration error when no Mapbox token is set', async ({ page }) => {
  // Test env has no NEXT_PUBLIC_MAPBOX_TOKEN configured - this exercises
  // the "fail clearly" path rather than requiring a real Mapbox token.
  await page.goto('/map');

  await expect(page.getByText('NEXT_PUBLIC_MAPBOX_TOKEN is not configured')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Data' })).toBeVisible();
});
