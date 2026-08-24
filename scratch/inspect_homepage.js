import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load auth state if exists
  const authPath = path.resolve('.auth/user_sadhin123.json');
  if (fs.existsSync(authPath)) {
    const state = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    await context.addCookies(state.cookies);
  }

  await page.goto('https://b2b.innovatedemo.com', { waitUntil: 'networkidle' });
  console.log('Page URL:', page.url());

  // Print all service tabs
  const tabs = await page.locator('main li, main div, main a, main button').evaluateAll(els => 
    els.map(el => ({ tag: el.tagName, text: el.innerText.trim(), class: el.className })).filter(e => e.text.length > 0 && e.text.length < 30)
  );
  console.log('Service tabs/buttons found:', tabs.slice(0, 20));

  // Print all textboxes/inputs
  const inputs = await page.locator('input, [role="textbox"], [role="searchbox"]').evaluateAll(els =>
    els.map(el => ({ tag: el.tagName, role: el.getAttribute('role'), placeholder: el.placeholder, name: el.getAttribute('name'), ariaLabel: el.getAttribute('aria-label'), innerText: el.innerText, class: el.className }))
  );
  console.log('Inputs found on page:', inputs);

  // Take screenshot
  await page.screenshot({ path: 'scratch/homepage.png', fullPage: true });

  await browser.close();
})();
