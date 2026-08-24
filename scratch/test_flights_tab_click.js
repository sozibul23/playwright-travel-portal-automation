import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login('sadhin123', 'sadhin@innovatesolution.com');

  await page.waitForTimeout(2000);
  console.log('After login URL:', page.url());

  // Check if origin input is visible before clicking tab
  const inputBefore = page.locator('input.sb-input[placeholder="Select"]').first();
  console.log('Is origin input visible before tab click?:', await inputBefore.isVisible());

  // Try different ways to locate and click Flights tab
  const flightsItem = page.locator('main').locator('li, div, span, a').filter({ hasText: /^Flights$/i }).filter({ visible: true });
  console.log('Flights tab matches count:', await flightsItem.count());

  for (let i = 0; i < await flightsItem.count(); i++) {
    const el = flightsItem.nth(i);
    const tagName = await el.evaluate(e => e.tagName);
    const text = await el.innerText();
    console.log(`Match ${i}: tag=${tagName}, text=${JSON.stringify(text)}`);
  }

  // Click the last or most specific element with text "Flights"
  const targetTab = page.locator('main').locator('li, a, div').filter({ hasText: /^Flights$/i }).filter({ visible: true }).last();
  console.log('Clicking targetTab...');
  await targetTab.click();
  await page.waitForTimeout(1500);

  const inputAfter = page.locator('input.sb-input[placeholder="Select"]').first();
  console.log('Is origin input visible after tab click?:', await inputAfter.isVisible());

  await browser.close();
})();
