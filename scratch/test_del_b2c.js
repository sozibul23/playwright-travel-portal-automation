import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://b2c.innovatedemo.com');
  await page.waitForTimeout(2000);

  // Click destination (2nd sb-input)
  const destInput = page.locator('input.sb-input').nth(1);
  await destInput.click({ force: true });
  await page.waitForTimeout(1000);

  const searchBox = page.locator('input[placeholder*="Airport code"]').filter({ visible: true }).first();
  await searchBox.fill('DEL');
  await page.waitForTimeout(1500);

  // Click DEL option
  const delOption = page.locator('h4:has-text("DEL"), span:has-text("DEL"), p:has-text("Indira Gandhi")').first();
  await delOption.click({ force: true });
  await page.waitForTimeout(1000);

  // Date selection
  const dateInput = page.locator('input.sb-input').nth(2);
  await dateInput.click({ force: true });
  await page.waitForTimeout(500);

  // Advance by 1 month
  const nextBtn = page.locator('.react-calendar__navigation__next-button').first();
  if (await nextBtn.isVisible({ timeout: 2000 })) {
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  // Click day 15
  await page.locator('.react-calendar__month-view__days button:not([disabled])').nth(15).click({ force: true });
  await page.waitForTimeout(500);

  // Click Search
  await page.locator('button').filter({ hasText: 'Search' }).first().click();
  console.log('Search clicked...');
  await page.waitForURL(/\/flight\/(search|results)|search/i, { timeout: 35000 }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('Results URL:', page.url());
  const buttonsCount = await page.locator('button').filter({ hasText: /Select|Book Now|Select Flight/i }).count();
  console.log('Select flight buttons found:', buttonsCount);

  if (buttonsCount > 0) {
    await page.locator('button').filter({ hasText: /Select|Book Now|Select Flight/i }).first().click({ force: true });
    await page.waitForURL(/checkout|booking/i, { timeout: 35000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('Checkout URL:', page.url());
  }

  await browser.close();
})();
