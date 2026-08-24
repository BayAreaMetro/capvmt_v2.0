import { test, expect } from '@playwright/test';

test('submits feedback to the in-house Asana-backed endpoint', async ({ page }) => {
  let requestBody: unknown;
  await page.route('**/api/feedback', (route) => {
    requestBody = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { ok: true, taskGid: 'task-123' } });
  });

  await page.goto('/feedback');
  await page.getByPlaceholder('First Last').fill('Ada Lovelace');
  await page.getByPlaceholder('Email').fill('ada@example.com');
  await page.getByPlaceholder('Leave a comment here').fill('The map is broken.');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Thanks — your feedback was submitted.')).toBeVisible();
  expect(requestBody).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com', comment: 'The map is broken.' });
});

test('shows an error when the submission fails', async ({ page }) => {
  await page.route('**/api/feedback', (route) => route.fulfill({ status: 500, json: { error: 'not configured' } }));

  await page.goto('/feedback');
  await page.getByPlaceholder('Leave a comment here').fill('Hello');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(/Request failed: 500/)).toBeVisible();
});
