import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();
  
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForLoadState('networkidle');

  // Click Hotels tab
  await page.getByText('Hotels').click();
  await page.waitForTimeout(500);

  // Find travelers trigger
  const trigger = page.locator('input[value*="Guest"], input[placeholder*="Guest"]')
    .or(page.getByRole('textbox').filter({ hasText: /Guest\(s\) in/i }))
    .or(page.getByText(/Guest\(s\) in/i))
    .or(page.getByText('Travelers'))
    .first();

  console.log('Trigger found:', await trigger.isVisible());
  console.log('Trigger outerHTML:', await trigger.evaluate(el => el.outerHTML));
  console.log('Trigger initial value:', await trigger.inputValue().catch(() => 'no val'));

  await trigger.click();
  await page.waitForTimeout(600);

  // Find popover container
  const popover = page.locator('.modal-box, div.absolute, div.popover, div[class*="shadow"]')
    .filter({ hasText: /Room|Adult|Apply/i })
    .first();
  console.log('Popover found:', await popover.isVisible());
  console.log('Popover innerText:\n', await popover.innerText());

  // Let's inspect all buttons inside popover
  const buttons = await popover.locator('button').all();
  console.log(`Found ${buttons.length} buttons in popover:`);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].innerText().catch(() => '');
    const html = await buttons[i].evaluate(el => el.outerHTML);
    console.log(`Button #${i}: text="${text}", html=${html}`);
  }

  // Click Add Room
  const addRoom = popover.getByRole('button', { name: 'Add Room' }).or(popover.locator('button:has-text("Add Room")')).first();
  console.log('Clicking Add Room...');
  await addRoom.click();
  await page.waitForTimeout(600);

  console.log('Popover text after Add Room:\n', await popover.innerText());

  // Click Apply
  const applyBtn = popover.getByRole('button', { name: 'Apply' }).or(popover.locator('button:has-text("Apply")')).first();
  console.log('Clicking Apply...');
  await applyBtn.click();
  await page.waitForTimeout(600);

  console.log('Trigger value after Apply:', await trigger.inputValue().catch(() => 'no val'));

  await browser.close();
}

main().catch(console.error);
