import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto(process.env.BASE_URL + '/login');

  console.log('Logging in...');
  await page.locator('input[placeholder="Username"]').fill(process.env.TEST_USERNAME || 'sadhin123');
  await page.locator('input[placeholder="Password"]').fill(process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com');
  await page.locator('button:has-text("Log In")').click();

  await page.waitForLoadState('networkidle');
  
  console.log('Waiting for Search button...');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });
  console.log('Search button visible. Waiting 5 seconds for promo modal to load...');
  await page.waitForTimeout(5000);

  console.log('Dumping HTML of open modals before click:');
  const modals = await page.locator('div.modal, dialog, [role="dialog"]').all();
  console.log(`Found ${modals.length} potential modals.`);
  for (let i = 0; i < modals.length; i++) {
    const isVisible = await modals[i].isVisible();
    const className = await modals[i].getAttribute('class');
    const openAttr = await modals[i].getAttribute('open');
    const computedStyle = await modals[i].evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex
      };
    });
    console.log(`Modal ${i} BEFORE: Tag=${modals[i].evaluate(el => el.tagName)}, Class=${className}, OpenAttr=${openAttr}, Visible=${isVisible}`);
    console.log('Style:', computedStyle);
  }

  // Close modals
  const closeButtons = page.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle');
  const count = await closeButtons.count();
  console.log(`Closing ${count} modal dialogs...`);
  for (let i = 0; i < count; i++) {
    const btn = closeButtons.nth(i);
    if (await btn.isVisible()) {
      await btn.click({ force: true });
      await page.waitForTimeout(1000); // Wait longer for transition
    }
  }

  console.log('Dumping HTML of open modals after click:');
  for (let i = 0; i < modals.length; i++) {
    const isVisible = await modals[i].isVisible();
    const className = await modals[i].getAttribute('class');
    const openAttr = await modals[i].getAttribute('open');
    const computedStyle = await modals[i].evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex
      };
    });
    console.log(`Modal ${i} AFTER: Class=${className}, OpenAttr=${openAttr}, Visible=${isVisible}`);
    console.log('Style:', computedStyle);
  }

  await browser.close();
}

run().catch(console.error);
