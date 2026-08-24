import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to homepage...');
  await page.goto('https://b2b.innovatedemo.com');
  console.log('Initial URL:', page.url());

  const loginPage = new LoginPage(page);
  console.log('Performing login...');
  await loginPage.login('sadhin123', 'sadhin@innovatesolution.com');
  console.log('Post-login URL:', page.url());

  const searchPage = new FlightSearchPage(page);
  console.log('Calling ensureFlightsTabActive...');
  await searchPage.ensureFlightsTabActive();
  console.log('After ensureFlightsTabActive URL:', page.url());

  const originInput = page.getByRole('textbox', { name: 'Select' }).first();
  const isVisible = await originInput.isVisible();
  console.log('Is origin input (getByRole("textbox", { name: "Select" })) visible?:', isVisible);

  await page.screenshot({ path: 'scratch/after_login.png', fullPage: true });

  await browser.close();
})();
