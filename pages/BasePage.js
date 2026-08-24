/**
 * BasePage - সব Page Object এর জন্য common helper methods।
 * নতুন কোনো পেজে repetitive wait/click/fill logic লাগলে এখানে যুক্ত করো,
 * তাহলে সব পেজ একইভাবে ব্যবহার করতে পারবে।
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async waitAndClick(locator, timeout = 15000) {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click();
  }

  async waitAndFill(locator, value, timeout = 15000) {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.fill(value);
  }

  async isVisibleSafe(locator, timeout = 3000) {
    return locator.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Wait until page load state (domcontentloaded, load, networkidle) and async JS/React components are 100% rendered
   * @param {Page} targetPage - Page instance to wait on (defaults to this.page)
   * @param {number} extraWaitMs - Additional buffer delay in ms
   */
  async waitForFullPageLoad(targetPage = null, extraWaitMs = 2500) {
    const p = targetPage || this.page;
    if (!p || p.isClosed()) return;

    console.log(`⏳ Waiting for page to completely load (${extraWaitMs}ms settle buffer)...`);
    await p.waitForLoadState('domcontentloaded').catch(() => {});
    await p.waitForLoadState('load').catch(() => {});
    await p.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(extraWaitMs).catch(() => {});
    console.log('✅ Page fully loaded & settled!');
  }
}
