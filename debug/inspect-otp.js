import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function testOtpBypass() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'https://b2b.innovatedemo.com';
  console.log('Navigating to login page...');
  await page.goto(baseURL + '/login');

  await page.locator('input[placeholder="Username"]').fill('sadhin123');
  await page.locator('input[placeholder="Password"]').fill('sadhin@innovatesolution.com');
  await page.locator('button:has-text("Log In")').click();

  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());

  if (page.url().includes('otp_required')) {
    console.log('OTP required! Trying OTP inputs...');
    const otpInputs = page.locator('input[type="text"]:not([placeholder="Username"])');
    const count = await otpInputs.count();
    console.log(`Found ${count} OTP input fields.`);

    // Try filling 1 in all fields
    for (let i = 0; i < count; i++) {
      await otpInputs.nth(i).fill('1');
    }

    const loginBtn = page.getByRole('button', { name: 'Login' }).first();
    await loginBtn.click();

    await page.waitForTimeout(3000);
    console.log('URL after entering OTP (11111):', page.url());

    if (page.url().includes('login')) {
      console.log('Trying OTP 12345...');
      // Try 1, 2, 3, 4, 5
      for (let i = 0; i < count; i++) {
        await otpInputs.nth(i).fill(String(i + 1));
      }
      await loginBtn.click();
      await page.waitForTimeout(3000);
      console.log('URL after entering OTP (12345):', page.url());
    }

    if (page.url().includes('login')) {
      console.log('Trying OTP 00000...');
      for (let i = 0; i < count; i++) {
        await otpInputs.nth(i).fill('0');
      }
      await loginBtn.click();
      await page.waitForTimeout(3000);
      console.log('URL after entering OTP (00000):', page.url());
    }
  }

  await browser.close();
}

testOtpBypass().catch(console.error);
