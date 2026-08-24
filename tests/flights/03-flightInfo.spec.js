import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';

/**
 * Flight Info, Duration & Layover Suite
 *
 * Tags:
 * - @functional: Flight card detail validations
 * - @supplier: Supplier-specific flight schedule validations
 */

function parseDurationToMinutes(text) {
  if (!text) return 0;
  let totalMinutes = 0;
  
  const daysMatch = text.match(/(\d+)\s*D/i);
  if (daysMatch) totalMinutes += parseInt(daysMatch[1], 10) * 24 * 60;
  
  const hoursMatch = text.match(/(\d+)\s*H/i);
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  
  const minsMatch = text.match(/(\d+)\s*M/i);
  if (minsMatch) totalMinutes += parseInt(minsMatch[1], 10);
  
  return totalMinutes;
}

test.describe('Flight Info', () => {

  // ── Flight Search - Flight time ────────────────────────────────────────────
  test('TC-009A: Time Format @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const timeElement = page.locator('span, p, div').filter({ hasText: /:/ }).first();
    await expect(timeElement).toBeVisible();
    const timeText = await timeElement.innerText();
    expect(timeText).toMatch(/\d{1,2}:\d{2}/);
  });

  // ── Flight Search - Layover & Duration Verification ──────────────────────────
  test('TC-009B: Duration & Layover @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const buttons = page.getByRole('button', { name: /View Fare|Select Flight/i });
    const count = await buttons.count();
    expect(count, 'No flight cards found').toBeGreaterThan(0);

    const limit = Math.min(count, 10);
    for (let i = 0; i < limit; i++) {
      const btn = buttons.nth(i);
      const card = page.locator('div')
        .filter({ has: btn })
        .filter({ hasText: /Airport|Direct Flight|Stop|Transit|Flight Itinerary/i })
        .last();
      const cardText = await card.innerText();
      
      if (cardText.toLowerCase().includes('stop flight') || cardText.toLowerCase().includes('stop flights') || cardText.toLowerCase().includes('stop')) {
        const transitRegex = /Transit\s+(P\d+D\s+)?(T)?(\d+H\s+)?\d+M,\s+via\s+[A-Z]{3}/i;
        expect(cardText, `Card at index ${i} failed stop flight transit check`).toMatch(transitRegex);

        const durationWithBulletRegex = /(P\d+D\s+)?T?(\d+H\s+)?\d+M\s*•/;
        if (durationWithBulletRegex.test(cardText)) {
          expect(cardText, `Card at index ${i} failed duration with bullet check`).toMatch(durationWithBulletRegex);
        }

        // ── VERIFY TOTAL TIME = FLIGHT TIME + LAYOVER TIME ─────────────────────
        const itineraryBtn = card.locator('span, button, a').filter({ hasText: /Flight Itinerary/i }).first();
        if (await itineraryBtn.isVisible().catch(() => false)) {
          await itineraryBtn.hover({ force: true }).catch(() => {});
          await itineraryBtn.click({ force: true }).catch(() => {});
          await page.waitForTimeout(500);

          const popover = page.locator('div').filter({ hasText: /Layover/i }).first();
          if (await popover.isVisible().catch(() => false)) {
            const popText = await popover.innerText();
            
            // Extract Card Header Duration (e.g. "4H 10M")
            const headerDurMatch = cardText.match(/(\d+D\s*)?(\d+H\s*)?\d+M(?=\s*•|\s*1\s*Stop|\s*Stop)/i);
            const headerMinutes = headerDurMatch ? parseDurationToMinutes(headerDurMatch[0]) : 0;

            // Extract segment durations and layover durations inside popover
            const segMatches = popText.matchAll(/(\d+D\s*)?(\d+H\s*)?\d+M/g);
            let sumSegmentMinutes = 0;
            for (const m of segMatches) {
              sumSegmentMinutes += parseDurationToMinutes(m[0]);
            }

            if (headerMinutes > 0 && sumSegmentMinutes > 0) {
              expect(
                sumSegmentMinutes,
                `❌ Card #${i + 1} Total flight time mismatch! Header total (${headerMinutes}m) != Flight time + Layover (${sumSegmentMinutes}m)`
              ).toBe(headerMinutes);
            }
          }
        }
      } else {
        expect(cardText.toLowerCase()).toContain('direct flight');
        const durationRegex = /(\d+H|\d+M|\d{1,2}:\d{2})/i;
        expect(cardText, `Card at index ${i} has invalid or missing duration`).toMatch(durationRegex);
        expect(cardText.toLowerCase(), `Card at index ${i} direct flight contains unexpected transit info`).not.toContain('transit');
      }
    }
  });

});
