import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Directly navigate to DAC -> DEL search
  const delSearchUrl = 'https://b2c.innovatedemo.com/flight/search?trips=DAC,DEL,2026-09-15&cabin_class=Economy&flight=any&baggage=any&adult=1&child=0&child_age=&infant=0&infant_age=&carriers=';
  await page.goto(delSearchUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  console.log('DEL Search Page Title:', await page.title());
  const selectBtns = await page.locator('button').filter({ hasText: /Select|Book Now|Select Flight/i }).count();
  console.log('Select flight buttons found on DAC->DEL:', selectBtns);

  if (selectBtns > 0) {
    await page.locator('button').filter({ hasText: /Select|Book Now|Select Flight/i }).first().click();
    await page.waitForURL(/checkout|booking/i, { timeout: 15000 });
    console.log('Successfully reached checkout URL:', page.url());
  } else {
    console.log('No flight button found on DAC->DEL, checking if there is a no-results message...');
    const noRes = await page.locator('p, h3, h4, h5, div').filter({ hasText: /couldn't find|No Flight|Not found/i }).allInnerTexts();
    console.log('Messages:', noRes);
  }

  await browser.close();
})();
