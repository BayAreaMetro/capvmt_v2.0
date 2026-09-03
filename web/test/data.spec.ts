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

  await page.getByRole('combobox').nth(0).selectOption('2050_06_YYY');
  await page.getByRole('combobox').nth(1).selectOption('Alameda');

  await expect(page.getByText('Climate Action Plan VMT Data')).toBeVisible();
  const headingBox = await page.getByRole('heading', { name: 'Climate Action Plan VMT Data' }).boundingBox();
  const formBox = await page.locator('form').boundingBox();
  expect(headingBox).not.toBeNull();
  expect(formBox).not.toBeNull();
  expect(headingBox!.y).toBeLessThan(formBox!.y);
  // With a single data row, the row's total and the aggregate total both
  // read 43,338 - assert both cells exist rather than a single unique match.
  await expect(page.getByRole('cell', { name: '43,338' })).toHaveCount(2);
  await expect(page.getByText('948, 949, 950')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download Data' })).toBeEnabled();
  const controls = page.locator('form');
  await expect(controls.getByText('Model Run: 2050_06_YYY')).toBeVisible();
  await expect(controls.getByRole('button', { name: 'Download Data' })).toBeVisible();
});

test('starts with blank scenario and jurisdiction selections', async ({ page }) => {
  await page.goto('/data');

  await expect(page.getByRole('combobox').nth(0)).toHaveValue('');
  await expect(page.getByRole('combobox').nth(1)).toHaveValue('');
  await expect(page.getByText('Scenario Year', { exact: true })).toBeVisible();
  await expect(page.getByText('Place Name', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download Data' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download Data' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Climate Action Plan VMT Data' })).toBeVisible();
  await expect(page.locator('table')).toHaveCount(0);
});

test('renders grouped VMT table headers without repeated placeholder labels', async ({ page }) => {
  await page.goto('/data');
  await page.getByRole('combobox').nth(0).selectOption('2050_06_YYY');
  await page.getByRole('combobox').nth(1).selectOption('Alameda');

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

  const tableHead = page.locator('thead');
  const firstHeaderCell = headerRows.nth(0).locator('th').first();

  await expect(tableHead).toHaveClass(/groupedTableHead/);
  await expect(firstHeaderCell).toHaveClass(/groupedHeaderCell/);
  await expect(firstHeaderCell).toHaveCSS('background-color', 'rgb(33, 37, 41)');
  await expect(firstHeaderCell).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(firstHeaderCell).toHaveAttribute('aria-sort', 'none');

  const ariaSortValues = await headerRows.locator('th').evaluateAll((headers) =>
    headers.map((header) => header.getAttribute('aria-sort')),
  );
  expect(ariaSortValues).toHaveLength(16);
  expect(ariaSortValues.every((value) => /^(none|ascending|descending)$/.test(value ?? ''))).toBe(true);
});

test('shows a no-data message when Socrata returns nothing for the combination', async ({ page }) => {
  await page.route('**/api/data/vmt/**', (route) => route.fulfill({ json: [] }));

  await page.goto('/data');
  await page.getByRole('combobox').nth(0).selectOption('2050_06_YYY');
  await page.getByRole('combobox').nth(1).selectOption('Alameda');

  await expect(page.getByText('No data available for this combination!')).toBeVisible();
});
