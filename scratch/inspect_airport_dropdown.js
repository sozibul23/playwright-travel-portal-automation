import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://b2c.innovatedemo.com');
  await page.waitForTimeout(2000);

  // Click destination (2nd sb-input)
  const destInput = page.locator('input.sb-input').nth(1);
  await destInput.click({ force: true });
  await page.waitForTimeout(1000);

  const searchBox = page.locator('input[placeholder*="Airport code"]').filter({ visible: true }).first();
  console.log('Searchbox visible:', await searchBox.isVisible());
  await searchBox.fill('DEL');
  await page.waitForTimeout(2000);

  // Dump HTML around the dropdown
  const dropdownHtml = await page.evaluate(() => {
    const activeModalOrPopup = document.querySelector('.absolute, .dropdown, [class*="airport"], [class*="search"]');
    return document.body.innerHTML;
  });

  // Find all elements containing DEL or Delhi
  const matches = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all
      .filter(el => el.children.length === 0 && (el.textContent.includes('DEL') || el.textContent.includes('Delhi') || el.textContent.includes('Indira Gandhi')))
      .map(el => ({
        tag: el.tagName,
        text: el.textContent.trim(),
        class: el.className,
        parentTag: el.parentElement ? el.parentElement.tagName : '',
        parentClass: el.parentElement ? el.parentElement.className : ''
      }));
  });

  console.log('Matches for DEL in DOM:', JSON.stringify(matches, null, 2));

  await browser.close();
})();
