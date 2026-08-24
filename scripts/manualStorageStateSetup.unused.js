import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { credentials } from '../data/testData.js';

const authFile = 'storageState.json';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Use sequential typing with slight delays to avoid trigger rate limits or security issues
  await loginPage.usernameInput.click();
  await loginPage.usernameInput.pressSequentially(credentials.username, { delay: 100 });
  await page.waitForTimeout(500);

  await loginPage.passwordInput.click();
  await loginPage.passwordInput.pressSequentially(credentials.password, { delay: 100 });
  await page.waitForTimeout(500);

  await loginPage.loginButton.click();

  // Wait for pathname not to be /login
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 20000 });
  await page.waitForTimeout(2000);

  await page.context().storageState({ path: authFile });
});
