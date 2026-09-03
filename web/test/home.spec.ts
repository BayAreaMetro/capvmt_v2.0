import { test, expect } from '@playwright/test';

test('home page renders and links to the data explorer', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Climate Action Plan' })).toBeVisible();
  await page.getByRole('link', { name: 'Get VMT Data' }).click();
  await expect(page).toHaveURL('/data');
});

test('header renders Bay Area Air Quality Management District branding without text or overflow', async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 667 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const header = page.locator('header, nav, .navbar').first();
    await expect(header.locator('img[src="/images/HorizLogo-WHT.png"]')).toBeVisible();
    await expect(header.locator('img[src="/images/HorizLogo-WHT.png"]')).toHaveAttribute(
      'alt',
      'Bay Area Air Quality Management District Logo'
    );
    await expect(header.getByText('Vehicle Miles Traveled Dataportal')).toHaveCount(0);

    const homeLink = header.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();

    const logoImg = header.locator('img[src="/images/HorizLogo-WHT.png"]');
    const logoBox = await logoImg.boundingBox();
    const headerBox = await header.boundingBox();

    expect(logoBox).not.toBeNull();
    expect(headerBox).not.toBeNull();

    if (viewport.width > 576) {
      expect(logoBox!.height).toBeGreaterThan(40);
      expect(logoBox!.height).toBe(56);
    } else {
      expect(logoBox!.height).toBeGreaterThan(32);
      expect(logoBox!.height).toBe(44);
    }

    expect(logoBox!.y).toBeGreaterThanOrEqual(headerBox!.y);
    expect(logoBox!.y + logoBox!.height).toBeLessThanOrEqual(headerBox!.y + headerBox!.height + 1);

    const hasNoOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    );
    expect(hasNoOverflow).toBe(true);
  }
});

test('home navigation does not expose the map menu item', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Map', exact: true })).toHaveCount(0);
});

test('home navigation does not expose the feedback menu item', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Feedback', exact: true })).toHaveCount(0);
});

test('home footer renders Bay Area Air District content', async ({ page }) => {
  await page.goto('/');

  const footer = page.getByRole('contentinfo').filter({ has: page.locator('address') });

  await expect(footer).toHaveCSS('background-color', 'rgb(0, 48, 63)');

  const logoImg = footer.locator('img[src="/images/HorizLogo-WHT.png"]');
  const address = footer.locator('address');
  const logoBox = await logoImg.boundingBox();
  const addressBox = await address.boundingBox();

  expect(logoBox).not.toBeNull();
  expect(addressBox).not.toBeNull();

  // HorizLogo-WHT.png has transparent padding on its left edge (first visible artwork column is x=534 out of 9946px total width, ~5.37%).
  // Assert that rendered logo artwork left edge aligns with address element left edge (within 1px tolerance).
  const logoArtworkLeft = await page.evaluate(() => {
    const img = document.querySelector('footer img[src="/images/HorizLogo-WHT.png"]') as HTMLImageElement;
    const addr = document.querySelector('address');
    if (!img || !addr) return null;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] > 200 && data[i] > 200) {
          if (x < minX) minX = x;
        }
      }
    }

    const imgRect = img.getBoundingClientRect();
    const addressRect = addr.getBoundingClientRect();
    const artworkLeft = imgRect.left + (minX / canvas.width) * imgRect.width;

    return {
      artworkLeft,
      addressLeft: addressRect.left,
      diff: artworkLeft - addressRect.left,
    };
  });

  expect(logoArtworkLeft).not.toBeNull();
  expect(Math.abs(logoArtworkLeft!.diff)).toBeLessThanOrEqual(1.0);

  await expect(footer).toContainText('Stay Informed');
  await expect(footer).toContainText('Air District Initiatives');
  await expect(footer.getByText('Bay Area Air District', { exact: true })).toHaveCount(0);
  await expect(footer.getByText('877-4NO-BURN')).toHaveCount(0);
  await expect(footer.locator('img[src="/images/HorizLogo-WHT.png"]')).toHaveCount(1);
  await expect(footer.locator('img[src="/images/spare_the_air.png"]')).toHaveCount(1);
  await expect(footer.locator('img[src="/images/no_burn.png"]')).toHaveCount(1);
  await expect(footer.getByRole('link', { name: 'Directions' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Subscribe' })).toBeVisible();
  await expect(footer.locator('a[href^="tel:"]').first()).toBeVisible();
});

test('footer content width and alignment match shared page container at desktop and mobile viewports', async ({ page }) => {
  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/data');

  const mainContainer = page.locator('main .container').first();
  const footerContainer = page.locator('footer .container').first();

  await expect(mainContainer).toBeVisible();
  await expect(footerContainer).toBeVisible();

  const mainBox = await mainContainer.boundingBox();
  const footerBox = await footerContainer.boundingBox();

  expect(mainBox).not.toBeNull();
  expect(footerBox).not.toBeNull();

  // Desktop: footer content container matches main page container width (1140px) and horizontal positioning (x: 70)
  expect(footerBox!.width).toBeCloseTo(mainBox!.width, 1);
  expect(footerBox!.x).toBeCloseTo(mainBox!.x, 1);

  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  const mobileFooterBox = await footerContainer.boundingBox();
  expect(mobileFooterBox).not.toBeNull();

  // Mobile: footer container fills the 375px viewport horizontally (x: 0, width: 375)
  expect(mobileFooterBox!.x).toBe(0);
  expect(mobileFooterBox!.width).toBe(375);
});

test('feedback route is not available', async ({ page }) => {
  const response = await page.goto('/feedback');

  expect(response?.status()).toBe(404);
});

test('about page does not embed the overview video', async ({ page }) => {
  await page.goto('/about');

  await expect(page.locator('iframe[src*="youtube.com"]')).toHaveCount(0);
});
