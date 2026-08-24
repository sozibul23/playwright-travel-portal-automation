import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://b2c.innovatedemo.com');
  await page.waitForTimeout(2000);

  console.log('Inputs on homepage:');
  const inputs = await page.locator('input').evaluateAll(els => els.map(e => ({
    class: e.className,
    placeholder: e.placeholder,
    value: e.value,
    type: e.type
  })));
  console.log(JSON.stringify(inputs, null, 2));

  // Try selecting DEL
  const destInput = page.locator('input.sb-input').nth(1);
  console.log('Clicking destInput:', await destInput.inputValue().catch(() => 'none'));
  await destInput.click();
  await page.waitForTimeout(500);

  const searchBox = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  console.log('Searchbox visible:', await searchBox.isVisible());
  if (await searchBox.isVisible()) {
    await searchBox.fill('del');
    await page.waitForTimeout(1000);
    const options = await page.locator('li, div[role="option"], .select-option').allInnerTexts();
    console.log('Options for del:', options);
    await page.locator('li, div[role="option"], .select-option').first().click();
    await page.waitForTimeout(500);
  }

  // Check inputs again
  const inputsAfter = await page.locator('input.sb-input').evaluateAll(els => els.map(e => e.value));
  console.log('Inputs after dest selection:', inputsAfter);

  // Now click date input
  const dateInput = page.locator('input.sb-input').nth(2);
  console.log('Clicking date input:', await dateInput.inputValue());
  await dateInput.click();
  await page.waitForTimeout(500);

  const nextBtn = page.locator('.react-calendar__navigation__next-button').first();
  console.log('Next button visible:', await nextBtn.isVisible());
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  const dayBtn = page.locator('.react-calendar__month-view__days button:not([disabled])').nth(15);
  await dayBtn.click();
  await page.waitForTimeout(500);

  console.log('Date selected:', await page.locator('input.sb-input').nth(2).inputValue());

  // Click Search
  await page.locator('button').filter({ hasText: 'Search' }).first().click();
  console.log('Search clicked, waiting for navigation...');
  await page.waitForURL(/flight|search/i, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('Current URL:', page.url());
  const hasResults = await page.locator('button').filter({ hasText: /Select|Book Now/i }).count();
  console.log('Select/Book Now buttons count:', hasResults);
  const noResult = await page.locator(':text("Sorry, we couldn\'t find any results")').isVisible();
  console.log('No results message visible:', noResult);

  await browser.close();
})();
