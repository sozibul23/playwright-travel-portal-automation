import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Performing login...');
  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login('sadhin123', 'sadhin@innovatesolution.com');

  console.log('Current URL:', page.url());
  await page.waitForTimeout(2000);

  // Inspect all textboxes
  const textboxes = await page.getByRole('textbox').evaluateAll(els => 
    els.map(el => ({
      tagName: el.tagName,
      name: el.getAttribute('name'),
      ariaLabel: el.getAttribute('aria-label'),
      placeholder: el.getAttribute('placeholder'),
      value: el.value || el.innerText,
      class: el.className,
      outerHTML: el.outerHTML.slice(0, 150)
    }))
  );
  console.log('All textboxes found on Home Page (role="textbox"):', JSON.stringify(textboxes, null, 2));

  // Inspect all input elements
  const allInputs = await page.locator('input').evaluateAll(els =>
    els.map(el => ({
      tagName: el.tagName,
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      class: el.className,
      value: el.value
    }))
  );
  console.log('All input tags found on Home Page:', JSON.stringify(allInputs, null, 2));

  await page.screenshot({ path: 'scratch/home_inputs.png', fullPage: true });

  await browser.close();
})();
