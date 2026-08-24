import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto('https://b2b.innovatedemo.com/login');

  console.log('Entering credentials...');
  await page.getByRole('textbox', { name: 'Username' }).fill('sadhin123');
  await page.getByRole('textbox', { name: 'Password' }).fill('sadhin@innovatesolution.com');

  console.log('Clicking Log In...');
  await page.getByRole('button', { name: 'Log In' }).click();

  console.log('Waiting for URL redirect...');
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log('Current URL:', url);

  const cookies = await context.cookies();
  console.log('Cookies:', JSON.stringify(cookies, null, 2));

  const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage, null, 2));
  console.log('LocalStorage:', localStorage);

  const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage, null, 2));
  console.log('SessionStorage:', sessionStorage);

  const html = await page.content();
  console.log('HTML Length:', html.length);
  
  if (html.includes('otp') || html.includes('OTP')) {
    console.log('Found "otp" in HTML! Let\'s print matching lines:');
    const lines = html.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('otp')) {
        console.log('Line:', line.trim());
      }
    }
  }

  await browser.close();
})();
