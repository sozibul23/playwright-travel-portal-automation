import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://b2b.innovatedemo.com/login');
  console.log('URL:', page.url());

  const searchBtn = page.getByRole('button', { name: 'Search' }).first();
  const count = await page.getByRole('button', { name: 'Search' }).count();
  console.log('Count of getByRole("button", { name: "Search" }) on /login:', count);

  const isVisible = await searchBtn.isVisible().catch(() => false);
  console.log('Is getByRole("button", { name: "Search" }) visible on /login?:', isVisible);

  if (count > 0) {
    const text = await searchBtn.innerText().catch(() => '');
    const html = await searchBtn.evaluate(el => el.outerHTML).catch(() => '');
    console.log('Text of matched searchBtn:', text);
    console.log('HTML of matched searchBtn:', html);
  }

  await browser.close();
})();
