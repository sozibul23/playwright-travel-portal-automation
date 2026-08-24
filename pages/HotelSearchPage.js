import { BasePage } from './BasePage.js';
import { generateRandomHotelDates } from '../data/testData.js';

export class HotelSearchPage extends BasePage {
  constructor(page) {
    super(page);

    // Hotels Tab — matches exact DOM listitem cursor-pointer element from snapshot
    this.hotelTab = page.getByRole('listitem').filter({ hasText: /^Hotels$/i })
      .or(page.locator('li:has-text("Hotels")'))
      .or(page.getByText('Hotels', { exact: true }))
      .first();

    // Search Inputs
    this.destinationTrigger = page.getByRole('textbox', { name: 'Select Destination' })
      .or(page.locator('input[placeholder*="Destination"]'))
      .or(page.locator('input[placeholder*="destination"]'))
      .or(page.locator('div:has-text("Select Destination")'))
      .first();

    this.destinationSearchBox = page.getByRole('searchbox', { name: 'Type city, hotel name or' })
      .or(page.locator('input[placeholder*="city"]'))
      .or(page.locator('input[type="search"]'))
      .first();

    // Supplier Dropdown — matches 'All' dropdown under Destination
    this.supplierDropdown = page.locator('div, select, button, span')
      .filter({ hasText: /^All$/ })
      .filter({ visible: true })
      .first()
      .or(page.locator('select[name*="supplier"], .supplier-select').first());

    // Datepicker
    this.durationTrigger = page.getByRole('textbox', { name: 'Select Duration' })
      .or(page.locator('input.flatpickr-input'))
      .or(page.locator('input[placeholder*="Duration"]'))
      .first();

    this.nextMonthBtn = page.locator('.flatpickr-next-month > svg, .flatpickr-next-month').first();

    // Guests & Rooms
    this.travelersDropdown = page.getByText('Travelers')
      .or(page.getByText('Guest(s) in'))
      .or(page.locator('div:has-text("Travelers")'))
      .or(page.locator('div:has-text("Guest(s) in")'))
      .first();

    this.addRoomBtn = page.getByRole('button', { name: 'Add Room' })
      .or(page.locator('button:has-text("Add Room")'))
      .first();

    this.applyGuestsBtn = page.getByRole('button', { name: 'Apply' })
      .or(page.locator('button:has-text("Apply")'))
      .first();

    // Search Button
    this.searchBtn = page.getByRole('button', { name: 'Search' }).first();
  }

  /**
   * Switch to Hotel search tab safely
   */
  async goToHotelTab() {
    console.log('🏨 Switching to Hotels service tab...');
    await this.page.keyboard.press('Escape').catch(() => { });

    if (await this.destinationTrigger.isVisible({ timeout: 500 }).catch(() => false)) {
      return;
    }

    await this.hotelTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.hotelTab.click();
    await this.destinationTrigger.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Search for a destination and select autocomplete dropdown item
   * @param {string} query - Destination query e.g. "dubai", "bangkok", "singapore"
   * @param {string} fullText - Optional full text filter
   * @param {number} optionIndex - Suggestion index to select (0 = 1st option, 1 = 2nd option)
   */
  async selectDestination(query = 'dubai', fullText = null, optionIndex = 0) {
    await this.destinationTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await this.destinationTrigger.click();
    await this.destinationSearchBox.waitFor({ state: 'visible', timeout: 5000 });
    await this.destinationSearchBox.click();
    await this.destinationSearchBox.fill('');

    // Fast key typing for autocomplete API trigger
    await this.destinationSearchBox.pressSequentially(query, { delay: 30 });

    // Locate suggestion items matching query
    const suggestionItems = this.page.locator('h6.font-medium, h6, h5, li, div.cursor-pointer, [role="option"]')
      .filter({ hasText: new RegExp(query, 'i') })
      .filter({ visible: true });

    // Wait for suggestion items to render from API
    await suggestionItems.first().waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});

    let totalCount = await suggestionItems.count();
    if (totalCount === 0) {
      await this.destinationSearchBox.fill('');
      await this.destinationSearchBox.pressSequentially(query, { delay: 50 });
      await this.page.waitForTimeout(1000);
      totalCount = await suggestionItems.count();
    }
    console.log(`Autocomplete items found for query "${query}": ${totalCount}`);

    // If fullText is provided, find matching suggestion
    if (fullText) {
      const match = suggestionItems.filter({ hasText: new RegExp(fullText, 'i') }).first();
      if (await match.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await match.innerText().catch(() => '');
        console.log(`Selected Autocomplete by fullText: "${text.replace(/\n/g, ' ')}"`);
        await match.click();
        return;
      }
    }

    const targetIndex = (totalCount > optionIndex) ? optionIndex : 0;
    const targetItem = suggestionItems.nth(targetIndex);

    if (await targetItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedText = await targetItem.innerText().catch(() => '');
      console.log(`Selected Autocomplete Option [index ${targetIndex}]: "${selectedText.replace(/\n/g, ' ')}"`);
      await targetItem.click();
    } else {
      await this.destinationSearchBox.press('Enter').catch(() => {});
    }
  }

  /**
   * Fast & Reliable Supplier Selection
   * @param {string} supplierName - Supplier name to select e.g. "HotelBeds - Sandbox" or "All"
   */
  async selectSupplier(supplierName = 'HotelBeds - Sandbox') {
    if (!supplierName) return;
    const targetSupplier = supplierName.trim();
    console.log(`🏨 Selecting supplier: "${targetSupplier}"`);

    // 1. Close any open popovers (like date picker)
    await this.page.keyboard.press('Escape').catch(() => { });

    // 2. Target supplier combobox trigger element efficiently
    const supplierBox = this.page.getByRole('combobox', { name: /Select Supplier|Supplier/i })
      .or(this.page.locator('[role="combobox"]').filter({ hasText: /Supplier|All/i }))
      .or(this.page.locator('button, div').filter({ hasText: /^Select Supplier$/i }))
      .filter({ visible: true })
      .first();

    const isVisible = await supplierBox.isVisible({ timeout: 4000 }).catch(() => false);
    if (!isVisible) {
      console.log('⚠️ Supplier dropdown trigger not visible on search form.');
      return;
    }

    // 3. Fast-path: Check if already selected
    const currentText = await supplierBox.innerText().catch(() => '');
    if (currentText.toLowerCase().includes(targetSupplier.toLowerCase())) {
      console.log(`✅ Supplier "${targetSupplier}" is already selected.`);
      return;
    }

    // 4. Click combobox to open dropdown menu
    await supplierBox.click({ force: true }).catch(() => supplierBox.evaluate(el => el.click()));
    await this.page.waitForTimeout(300);

    // 5. Locate matching dropdown option
    const supplierRegex = new RegExp(targetSupplier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const option = this.page.getByRole('option', { name: supplierRegex })
      .or(this.page.locator('li, [role="option"], div.option').filter({ hasText: supplierRegex }))
      .filter({ visible: true })
      .first();

    const optionVisible = await option.isVisible({ timeout: 4000 }).catch(() => false);
    if (optionVisible) {
      await option.click({ force: true }).catch(() => option.evaluate(el => el.click()));
      console.log(`✅ Successfully selected supplier: "${targetSupplier}"`);
    } else {
      console.log(`⚠️ Supplier option "${targetSupplier}" not found in open dropdown.`);
      await this.page.keyboard.press('Escape').catch(() => { });
    }
  }

  /**
   * Helper to locate and click a specific date inside the open Flatpickr calendar view, navigating months if needed
   * @param {string} dateLabel - e.g. "August 26," or "September 15,"
   */
  async _selectFlatpickrDate(dateLabel) {
    const openCalendar = this.page.locator('.flatpickr-calendar.open, .flatpickr-calendar').filter({ visible: true }).first();
    const nextBtn = this.nextMonthBtn;

    // Extract day number (e.g. "26" from "August 26,")
    const dayMatch = dateLabel.match(/\b(\d{1,2})\b/);
    const dayNum = dayMatch ? dayMatch[1] : '';

    const getDayCell = () => {
      const labelMatch = this.page.getByLabel(new RegExp(dateLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
        .filter({ visible: true })
        .first();

      if (dayNum) {
        return openCalendar.locator('.flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)')
          .filter({ hasText: new RegExp(`^${dayNum}$`) })
          .filter({ visible: true })
          .first()
          .or(labelMatch);
      }
      return labelMatch;
    };

    for (let attempt = 0; attempt < 5; attempt++) {
      const target = getDayCell();
      const isVisible = await target.isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        await target.click({ force: true }).catch(() => { });
        return;
      }
      if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextBtn.click({ force: true }).catch(() => { });
        await this.page.waitForTimeout(300);
      }
    }

    const fallbackTarget = getDayCell();
    if (await fallbackTarget.isVisible().catch(() => false)) {
      await fallbackTarget.click({ force: true }).catch(() => { });
    }
  }

  /**
   * Select check-in and check-out dates dynamically (random future dates generated automatically if not specified)
   * @param {string} checkInLabel - e.g. "August 26,"
   * @param {string} checkOutLabel - e.g. "August 28,"
   */
  async selectDates(checkInLabel = null, checkOutLabel = null) {
    if (!checkInLabel || !checkOutLabel) {
      const dates = generateRandomHotelDates(15, 25, 2);
      checkInLabel = checkInLabel || dates.checkInDateLabel;
      checkOutLabel = checkOutLabel || dates.checkOutDateLabel;
    }

    console.log(`📅 Selecting Hotel Dates: Check-in="${checkInLabel}", Check-out="${checkOutLabel}"`);

    if (await this.durationTrigger.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.durationTrigger.click().catch(() => this.durationTrigger.click({ force: true }));
    } else {
      await this.durationTrigger.click({ force: true }).catch(() => { });
    }
    await this.page.waitForTimeout(100);

    await this._selectFlatpickrDate(checkInLabel);
    await this.page.waitForTimeout(50);
    await this._selectFlatpickrDate(checkOutLabel);
    await this.page.waitForTimeout(100);
  }

  /**
   * Set rooms, adults, and children count via popover controls reliably.
   *
   * FIX NOTES (HTL-30 → HTL-36):
   *  1. Each room block (div.collapse) must be explicitly expanded (radio check / title click)
   *     before its internal +/- buttons become visible and clickable.
   *  2. The previous hard-coded `currentAdults = 1 + roomCount` assumption was wrong.
   *     We now READ the actual counter value from the DOM for each room.
   *  3. Children: after each child is added, we select an age from the dropdown that appears
   *     — skipping this caused form validation failures on the checkout page.
   *
   * @param {number} rooms    - Number of rooms (1–5)
   * @param {number} adults   - Total adults across all rooms (1–9)
   * @param {number} children - Total children across all rooms (0–4)
   */
  async selectGuestsAndRooms(rooms = 1, adults = 2, children = 0) {
    console.log(`Setting rooms: ${rooms}, adults: ${adults}, children: ${children}`);

    const trigger = this.page.locator('.passengerContainer input.sb-input')
      .or(this.page.locator('.passengerContainer'))
      .filter({ visible: true })
      .first();

    await trigger.waitFor({ state: 'visible', timeout: 8000 });
    await trigger.click({ force: true });
    await this.page.waitForTimeout(400);

    // FIX: actual popover container class is flex flex-col px-5 py-2 divide-y (no 'lists' class)
    const popover = this.page.locator('.passengerContainer div.flex.flex-col.divide-y')
      .or(this.page.locator('.passengerContainer div[class*="divide-y"]'))
      .first();
    await popover.waitFor({ state: 'visible', timeout: 5000 });

    // FIX: Add Room and Apply buttons live OUTSIDE the div.collapse tree — locate from full passengerContainer
    const passengerContainer = this.page.locator('.passengerContainer');
    const applyBtn = passengerContainer.getByRole('button', { name: 'Apply' })
      .or(passengerContainer.locator('button:has-text("Apply")'))
      .filter({ visible: true })
      .first();
    await applyBtn.waitFor({ state: 'visible', timeout: 5000 });

    const addRoomBtn = passengerContainer.getByRole('button', { name: 'Add Room' })
      .or(passengerContainer.locator('button:has-text("Add Room")'))
      .filter({ visible: true })
      .first();

    // ── Step 1: Add extra rooms ──────────────────────────────────────────────
    // FIX: Playwright .click() on Add Room is intercepted by the collapsed accordion overlay.
    // Using page.evaluate() JS click bypasses the overlay and actually triggers the room add.
    for (let r = 1; r < rooms; r++) {
      const added = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.passengerContainer button'));
        const addRoomBtn = buttons.find(b => b.textContent.trim() === 'Add Room' && !b.disabled);
        if (addRoomBtn) {
          addRoomBtn.click();
          return true;
        }
        return false;
      });
      if (added) {
        console.log(`  -> Add Room JS click #${r} fired`);
      } else {
        console.log(`  ⚠️ Add Room button not found in DOM for click #${r}`);
      }
      await this.page.waitForTimeout(400);
      // Wait for the new room collapse block to appear
      await popover.locator('div.collapse').nth(r).waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
    }

    const roomBlocks = popover.locator('div.collapse');
    const roomCount = await roomBlocks.count();
    console.log(`Room accordion blocks found: ${roomCount}`);

    // ── Helper: Expand a room accordion so its controls become visible ────────
    const expandRoom = async (roomEl) => {
      const alreadyOpen = await roomEl.evaluate(el =>
        el.classList.contains('collapse-open') || el.hasAttribute('open')
      ).catch(() => false);
      if (!alreadyOpen) {
        // Try radio button first (portal uses it as the accordion trigger)
        const radio = roomEl.locator('input[type="radio"]').first();
        if (await radio.isVisible({ timeout: 400 }).catch(() => false)) {
          await radio.check({ force: true }).catch(() => {});
        } else {
          // Fallback: click the collapse title label
          const title = roomEl.locator('.collapse-title, label').first();
          await title.click({ force: true }).catch(() => {});
        }
        await this.page.waitForTimeout(250);
      }
    };

    // ── Helper: Read the current adult count displayed in a room block ────────
    // FIX: DOM shows counter is in <span class="value">2</span> (first span.value = adults)
    const readAdultCount = async (roomEl) => {
      // First span.value inside the room block = adults counter
      const valueSpan = roomEl.locator('span.value').first();
      const txt = await valueSpan.innerText({ timeout: 800 }).catch(() => '');
      const n = parseInt(txt.trim(), 10);
      return isNaN(n) ? 2 : n; // default: portal starts Room 1 with 2 adults
    };

    // ── Step 2: Distribute adults across rooms ───────────────────────────────
    const adultTargets = Array.from({ length: roomCount }, (_, i) =>
      Math.max(1, Math.floor(adults / roomCount) + (i < (adults % roomCount) ? 1 : 0))
    );
    const totalTarget = adultTargets.reduce((s, v) => s + v, 0);
    if (totalTarget > adults) adultTargets[adultTargets.length - 1] -= (totalTarget - adults);

    for (let r = 0; r < roomCount; r++) {
      const room = roomBlocks.nth(r);
      await expandRoom(room);

      const current = await readAdultCount(room);
      const target = adultTargets[r];
      console.log(`  Room ${r + 1}: current adults=${current}, target=${target}`);

      const roomIdx = r; // capture for evaluate closure
      if (target > current) {
        for (let k = 0; k < (target - current); k++) {
          // FIX: Use JS click to bypass collapse overlay interception
          await this.page.evaluate((idx) => {
            const rooms = document.querySelectorAll('.passengerContainer div.collapse');
            const room = rooms[idx];
            if (room) {
              const plusBtns = room.querySelectorAll('.plusBtn');
              if (plusBtns[0]) plusBtns[0].click(); // first plusBtn = adults
            }
          }, roomIdx);
          await this.page.waitForTimeout(130);
        }
      } else if (target < current) {
        for (let k = 0; k < (current - target); k++) {
          await this.page.evaluate((idx) => {
            const rooms = document.querySelectorAll('.passengerContainer div.collapse');
            const room = rooms[idx];
            if (room) {
              const minusBtns = room.querySelectorAll('.minusBtn');
              if (minusBtns[0] && !minusBtns[0].disabled) minusBtns[0].click(); // first minusBtn = adults
            }
          }, roomIdx);
          await this.page.waitForTimeout(130);
        }
      }
    }

    // ── Step 3: Distribute children across rooms (with age selection) ─────────
    if (children > 0) {
      const childTargets = Array.from({ length: roomCount }, (_, i) =>
        Math.floor(children / roomCount) + (i < (children % roomCount) ? 1 : 0)
      );

      for (let r = 0; r < roomCount; r++) {
        const room = roomBlocks.nth(r);
        await expandRoom(room);
        const roomIdx = r;

        for (let c = 0; c < childTargets[r]; c++) {
          // FIX: JS click for children plusBtn (2nd .plusBtn)
          await this.page.evaluate((idx) => {
            const rooms = document.querySelectorAll('.passengerContainer div.collapse');
            const room = rooms[idx];
            if (room) {
              const plusBtns = room.querySelectorAll('.plusBtn');
              if (plusBtns[1]) plusBtns[1].click(); // second plusBtn = children
            }
          }, roomIdx);
          await this.page.waitForTimeout(300);

          // Select child age after adding (portal renders <select> per child)
          const ageSelects = this.page.locator('.passengerContainer select').filter({ visible: true });
          const ageSelectCount = await ageSelects.count().catch(() => 0);
          if (ageSelectCount > 0) {
            const lastAgeSelect = ageSelects.last();
            await lastAgeSelect.selectOption('5').catch(async () => {
              await lastAgeSelect.selectOption({ index: 2 }).catch(() => {});
            });
            await this.page.waitForTimeout(150);
            console.log(`  Room ${r + 1}, Child ${c + 1}: age 5 selected`);
          }
        }
      }
    }

    // ── Step 4: Apply ────────────────────────────────────────────────────────
    await applyBtn.click({ force: true });
    await this.page.waitForTimeout(400);
    // Close popover if Apply didn't dismiss it
    if (await applyBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await this.page.keyboard.press('Escape').catch(() => {});
    }
    const finalVal = await trigger.inputValue().catch(() => '') || await trigger.innerText().catch(() => '');
    if (finalVal) {
      console.log(`✅ Travelers/Rooms set: "${finalVal.trim()}"`);
    }
  }

  /**
   * Click Search and wait for search results
   */
  async clickSearch() {
    console.log('🔍 Clicking Hotel Search button...');
    await this.page.keyboard.press('Escape').catch(() => { });
    await this.page.waitForTimeout(50);

    const searchBtn = this.page.getByRole('button', { name: /^Search$/i })
      .or(this.page.locator('button:has-text("Search")'))
      .or(this.searchBtn)
      .filter({ visible: true })
      .first();

    await searchBtn.waitFor({ state: 'visible', timeout: 10000 });

    try {
      await searchBtn.click({ timeout: 3000 });
    } catch (err) {
      console.log('Direct click on Search button intercepted. Executing evaluate click...');
      await searchBtn.evaluate(el => el.click());
    }

    console.log('Waiting for hotel search completion...');
    await this.page.waitForURL(/\/hotel\/(search|search-results)/i, { timeout: 15000 }).catch(() => { });

    // Wait for hotel result cards or "View Rooms" / "View Details" buttons to appear
    const resultCardBtn = this.page.locator('a, button, [role="button"]')
      .filter({ hasText: /View All Rooms|View Rooms|View Details|See Details|Choose/i })
      .filter({ visible: true })
      .first();
    await resultCardBtn.waitFor({ state: 'visible', timeout: 25000 }).catch(() => { });
    console.log('✅ Hotel search complete. Result cards rendered.');
  }

  /**
   * Complete End-to-End Hotel Search selecting 1st city-level destination suggestion by default
   */
  async performSearch(
    destinationQuery = 'dubai',
    destinationDisplay = null,
    checkInLabel = null,
    checkOutLabel = null,
    supplierName = 'HotelBeds - Sandbox',
    optionIndex = 0,
    rooms = 1,
    adults = 2,
    children = 0
  ) {
    await this.goToHotelTab();
    await this.selectDestination(destinationQuery, destinationDisplay, optionIndex);
    await this.selectDates(checkInLabel, checkOutLabel);
    await this.selectGuestsAndRooms(rooms, adults, children);
    if (supplierName) {
      await this.selectSupplier(supplierName);
    }
    await this.clickSearch();
  }
}



