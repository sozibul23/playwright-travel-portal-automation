import { BasePage } from './BasePage.js';

export class HotelDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.viewRoomsBtn = page.getByRole('link', { name: /View All Rooms|View Rooms|View Details|See Details|Choose Room|Select Room/i })
      .or(page.getByRole('button', { name: /View All Rooms|View Rooms|View Details|See Details|Choose Room|Select Room/i }))
      .or(page.locator('a:has-text("View All Rooms"), a:has-text("View Rooms"), button:has-text("View Rooms"), a:has-text("View Details")'))
      .or(page.locator('.hotel-card a, .hotel-item a, [data-hotel-id] a').filter({ visible: true }))
      .filter({ visible: true })
      .first();
  }

  /**
   * Click 'View All Rooms' link on search result card which opens a popup tab
   * @param {number} cardIndex - Index of the hotel result card to click (0 = 1st card, 1 = 2nd card)
   * @returns {Promise<Page>} The newly opened detail page/tab instance
   */
  async openHotelDetailsTab(cardIndex = 0) {
    await this.page.bringToFront().catch(() => {});
    await this.page.waitForURL(/\/hotel\/(search|search-results)/i, { timeout: 5000 }).catch(() => {});

    const resultButtons = this.page.locator('a, button, [role="button"]')
      .filter({ hasText: /View All Rooms|View Rooms|View Details|See Details|Choose/i })
      .filter({ visible: true });

    const noHotelsMsg = this.page.locator('body').filter({ hasText: /No hotels found|No results|adjusting your filters|0 Out Of 0/i }).first();

    // Fast-wait for first result button or No Hotels message
    await Promise.race([
      resultButtons.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      noHotelsMsg.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    ]);

    const totalCards = await resultButtons.count().catch(() => 0);
    if (totalCards === 0) {
      const isNoResults = await noHotelsMsg.isVisible({ timeout: 500 }).catch(() => false);
      if (isNoResults) {
        console.log('⚠️ Supplier API returned 0 hotels for this search criteria ("No hotels found").');
        return null;
      }
    }

    const targetIdx = (totalCards > cardIndex) ? cardIndex : 0;
    const targetBtn = resultButtons.nth(targetIdx);
    await targetBtn.waitFor({ state: 'visible', timeout: 10000 });

    console.log(`Opening Hotel Details page for Card #${targetIdx + 1}...`);
    const popupPromise = this.page.waitForEvent('popup');
    await targetBtn.click({ force: true }).catch(() => targetBtn.evaluate(el => el.click()));
    const detailPage = await popupPromise;

    console.log('Waiting for Hotel Details page to load and appear completely...');
    await detailPage.waitForURL(/details/i, { timeout: 15000 }).catch(() => {});
    await detailPage.waitForLoadState('domcontentloaded').catch(() => {});

    const detailsHeading = detailPage.locator('h1, h2, [class*="hotel-name"], [class*="title"], h3')
      .filter({ visible: true })
      .first();
    await detailsHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    console.log('✅ Hotel Details page appeared and fully loaded.');

    return detailPage;
  }

  /**
   * Select/Ensure supplier filter on the hotel details page
   * @param {Page} detailPage - The popup tab instance
   * @param {string} supplierName - e.g. 'HotelBeds - Sandbox'
   */
  async selectSupplierOnDetailsPage(detailPage, supplierName = 'HotelBeds - Sandbox') {
    const supplierDropdown = detailPage.locator('div, button, span, th')
      .filter({ hasText: /Suppliers:/i })
      .filter({ visible: true })
      .first();

    if (await supplierDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      const triggerText = await supplierDropdown.innerText().catch(() => '');
      if (triggerText.toLowerCase().includes(supplierName.toLowerCase())) {
        console.log(`Supplier ${supplierName} is already selected on details page.`);
        return;
      }

      console.log(`🏨 Selecting supplier on hotel details page: ${supplierName}`);
      await supplierDropdown.click({ force: true }).catch(() => {});
      await detailPage.waitForTimeout(400);

      const supplierItem = detailPage.locator('label, div, li, span, option')
        .filter({ hasText: new RegExp(supplierName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
        .filter({ visible: true })
        .first();

      if (await supplierItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        const checkbox = supplierItem.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible({ timeout: 500 }).catch(() => false)) {
          const isChecked = await checkbox.isChecked().catch(() => false);
          if (!isChecked) {
            await supplierItem.click({ force: true }).catch(() => {});
          }
        } else {
          await supplierItem.click({ force: true }).catch(() => {});
        }
      }

      await detailPage.keyboard.press('Escape').catch(() => {});
    }
  }

  /**
   * Select a room from the room list inside the details page
   * @param {Page} detailPage - The popup tab instance
   * @param {string} preferredSupplier - e.g. 'HotelBeds - Sandbox'
   * @returns {Promise<boolean>} True if room selected & reached checkout, false if all options failed/expired
   */
  async selectFirstRoom(detailPage, preferredSupplier = 'HotelBeds - Sandbox') {
    await detailPage.waitForLoadState('domcontentloaded').catch(() => {});
    await this.selectSupplierOnDetailsPage(detailPage, preferredSupplier).catch(() => {});
    await detailPage.waitForTimeout(500);

    // Find room rate book buttons (excluding header tabs like "Select Room", "Book Room", "Rooms")
    const chooseButtons = detailPage.locator('button, a, .btn, [role="button"]')
      .filter({ hasText: /^Book Now$/i })
      .or(
        detailPage.locator('tr, div[class*="room"], div[class*="border"], div[class*="card"], div[class*="item"]')
          .locator('button, a, .btn')
          .filter({ hasText: /Book Now|Book|Choose|Select/i })
      )
      .filter({ hasNotText: /^Overview$/i })
      .filter({ hasNotText: /^Rooms$/i })
      .filter({ hasNotText: /^Amenities$/i })
      .filter({ hasNotText: /^Policies$/i })
      .filter({ hasNotText: /^Select Room$/i })
      .filter({ hasNotText: /^Book Room$/i })
      .filter({ hasNotText: /^Choose Room$/i })
      .filter({ visible: true });

    console.log('Waiting up to 35s for room list & Choose/Book buttons to render on details page...');
    await chooseButtons.first().waitFor({ state: 'visible', timeout: 35000 }).catch(() => {});

    const totalBtns = await chooseButtons.count().catch(() => 0);
    console.log(`Found ${totalBtns} room Choose/Book buttons on details page.`);

    if (totalBtns === 0) {
      console.log('⚠️ No room choose buttons found on details page.');
      return false;
    }

    // Inspect each Choose button's immediate row ancestor to sort priority
    const priorityIndices = [];
    const fallbackIndices = [];
    const avoidIndices = [];

    for (let i = 0; i < Math.min(totalBtns, 15); i++) {
      const btn = chooseButtons.nth(i);
      // Ancestor room row wrapper
      const rowAncestor = btn.locator('xpath=ancestor::tr | ancestor::div[contains(@class, "border") or contains(@class, "item") or contains(@class, "card") or contains(@class, "flex-row") or contains(@class, "grid")][1]');
      const rowText = (await rowAncestor.innerText().catch(() => '')).toLowerCase();

      if (rowText.includes('hotelbeds')) {
        priorityIndices.push(i);
      } else if (rowText.includes('goglobal') || rowText.includes('expedia')) {
        avoidIndices.push(i);
      } else {
        fallbackIndices.push(i);
      }
    }

    const sortedIndices = [...priorityIndices, ...fallbackIndices, ...avoidIndices];
    console.log(`Sorted Choose button index priority: [${sortedIndices.join(', ')}]`);

    for (const idx of sortedIndices) {
      const btn = chooseButtons.nth(idx);
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Clicking Room option #${idx + 1}...`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ force: true }).catch(() => btn.evaluate(el => el.click()));
        await detailPage.waitForTimeout(800);

        // Check IMMEDIATELY if an error modal ("Request failed! Validation failed...") appeared
        const errorModal = detailPage.locator('div, dialog')
          .filter({ hasText: /Request failed|Validation failed|invalid or has expired/i })
          .filter({ visible: true })
          .first();

        if (await errorModal.isVisible({ timeout: 1500 }).catch(() => false)) {
          console.log(`⚠️ Room option #${idx + 1} validation failed/expired. Dismissing error modal...`);
          const closeBtn = detailPage.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle, .modal button:has-text("Close"), dialog button:has-text("Close"), .modal-box button:has-text("✕")')
            .filter({ visible: true })
            .first();

          if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
            await closeBtn.click({ force: true }).catch(() => closeBtn.evaluate(el => el.click()));
          } else {
            await detailPage.keyboard.press('Escape').catch(() => {});
          }
          await detailPage.waitForTimeout(600);
          continue; // try next room option
        }

        // Wait for checkout navigation or lead guest input
        await detailPage.waitForURL(/\/hotel\/checkout/i, { timeout: 15000 }).catch(() => {});
        await detailPage.waitForLoadState('domcontentloaded').catch(() => {});

        const isCheckout = detailPage.url().includes('checkout');
        const hasForm = await detailPage.locator('input[name*="lead_guest_first_name"], input[placeholder*="First"]').filter({ visible: true }).first().isVisible({ timeout: 3000 }).catch(() => false);

        if (isCheckout || hasForm) {
          console.log(`✅ Successfully selected room option #${idx + 1} and reached Checkout page!`);
          return true;
        }
      }
    }

    console.log('⚠️ All room options on this hotel card failed validation or expired.');
    return false;
  }
}
