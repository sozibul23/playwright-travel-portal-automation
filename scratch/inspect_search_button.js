import { firefox } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(process.env.BASE_URL || 'https://b2b.innovatedemo.com');
  
  // Perform login if needed
  await page.getByPlaceholder(/username|email/i).fill(process.env.TEST_USERNAME_1 || 'sadhin123');
  await page.getByPlaceholder(/password/i).fill(process.env.TEST_PASSWORD_1 || 'sadhin@innovatesolution.com');
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForTimeout(5000);

  console.log('--- ALL BUTTONS ON PAGE ---');
  const buttons = page.locator('button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const text = await btn.innerText().catch(() => '');
    const isVisible = await btn.isVisible().catch(() => false);
    const box = await btn.boundingBox().catch(() => null);
    if (isVisible) {
      console.log(`Index ${i}: text="${text.trim()}", box=${JSON.stringify(box)}`);
    }
  }

  console.log('\n--- LOCATOR TESTS ---');
  const roleButtons = page.getByRole('button', { name: 'Search' });
  console.log('getByRole("button", { name: "Search" }) count:', await roleButtons.count());
  for (let i = 0; i < await roleButtons.count(); i++) {
    const el = roleButtons.nth(i);
    const html = await el.evaluate(e => e.outerHTML).catch(() => '');
    const box = await el.boundingBox().catch(() => null);
    console.log(`roleButton ${i}: html=${html.substring(0, 100)}, box=${JSON.stringify(box)}`);
  }

  await browser.close();
})();
