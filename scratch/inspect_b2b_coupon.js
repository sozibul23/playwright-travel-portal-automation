import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const authFile = 'storageState.json';
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: fs.existsSync(authFile) ? authFile : undefined
  });
  const page = await context.newPage();

  console.log('Navigating to B2B portal...');
  await page.goto('https://b2b.innovatedemo.com');
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());

  // Search DAC to CXB on B2B
  console.log('Searching flight on B2B...');
  const searchBtn = page.locator('button').filter({ hasText: 'Search' }).first();
  if (await searchBtn.isVisible()) {
    await searchBtn.click({ force: true });
    await page.waitForTimeout(5000);
  }

  console.log('Results page URL:', page.url());

  // Click Book flight
  const bookBtn = page.locator('button').filter({ hasText: /Book Now|Select Flight|Book/i }).first();
  console.log('Book button visible:', await bookBtn.isVisible());
  if (await bookBtn.isVisible()) {
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
      bookBtn.click({ force: true })
    ]);

    const activePage = newPage || page;
    await activePage.waitForTimeout(3000);
    console.log('Booking page URL:', activePage.url());

    // Find all inputs, buttons, steps on booking page
    const elements = await activePage.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, button, [role="button"], h3, h4, h5, p, span'))
        .filter(el => {
          const t = (el.textContent || el.placeholder || el.value || '').toLowerCase();
          return t.includes('coupon') || t.includes('promo') || t.includes('discount') || t.includes('payable') || t.includes('step') || t.includes('apply');
        })
        .map(el => ({
          tag: el.tagName,
          text: (el.textContent || '').trim().substring(0, 100),
          placeholder: el.placeholder || '',
          value: el.value || '',
          class: el.className
        }));
      return inputs;
    });

    console.log('Relevant elements on B2B Booking Page:', JSON.stringify(elements, null, 2));
  }

  await browser.close();
})();
