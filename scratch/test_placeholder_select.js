import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login('sadhin123', 'sadhin@innovatesolution.com');

  await page.waitForTimeout(2000);

  const getByRoleSelect = page.getByRole('textbox', { name: 'Select' });
  console.log('getByRole("textbox", { name: "Select" }) count:', await getByRoleSelect.count());

  const getByPlaceholderSelect = page.getByPlaceholder('Select');
  console.log('getByPlaceholder("Select") count:', await getByPlaceholderSelect.count());

  const locatorSbInput = page.locator('input.sb-input[placeholder="Select"]');
  console.log('locator("input.sb-input[placeholder=\'Select\']") count:', await locatorSbInput.count());

  if (await locatorSbInput.count() >= 2) {
    console.log('Origin input visible?:', await locatorSbInput.nth(0).isVisible());
    console.log('Destination input visible?:', await locatorSbInput.nth(1).isVisible());
  }

  await browser.close();
})();
