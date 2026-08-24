import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in to B2B...');
  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login(process.env.TEST_USERNAME_1 || 'sadhin123', process.env.TEST_PASSWORD_1 || 'Innovate@2026');
  await page.waitForTimeout(3000);

  const suppliers = ['All', 'TravelRobotFlight-Sandbox', 'Atlas SandBox - TripGic'];
  const routes = [
    { from: 'DAC', to: 'CXB' },
    { from: 'DAC', to: 'DEL' },
    { from: 'DAC', to: 'JED' },
    { from: 'DAC', to: 'DXB' }
  ];

  for (const s of suppliers) {
    for (const r of routes) {
      console.log(`\nTesting Supplier: [${s}] | Route: [${r.from} -> ${r.to}]`);
      await page.goto('https://b2b.innovatedemo.com');
      await page.waitForTimeout(2000);

      // Select Origin
      const originInput = page.locator('input.sb-input').first();
      await originInput.click({ force: true });
      await page.waitForTimeout(300);
      const searchBox1 = page.locator('input[placeholder*="Airport code"], input[type="search"]').filter({ visible: true }).first();
      await searchBox1.fill(r.from);
      await page.waitForTimeout(800);
      await page.locator('div, li, button, span, [role="option"]').filter({ hasText: new RegExp(`\\b${r.from}\\b`, 'i') }).filter({ visible: true }).first().click({ force: true });
      await page.waitForTimeout(300);

      // Select Destination
      const destInput = page.locator('input.sb-input').nth(1);
      await destInput.click({ force: true });
      await page.waitForTimeout(300);
      const searchBox2 = page.locator('input[placeholder*="Airport code"], input[type="search"]').filter({ visible: true }).first();
      await searchBox2.fill(r.to);
      await page.waitForTimeout(800);
      await page.locator('div, li, button, span, [role="option"]').filter({ hasText: new RegExp(`\\b${r.to}\\b`, 'i') }).filter({ visible: true }).first().click({ force: true });
      await page.waitForTimeout(300);

      // Select Supplier if not All
      if (s !== 'All') {
        const supInput = page.locator('input[placeholder*="Supplier"]').first();
        if (await supInput.isVisible()) {
          await supInput.click({ force: true });
          await page.waitForTimeout(300);
          await page.locator('div, li, span, button').filter({ hasText: s }).first().click({ force: true });
        }
      }

      // Search
      await page.locator('button').filter({ hasText: /^Search$/i }).first().click({ force: true });
      await page.waitForTimeout(5000);

      const count = await page.locator('button').filter({ hasText: /Select Flight|View Fare|Book/i }).count();
      const noFlight = await page.locator(':has-text("no flights available")').count();
      console.log(`Results: ${count} flight buttons found | No flight message count: ${noFlight}`);

      if (count > 0) {
        console.log(`>>> SUCCESS! Working combination found: Supplier: ${s}, Route: ${r.from} -> ${r.to}`);
        await browser.close();
        return;
      }
    }
  }

  await browser.close();
})();
