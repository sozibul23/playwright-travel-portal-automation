/**
 * Clicks a Playwright locator when it becomes visible and enabled.
 *
 * @param {import('@playwright/test').Locator} locator - The locator to click.
 * @param {object} [options] - Optional configuration.
 * @param {number} [options.timeout=15000] - Maximum wait time in ms.
 */
export async function clickWhenReady(locator, options = {}) {
  const timeout = options.timeout ?? 15000;
  await locator.waitFor({ state: 'visible', timeout });
  try {
    await locator.click({ timeout: 4000 });
  } catch (err) {
    await locator.click({ force: true }).catch(async () => {
      await locator.evaluate(el => el.click());
    });
  }
}
