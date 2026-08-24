import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in...');
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('sadhin123', '123456sS@');

  const hotelPage = new HotelSearchPage(page);
  await hotelPage.goToHotelTab();

  // Test Dubai destination
  console.log('--- Testing Dubai Destination ---');
  await hotelPage.selectDestination('dubai');
  let destVal = await hotelPage.destinationTrigger.inputValue().catch(() => '');
  console.log('Dubai destination input value:', destVal);

  // Test Bangkok destination
  console.log('--- Testing Bangkok Destination ---');
  await hotelPage.selectDestination('bangkok');
  destVal = await hotelPage.destinationTrigger.inputValue().catch(() => '');
  console.log('Bangkok destination input value:', destVal);

  // Test Room/Guest selection: 2 rooms, 3 adults, 1 child
  console.log('--- Testing 2 rooms, 3 adults, 1 child ---');
  await hotelPage.selectGuestsAndRooms(2, 3, 1);
  const trigger = page.locator('input[value*="Guest"], input[placeholder*="Guest"]')
    .or(page.getByRole('textbox').filter({ hasText: /Guest\(s\) in/i }))
    .first();
  const triggerVal = await trigger.inputValue().catch(() => '');
  console.log('Final travelers trigger value:', triggerVal);

  await page.screenshot({ path: 'scratch/hotel_search_debug.png' });
  await browser.close();
}

test().catch(console.error);
