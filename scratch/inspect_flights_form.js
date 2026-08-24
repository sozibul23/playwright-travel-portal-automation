import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const authPath = path.resolve('.auth/user_sadhin123.json');
  if (fs.existsSync(authPath)) {
    const state = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    await context.addCookies(state.cookies);
  }

  await page.goto('https://b2b.innovatedemo.com', { waitUntil: 'networkidle' });
  console.log('URL:', page.url());

  // Click Flights tab
  const flightsTab = page.locator('li, button, div, a').filter({ hasText: /^Flights$/i }).filter({ visible: true }).first();
  console.log('Is Flights tab visible?:', await flightsTab.isVisible());
  if (await flightsTab.isVisible()) {
    await flightsTab.click();
    await page.waitForTimeout(1000);
  }

  // Print all inputs and textboxes
  const inputs = await page.locator('input, [role="textbox"], [role="combobox"]').evaluateAll(els => 
    els.map(el => ({
      tagName: el.tagName,
      role: el.getAttribute('role'),
      name: el.getAttribute('name'),
      placeholder: el.getAttribute('placeholder'),
      ariaLabel: el.getAttribute('aria-label'),
      value: el.value || el.innerText,
      class: el.className
    }))
  );
  console.log('Inputs after clicking Flights tab:', JSON.stringify(inputs, null, 2));

  await page.screenshot({ path: 'scratch/flights_tab_clicked.png', fullPage: true });

  await browser.close();
})();
