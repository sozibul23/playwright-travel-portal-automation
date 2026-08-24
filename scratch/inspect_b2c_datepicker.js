import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://b2c.innovatedemo.com/');
  await page.waitForTimeout(2000);

  const inputs = await page.$$eval('input', els => els.map(el => ({
    type: el.type,
    placeholder: el.placeholder,
    value: el.value,
    name: el.name,
    className: el.className,
    ariaLabel: el.getAttribute('aria-label')
  })));
  console.log('Inputs found on homepage:', JSON.stringify(inputs, null, 2));

  // Let's click the date trigger (3rd input or whatever has date)
  console.log('Finding all clickable elements around date...');
  const textboxes = await page.$$eval('[role="textbox"], input', els => els.map(el => ({
    tag: el.tagName,
    text: el.innerText,
    value: el.value,
    placeholder: el.placeholder
  })));
  console.log('Textboxes:', textboxes);

  // Click 3rd textbox
  const dateInput = page.getByRole('textbox', { name: 'Select' }).nth(2);
  await dateInput.click();
  await page.waitForTimeout(1000);

  // Check what popped up
  const calendarHTML = await page.evaluate(() => {
    const pop = document.querySelector('.react-calendar') || document.querySelector('[class*="calendar"]') || document.querySelector('[class*="popover"]') || document.querySelector('dialog') || document.querySelector('[class*="date"]');
    return pop ? pop.outerHTML.substring(0, 1000) : 'No calendar container found';
  });
  console.log('Calendar HTML snippet:', calendarHTML);

  await browser.close();
})();
