import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto('https://b2b.innovatedemo.com/login');
  
  console.log('Logging in...');
  await page.locator('input[type="text"], input[name="username"]').first().fill('sadhin123');
  await page.locator('input[type="password"], input[name="password"]').first().fill('sadhin@innovatesolution.com');
  await page.getByRole('button', { name: /Log In|Login/i }).first().click();
  
  console.log('Waiting for search page...');
  await page.waitForURL('**/flight/search**', { timeout: 30000 }).catch(() => {});
  
  // Close any modal if visible
  await page.keyboard.press('Escape');
  
  console.log('Opening departure date picker...');
  const dateInput = page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first();
  await dateInput.click();
  await page.waitForTimeout(2000);
  
  console.log('Dumping calendar DOM...');
  const calendarHTML = await page.evaluate(() => {
    // Look for common calendar containers
    const containers = document.querySelectorAll('.flatpickr-calendar, .datepicker, .rdp, div[role="dialog"]');
    if (containers.length > 0) {
      return Array.from(containers).map(el => el.outerHTML).join('\n---\n');
    }
    // If not found by common classes, search body for any container with high z-index or absolute positioning
    return document.body.innerHTML;
  });
  
  const dumpPath = './calendar-dom.html';
  fs.writeFileSync(dumpPath, calendarHTML);
  console.log(`Calendar DOM dumped to ${dumpPath}`);
  
  await browser.close();
})();
