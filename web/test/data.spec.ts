import { test, expect } from '@playwright/test';

const YEARS = [{ model_run: '2015_06_YYY' }, { model_run: '2050_06_YYY' }];
const JURISDICTIONS = [{ cityname: 'Alameda' }, { cityname: 'Berkeley' }];
const VMT_ROWS = [
  {
    lives: 'Live in area',
    works: 'Works in area',
    persons: '4312',
    inside: '11956',
    partially_in: '28395',
    outside: '2987',
    total: '43338',
    cityname: 'Alameda',
    model_run: '2050_06_YYY',
    tazlist: '948,949,950',
  },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/data/years/all', (route) => route.fulfill({ json: YEARS }));
  await page.route('**/api/data/jurisdictions/all', (route) => route.fulfill({ json: JURISDICTIONS }));
  await page.route('**/api/data/vmt/**', (route) => route.fulfill({ json: VMT_ROWS }));
});

test('loads default VMT data and computes totals', async ({ page }) => {
  await page.goto('/data');

  await expect(page.getByText('Climate Action Plan VMT Data')).toBeVisible();
  // With a single data row, the row's total and the aggregate total both
  // read 43,338 - assert both cells exist rather than a single unique match.
  await expect(page.getByRole('cell', { name: '43,338' })).toHaveCount(2);
  await expect(page.getByText('948, 949, 950')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download Data' })).toBeEnabled();
});

test('renders grouped VMT table headers without repeated placeholder labels', async ({ page }) => {
  await page.goto('/data');

  const headerRows = page.locator('thead tr');
  await expect(headerRows).toHaveCount(3);

  await expect(headerRows.nth(0).locator('th')).toHaveText([
    'Population Segment',
    'Persons',
    'Non-commercial Passenger Vehicle Miles Traveled',
    'Vehicle miles traveled per capita',
  ]);
  await expect(headerRows.nth(1).locator('th')).toHaveText([
    'Entirely within',
    'Partially in',
    'Entirely outside',
    'Total',
  ]);
  await expect(headerRows.nth(2).locator('th')).toHaveText(['VMT', '%', 'VMT', '%', 'VMT', '%', 'VMT', '%']);

  await expect(headerRows.nth(0).locator('th').nth(0)).toHaveAttribute('rowspan', '3');
  await expect(headerRows.nth(0).locator('th').nth(1)).toHaveAttribute('rowspan', '3');
  await expect(headerRows.nth(0).locator('th').nth(2)).toHaveAttribute('colspan', '8');
  await expect(headerRows.nth(0).locator('th').nth(3)).toHaveAttribute('rowspan', '3');
  await expect(headerRows.nth(1).locator('th').first()).toHaveAttribute('colspan', '2');

  await expect(page.locator('thead')).toHaveClass(/table-dark/);
  await expect(page.locator('thead')).toHaveClass(/thead/);
  await expect(headerRows.nth(0).locator('th').first()).toHaveClass(/th/);
  await expect(headerRows.nth(0).locator('th').first()).toHaveAttribute('aria-sort', 'none');
});

test('shows a no-data message when Socrata returns nothing for the combination', async ({ page }) => {
  await page.route('**/api/data/vmt/**', (route) => route.fulfill({ json: [] }));

  await page.goto('/data');

  await expect(page.getByText('No data available for this combination!')).toBeVisible();
});
