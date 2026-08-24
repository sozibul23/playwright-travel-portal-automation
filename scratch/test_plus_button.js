import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Navigating to login page...');
  await page.goto('https://b2b.innovatedemo.com/login');
  
  await page.locator('input[placeholder="Username"]').fill('sadhin123');
  await page.locator('input[placeholder="Password"]').fill('sadhin@innovatesolution.com');
  await page.locator('button:has-text("Log In")').click();
  
  await page.waitForURL('https://b2b.innovatedemo.com/');
  await page.waitForLoadState('networkidle');
  console.log('Login successful! Closing modals...');

  // Dismiss modals
  for (let i = 0; i < 5; i++) {
    const modalCloseBtn = page.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle').first();
    if (await modalCloseBtn.isVisible().catch(() => false)) {
      await modalCloseBtn.click({ force: true });
      console.log('Closed a modal');
    }
    await page.waitForTimeout(500);
  }

  // Click passenger selector
  console.log('Opening passenger dropdown...');
  const passengerBtn = page.getByRole('button', { name: /Passenger/i }).first();
  await passengerBtn.click();
  await page.waitForTimeout(1000);

  // Dump plus buttons
  const plusButtons = page.locator('.plusBtn');
  const count = await plusButtons.count();
  console.log(`Found ${count} .plusBtn elements.`);

  for (let i = 0; i < count; i++) {
    const btn = plusButtons.nth(i);
    // Find text of the sibling container
    const parentText = await btn.evaluate(el => {
      // Find the row container
      let current = el.parentElement;
      while (current && !current.innerText.includes('Years')) {
        current = current.parentElement;
      }
      return current ? current.innerText : '';
    });
    console.log(`Index ${i} row text:`, JSON.stringify(parentText.split('\n')));
  }

  // Try clicking index 1
  console.log('Clicking index 1...');
  await plusButtons.nth(1).click();
  await page.waitForTimeout(1000);

  // Get passenger button text
  const currentText = await passengerBtn.innerText();
  console.log('Passenger button text after click:', currentText);

  await browser.close();
}

main().catch(console.error);
